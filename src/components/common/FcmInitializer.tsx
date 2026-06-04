"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function FcmInitializer() {
  const { data: session } = useSession();

  useEffect(() => {
    // Only register push notifications for authenticated users on client side
    if (!session?.user?.id) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Check configuration parameters
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.messagingSenderId) {
      console.warn("FCM credentials missing from environment. Skipping push registration.");
      return;
    }

    const initFcm = async () => {
      try {
        // Request notifications permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("FCM push notifications permission denied by user.");
          return;
        }

        // Initialize Firebase client dynamically to prevent server-side Node execution failures
        const { initializeApp } = await import("firebase/app");
        const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        // Build dynamic service worker URL passing public keys (Vercel-friendly)
        const swUrl = `/firebase-messaging-sw.js` +
          `?apiKey=${encodeURIComponent(firebaseConfig.apiKey || "")}` +
          `&authDomain=${encodeURIComponent(firebaseConfig.authDomain || "")}` +
          `&projectId=${encodeURIComponent(firebaseConfig.projectId || "")}` +
          `&storageBucket=${encodeURIComponent(firebaseConfig.storageBucket || "")}` +
          `&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId || "")}` +
          `&appId=${encodeURIComponent(firebaseConfig.appId || "")}`;

        const registration = await navigator.serviceWorker.register(swUrl, {
          scope: "/",
        });

        // Request FCM registration token
        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (token) {
          console.log("FCM Push Registration Token obtained:", token);
          // Register token to user profile
          await fetch("/api/user/fcm-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        }

        // Foreground messaging event listener
        onMessage(messaging, (payload) => {
          console.log("FCM push received in foreground:", payload);
          if (payload.notification) {
            // Trigger standard browser native notification banner in foreground
            new Notification(payload.notification.title || "AspireMint Update", {
              body: payload.notification.body,
              icon: payload.data?.icon || "/favicon.svg",
            });
          }
        });

      } catch (err) {
        console.error("FCM Initializer Error:", err);
      }
    };

    // Delay registration slightly to prevent layout blocking during initial render
    const delayTimer = setTimeout(() => {
      initFcm();
    }, 3000);

    return () => clearTimeout(delayTimer);
  }, [session]);

  return null;
}

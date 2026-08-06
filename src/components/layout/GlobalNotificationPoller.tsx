"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { usePusher } from "@/hooks/usePusher";

export function GlobalNotificationPoller() {
  const { data: session } = useSession();
  const lastPolledRef = useRef<Date | null>(null);
  const [usePollingFallback, setUsePollingFallback] = useState(true);

  const userId = session?.user?.id;
  const privateChannel = userId ? `private-user-${userId}` : undefined;

  // 1. Pusher WebSocket Listeners (True Real-Time)
  // Listen to private user-specific notifications
  const pusherInstance = usePusher(
    privateChannel,
    "notification-created",
    (notif: any) => {
      console.log("[Pusher Realtime Event] Single notification received:", notif);
      toast(notif.title + "|" + notif.message, {
        id: notif._id,
      });
      // Synchronize lastPolledRef so if we do fall back to polling, we don't repeat toasts
      lastPolledRef.current = new Date(notif.createdAt);
      
      // Dispatch global event to force UI components (like the Orders table) to re-fetch data instantly
      if (typeof window !== 'undefined') {
         window.dispatchEvent(new CustomEvent("FCM_REFRESH_DATA"));
      }
    }
  );

  // Listen to public global broadcasts
  usePusher(
    "public-broadcasts",
    "broadcast-created",
    (broadcast: any) => {
      console.log("[Pusher Realtime Event] Global broadcast received:", broadcast);
      toast(broadcast.title + "|" + broadcast.message, {
        id: `broadcast-${Date.now()}`,
      });
    }
  );

  // 2. Pusher Connection Health Monitor
  useEffect(() => {
    if (!pusherInstance) {
      setUsePollingFallback(true);
      return;
    }

    const checkPusherConnection = () => {
      const state = pusherInstance.connection.state;
      console.log(`[Pusher Connection Monitor] State: ${state}`);
      
      if (state === "connected") {
        setUsePollingFallback(false); // Disable polling loop! WebSockets are live.
      } else if (state === "failed" || state === "unavailable") {
        setUsePollingFallback(true); // Fallback to polling! Limits exceeded or offline.
      }
    };

    // Initial check
    checkPusherConnection();

    // Bind state change listeners
    pusherInstance.connection.bind("state_change", checkPusherConnection);

    return () => {
      pusherInstance.connection.unbind("state_change", checkPusherConnection);
    };
  }, [pusherInstance]);

  // 3. Graceful HTTP Polling Fallback (Only active if WebSockets fail or limits are hit)
  useEffect(() => {
    if (!session?.user || !usePollingFallback) return;

    console.log("[Notification Engine] Active Mode: Resilient HTTP Polling Loop (8s interval)");

    if (!lastPolledRef.current) {
      lastPolledRef.current = new Date();
    }

    const pollNotifications = async () => {
      try {
        const sinceStr = lastPolledRef.current?.toISOString();
        const res = await fetch(`/api/notifications?since=${sinceStr}`);
        if (!res.ok) return;
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;

        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          // Toast each new notification
          json.data.forEach((notif: any) => {
            toast(notif.title + "|" + notif.message, {
              id: notif._id,
            });
          });

          // Update lastPolledRef to the latest createdAt
          const maxDateStr = json.data.reduce((max: string, current: any) => {
            return new Date(current.createdAt) > new Date(max) ? current.createdAt : max;
          }, json.data[0].createdAt);
          
          lastPolledRef.current = new Date(maxDateStr);
          
          if (typeof window !== 'undefined') {
             window.dispatchEvent(new CustomEvent("FCM_REFRESH_DATA"));
          }
        }
      } catch (err) {
        console.error("Failed to poll notifications", err);
      }
    };

    const interval = setInterval(pollNotifications, 30000);
    return () => clearInterval(interval);
  }, [session, usePollingFallback]);

  return null;
}

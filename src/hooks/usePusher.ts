"use client";

import { useEffect, useRef } from 'react';

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

// Global client-side Pusher singleton instance
let pusherInstance: any = null;

export function usePusher(
  channelName: string | undefined,
  eventName: string,
  onEventTriggered: (data: any) => void
) {
  const callbackRef = useRef(onEventTriggered);

  // Keep latest callback ref to avoid resetting subscription on callback changes
  useEffect(() => {
    callbackRef.current = onEventTriggered;
  }, [onEventTriggered]);

  useEffect(() => {
    if (typeof window === 'undefined' || !pusherKey || !pusherCluster || !channelName) return;

    let channel: any = null;

    const initPusher = async () => {
      if (!pusherInstance) {
        try {
          // Dynamically import pusher-js only on the client side
          const PusherModule = await import('pusher-js');
          const PusherClass = PusherModule.default || PusherModule;

          if (process.env.NODE_ENV === 'development') {
            (PusherClass as any).logToConsole = true;
          }

          pusherInstance = new PusherClass(pusherKey, {
            cluster: pusherCluster,
            authEndpoint: '/api/pusher/auth', // Auto-authorized via Next-Auth
          });

          pusherInstance.connection.bind('error', (err: any) => {
            console.warn('[Pusher Client Connection Warning] Real-time sockets encountered a problem:', err);
          });

          pusherInstance.connection.bind('failed', () => {
            console.warn('[Pusher Client Connection Failed] WebSockets disabled. The system will fall back to normal operations.');
          });
        } catch (err) {
          console.error('Failed to initialize Pusher client:', err);
          return;
        }
      }

      if (!pusherInstance) return;

      try {
        // Subscribe to the channel
        channel = pusherInstance.subscribe(channelName);

        // Bind the custom event listener
        channel.bind(eventName, (data: any) => {
          try {
            callbackRef.current(data);
          } catch (callbackErr) {
            console.error('[Pusher Event Handler Error] Failed executing callback:', callbackErr);
          }
        });
      } catch (err) {
        console.warn(`[Pusher Subscription Bypassed] Gracefully skipped subscribing to "${channelName}" :`, err);
      }
    };

    initPusher();

    // Cleanup subscription on unmount
    return () => {
      if (channel && pusherInstance) {
        try {
          channel.unbind(eventName);
          pusherInstance.unsubscribe(channelName);
        } catch (cleanupErr) {
          console.warn('[Pusher Subscription Cleanup Bypassed] Cleanup warning:', cleanupErr);
        }
      }
    };
  }, [channelName, eventName]);

  return pusherInstance;
}

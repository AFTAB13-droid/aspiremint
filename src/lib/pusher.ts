import PusherServer from 'pusher';

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

let pusherServer: PusherServer | null = null;

if (appId && key && secret && cluster) {
  try {
    pusherServer = new PusherServer({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
    console.log("Pusher Server initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Pusher Server:", err);
  }
} else {
  console.warn("Pusher environment credentials missing. Real-time updates are disabled.");
}

/**
 * Resilient helper to trigger Pusher events.
 * If Pusher fails, is down, or has exceeded its free tier limits, this catches the exception
 * and fails silently, ensuring the database transaction and HTTP request complete successfully.
 */
export async function triggerRealtimeEvent(
  channel: string,
  event: string,
  data: any
): Promise<boolean> {
  if (!pusherServer) return false;

  try {
    // Non-blocking fire-and-forget push
    pusherServer.trigger(channel, event, data).catch(err => {
      console.warn(`[Pusher Trigger Error] Channel: "${channel}" | Event: "${event}" | Reason:`, err.message || err);
    });
    return true;
  } catch (error: any) {
    console.warn(`[Pusher Trigger Sync Error] Channel: "${channel}" | Event: "${event}" | Reason:`, error.message || error);
    return false;
  }
}

export { pusherServer };

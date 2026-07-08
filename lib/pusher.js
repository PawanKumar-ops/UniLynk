import Pusher from "pusher";

export const pusherServer =
  process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true,
      })
    : null;

export function userChannel(userId) {
  return `private-user-${userId}`;
}

export function communityChannel(communityId) {
  return `private-community-${communityId}`;
}

export async function triggerPusher(channels, event, payload) {
  if (!pusherServer) return;
  await pusherServer.trigger(channels, event, payload);
}

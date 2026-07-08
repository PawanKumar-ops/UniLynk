"use client";

import Pusher from "pusher-js";

let clientPromise;

export async function getPusherClient() {
  if (!clientPromise) {
    clientPromise = fetch("/api/pusher/config", { cache: "no-store" })
      .then((res) => res.json())
      .then(({ key, cluster }) => {
        if (!key || !cluster) return null;
        return new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" });
      });
  }
  return clientPromise;
}

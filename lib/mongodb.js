import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;


let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in .env.local");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongooseInstance) => mongooseInstance)
      .catch((error) => {
        cached.promise = null;

        const isSrvResolutionIssue =
          error?.code === "ECONNREFUSED" && error?.syscall === "querySrv";

        if (isSrvResolutionIssue) {
          throw new Error(
            "Failed to resolve MongoDB SRV record. Check DNS/network access or switch to a non-SRV MongoDB URI for this environment."
          );
        }

        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

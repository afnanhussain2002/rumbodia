import "server-only";
import { MongoClient, type Collection, type Db, type Document } from "mongodb";
import { AppError } from "@/server/http";

/**
 * One MongoDB connection for the whole server process.
 *
 * In dev, Next reloads modules on every edit, so the client is parked on `globalThis`
 * to avoid opening a new connection pool per reload.
 */
const globalForMongo = globalThis as unknown as {
  __rumbodiaMongo?: Promise<MongoClient>;
  __rumbodiaIndexes?: Promise<void>;
};

function getUri(): string {
  const uri = (process.env.MONGO_URI ?? process.env.MONGODB_URI)?.trim();
  if (!uri) {
    throw new AppError(
      "MONGO_URI is missing. Add your MongoDB connection string to .env, then restart the dev server.",
      500,
      "missing_mongo_uri",
    );
  }
  return uri;
}

function getClient(): Promise<MongoClient> {
  if (!globalForMongo.__rumbodiaMongo) {
    const client = new MongoClient(getUri(), { serverSelectionTimeoutMS: 8_000 });
    globalForMongo.__rumbodiaMongo = client.connect().catch((err) => {
      // Let the next request retry instead of caching a failed connection forever.
      globalForMongo.__rumbodiaMongo = undefined;
      console.error("[mongo] Connection failed:", err);
      throw new AppError("Could not reach the database. Check MONGO_URI and your network access list.", 503, "db_unavailable");
    });
  }
  return globalForMongo.__rumbodiaMongo;
}

/** The database named in the URI path, or `MONGODB_DB`, or "rumbodia". */
export async function getDb(): Promise<Db> {
  const client = await getClient();
  const db = client.db(process.env.MONGODB_DB?.trim() || undefined);
  if (db.databaseName === "test" && !process.env.MONGODB_DB?.trim()) return client.db("rumbodia");
  return db;
}

/** Create indexes once per process. Safe to call on every request. */
async function ensureIndexes(db: Db): Promise<void> {
  if (!globalForMongo.__rumbodiaIndexes) {
    globalForMongo.__rumbodiaIndexes = Promise.all([
      db.collection("entries").createIndex({ userId: 1, id: 1 }, { unique: true }),
      db.collection("entries").createIndex({ userId: 1, createdAt: 1 }),
      db.collection("insights").createIndex({ userId: 1, weekStart: 1 }, { unique: true }),
      db.collection("billing").createIndex({ stripeCustomerId: 1 }, { sparse: true }),
      db.collection("admin_audit").createIndex({ createdAt: -1 }),
      db.collection("admin_audit").createIndex({ targetUserId: 1, createdAt: -1 }),
    ])
      .then(() => undefined)
      .catch((err) => {
        globalForMongo.__rumbodiaIndexes = undefined;
        throw err;
      });
  }
  return globalForMongo.__rumbodiaIndexes;
}

export type CollectionName = "entries" | "goals" | "settings" | "insights" | "billing" | "admin_audit";

export async function collection<T extends Document>(name: CollectionName): Promise<Collection<T>> {
  const db = await getDb();
  await ensureIndexes(db);
  return db.collection<T>(name);
}

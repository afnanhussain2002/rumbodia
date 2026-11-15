import "server-only";
import type { Filter } from "mongodb";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { entrySchema } from "@/lib/schemas";
import { collection } from "@/server/db/mongo";
import { serverTimezone, timeOfDayInZone } from "@/server/timezone";
import type { Entry, TagCount } from "@/types";

/** Stored shape: the entry plus the Clerk user that owns it. Mongo adds its own `_id`. */
type EntryDoc = Entry & { userId: string };

const entries = () => collection<EntryDoc>("entries");

/**
 * Validate one record and fill any missing field.
 * Missing tags → [], missing timeOfDay → derived from createdAt, missing updatedAt → null,
 * missing model → "unknown". Records that cannot be repaired are dropped (and logged).
 */
export function normalizeEntry(raw: unknown): Entry | null {
  const parsed = entrySchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[entries] Skipping unreadable entry:", parsed.error.issues[0]?.message);
    return null;
  }
  const e = parsed.data;
  return {
    ...e,
    // Always store UTC ISO strings so Mongo's string range queries sort in time order.
    createdAt: new Date(e.createdAt).toISOString(),
    timeOfDay: e.timeOfDay ?? timeOfDayInZone(e.createdAt, serverTimezone(), DEFAULT_SETTINGS.timeOfDayStarts),
  };
}

/** Strip Mongo's `_id` and our `userId` so callers only ever see the domain `Entry`. */
function fromDoc(doc: unknown): Entry | null {
  if (!doc || typeof doc !== "object") return null;
  const rest = { ...(doc as Record<string, unknown>) };
  delete rest._id;
  delete rest.userId;
  return normalizeEntry(rest);
}

const fromDocs = (docs: unknown[]) => docs.map(fromDoc).filter((e): e is Entry => e !== null);

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const OLDEST_FIRST = { createdAt: 1, id: 1 } as const;

export interface ListFilter {
  /** Inclusive ISO lower bound. */
  from?: string;
  /** Exclusive ISO upper bound. */
  to?: string;
  tag?: string;
  /** Case-insensitive search over text, reason and tags. */
  q?: string;
}

function buildFilter(userId: string, filter: ListFilter): Filter<EntryDoc> {
  const query: Filter<EntryDoc> = { userId };
  const range: { $gte?: string; $lt?: string } = {};
  if (filter.from) range.$gte = new Date(filter.from).toISOString();
  if (filter.to) range.$lt = new Date(filter.to).toISOString();
  if (range.$gte || range.$lt) query.createdAt = range;
  if (filter.tag) query.tags = filter.tag;
  if (filter.q) {
    const re = new RegExp(escapeRegex(filter.q), "i");
    query.$or = [{ text: re }, { reason: re }, { tags: re }];
  }
  return query;
}

/** Every method takes the Clerk `userId` first, so one user can never read or touch another's log. */
export const entriesRepository = {
  /** Entries matching the filter, oldest first. */
  async list(userId: string, filter: ListFilter = {}): Promise<Entry[]> {
    const docs = await (await entries()).find(buildFilter(userId, filter)).sort(OLDEST_FIRST).toArray();
    return fromDocs(docs);
  },

  async get(userId: string, id: string): Promise<Entry | null> {
    return fromDoc(await (await entries()).findOne({ userId, id }));
  },

  /** The latest `count` entries before `before` (ISO), oldest first. */
  async listRecent(userId: string, count: number, before?: string): Promise<Entry[]> {
    const query: Filter<EntryDoc> = { userId };
    if (before) query.createdAt = { $lt: new Date(before).toISOString() };
    const docs = await (await entries())
      .find(query)
      .sort({ createdAt: -1, id: -1 })
      .limit(count)
      .toArray();
    return fromDocs(docs).reverse();
  },

  async create(userId: string, entry: Entry): Promise<Entry> {
    await (await entries()).insertOne({ ...entry, userId });
    return entry;
  },

  /** Replace an entry by id. Returns null if it does not exist. */
  async replace(userId: string, entry: Entry): Promise<Entry | null> {
    const result = await (await entries()).replaceOne({ userId, id: entry.id }, { ...entry, userId });
    return result.matchedCount > 0 ? entry : null;
  },

  /** Insert or replace (used by Undo). */
  async upsert(userId: string, entry: Entry): Promise<Entry> {
    await (await entries()).replaceOne({ userId, id: entry.id }, { ...entry, userId }, { upsert: true });
    return entry;
  },

  /** Returns true if something was deleted. */
  async remove(userId: string, id: string): Promise<boolean> {
    const result = await (await entries()).deleteOne({ userId, id });
    return result.deletedCount > 0;
  },

  /** Merge by id (incoming wins). */
  async merge(userId: string, incoming: Entry[]): Promise<number> {
    if (incoming.length === 0) return 0;
    await (await entries()).bulkWrite(
      incoming.map((e) => ({
        replaceOne: { filter: { userId, id: e.id }, replacement: { ...e, userId }, upsert: true },
      })),
      { ordered: false },
    );
    return incoming.length;
  },

  /** Make the log exactly `list`: upsert everything, then drop whatever is not in it. */
  async replaceAll(userId: string, list: Entry[]): Promise<number> {
    const col = await entries();
    await this.merge(userId, list);
    await col.deleteMany({ userId, id: { $nin: list.map((e) => e.id) } });
    return list.length;
  },

  async clear(userId: string): Promise<void> {
    await (await entries()).deleteMany({ userId });
  },

  /** Tag usage, most used first. */
  async tags(userId: string): Promise<TagCount[]> {
    const rows = await (await entries())
      .aggregate<{ _id: string; count: number }>([
        { $match: { userId } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
      ])
      .toArray();
    return rows
      .map((r) => ({ name: r._id, count: r.count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  },
};

import { openDB } from "idb";

const dbPromise = openDB("ifesquare-offline", 1, {
  upgrade(db) {
    db.createObjectStore("pending-mutations", { keyPath: "id" });
  },
});

type QueuedMutation = {
  id: string;
  url: string;
  method: string;
  body: unknown;
  createdAt: number;
  tempId?: number;
};

const syncChannel =
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("ifesquare-sync")
    : null;

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    if (typeof window !== "undefined" && event.data && typeof event.data === "object") {
      const { type, detail } = event.data;
      if (type === "pending-sync-change") {
        window.dispatchEvent(new CustomEvent("pending-sync-change"));
      } else if (type === "app-data-sync") {
        window.dispatchEvent(new CustomEvent("app-data-sync", { detail }));
      } else if (type === "app-sync-skipped") {
        window.dispatchEvent(new CustomEvent("app-sync-skipped", { detail }));
      }
    }
  };
}

function dispatchChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pending-sync-change"));
    syncChannel?.postMessage({ type: "pending-sync-change" });
  }
}

export async function queueMutation(
  url: string,
  method: string,
  body: unknown,
  opts?: { tempId?: number },
): Promise<string> {
  const db = await dbPromise;
  const id = crypto.randomUUID();
  await db.put("pending-mutations", {
    id,
    url,
    method,
    body: body === undefined ? undefined : JSON.parse(JSON.stringify(body)),
    createdAt: Date.now(),
    ...(opts?.tempId != null ? { tempId: opts.tempId } : {}),
  } satisfies QueuedMutation);
  dispatchChange();
  return id;
}

export async function removeMutation(id: string) {
  const db = await dbPromise;
  await db.delete("pending-mutations", id);
  dispatchChange();
}

export async function getPendingMutations() {
  const db = await dbPromise;
  return db.getAll("pending-mutations");
}

export async function getPendingCount() {
  const db = await dbPromise;
  return db.count("pending-mutations");
}

/**
 * Replays queued mutations in insertion order.
 * - Uses Web Locks to prevent concurrent execution across multiple tabs.
 */
export async function replayQueue(): Promise<{ replayed: number; skipped: number }> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return unsafeReplayQueue();
  }

  const result = await navigator.locks.request(
    "ifesquare-offline-replay-lock",
    { ifAvailable: true },
    async (lock) => {
      if (!lock) {
        // Lock already held by another tab - skip
        return { replayed: 0, skipped: 0 };
      }
      return unsafeReplayQueue();
    }
  );

  return result ?? { replayed: 0, skipped: 0 };
}

/**
 * Performs actual queue replay without safety locks.
 * Called internally after lock acquisition.
 */
async function unsafeReplayQueue(): Promise<{ replayed: number; skipped: number }> {
  const db = await dbPromise;
  const pending = await db.getAll("pending-mutations");
  if (pending.length === 0) {
    return { replayed: 0, skipped: 0 };
  }

  const idMapping = new Map<number, number>(); // tempId -> real product id
  let replayed = 0;
  let skipped = 0;

  for (const item of pending) {
    let url = item.url;
    if (idMapping.size > 0) {
      url = url.replace(/\/-(\d+)\b(?=\/|$)/, (m: string, temp: string) => {
        const real = idMapping.get(Number(temp));
        return real != null ? `/${real}` : m;
      });
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: item.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
    } catch {
      break; // still offline — keep the rest queued
    }

    if (res.ok) {
      if (
        item.tempId != null &&
        item.method === "POST" &&
        !Array.isArray((item.body as { products?: unknown })?.products)
      ) {
        try {
          const created = (await res.json()) as { id?: number };
          if (typeof created.id === "number") {
            idMapping.set(item.tempId, created.id);
          }
        } catch {
          // response has no JSON body — nothing to reconcile
        }
      }
      await db.delete("pending-mutations", item.id);
      replayed++;
    } else {
      // Server rejected it (validation, already deleted, etc.) — drop and continue.
      await db.delete("pending-mutations", item.id);
      skipped++;
    }
  }

  dispatchChange();

  if (typeof window !== "undefined") {
    if (replayed > 0) {
      const detail = { replayed };
      window.dispatchEvent(new CustomEvent("app-data-sync", { detail }));
      syncChannel?.postMessage({ type: "app-data-sync", detail });
    }
    if (skipped > 0) {
      const detail = { skipped };
      window.dispatchEvent(new CustomEvent("app-sync-skipped", { detail }));
      syncChannel?.postMessage({ type: "app-sync-skipped", detail });
    }
  }
  return { replayed, skipped };
}

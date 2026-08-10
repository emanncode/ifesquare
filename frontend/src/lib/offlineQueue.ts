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

function dispatchChange() {
  window.dispatchEvent(new CustomEvent("pending-sync-change"));
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
 * - Network failures stop the loop (still offline).
 * - Permanent failures (4xx/5xx) drop that mutation so it can't block the rest.
 * - Single-product creates return the server id, which is used to rewrite
 *   later queued URLs that referenced the offline temp id.
 * - After a full flush, dispatches `app-data-sync` so data hooks re-pull.
 */
export async function replayQueue(): Promise<{ replayed: number; skipped: number }> {
  const db = await dbPromise;
  const pending = await db.getAll("pending-mutations");
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
  if (replayed > 0) {
    window.dispatchEvent(new CustomEvent("app-data-sync", { detail: { replayed } }));
  }
  if (skipped > 0) {
    window.dispatchEvent(new CustomEvent("app-sync-skipped", { detail: { skipped } }));
  }
  return { replayed, skipped };
}

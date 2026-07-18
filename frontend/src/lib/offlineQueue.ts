import { openDB } from "idb";

const dbPromise = openDB("ifesquare-offline", 1, {
  upgrade(db) {
    db.createObjectStore("pending-mutations", { keyPath: "id" });
  },
});

function dispatchChange() {
  window.dispatchEvent(new CustomEvent("pending-sync-change"));
}

export async function queueMutation(url: string, method: string, body: unknown) {
  const db = await dbPromise;
  await db.put("pending-mutations", {
    id: crypto.randomUUID(),
    url,
    method,
    body: JSON.parse(JSON.stringify(body)),
    createdAt: Date.now(),
  });
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

export async function replayQueue() {
  const db = await dbPromise;
  const pending = await db.getAll("pending-mutations");
  for (const item of pending) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (res.ok) {
        await db.delete("pending-mutations", item.id);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  dispatchChange();
}

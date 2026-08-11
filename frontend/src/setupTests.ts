import "@testing-library/jest-dom"
import { vi } from "vitest"

vi.mock("idb", () => {
  return {
    openDB: () =>
      Promise.resolve({
        createObjectStore: () => {},
        getAll: () => Promise.resolve([]),
        delete: () => Promise.resolve(),
        count: () => Promise.resolve(0),
        put: () => Promise.resolve(),
      }),
  }
})

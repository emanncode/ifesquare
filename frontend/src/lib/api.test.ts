import { describe, it, expect, vi, afterEach } from "vitest"
import {
  api,
  ApiError,
  errorMessage,
  isNetworkError,
  isJsonParseError,
  toHumanErrorMessage,
  NETWORK_ERROR_MSG,
  JSON_PARSE_ERROR_MSG,
  UNAUTHORIZED_ERROR_MSG,
  FORBIDDEN_ERROR_MSG,
  SERVER_ERROR_MSG,
} from "./api"
import { getLoginErrorMessage } from "./loginErrors"

describe("api error messaging", () => {
  describe("isNetworkError", () => {
    it("detects TypeError from fetch failures", () => {
      expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true)
      expect(isNetworkError(new TypeError("Load failed"))).toBe(true)
      expect(isNetworkError(new TypeError("NetworkError when attempting to fetch resource"))).toBe(true)
    })

    it("detects DOMException abort / timeout errors", () => {
      expect(isNetworkError(new DOMException("The user aborted a request.", "AbortError"))).toBe(true)
      expect(isNetworkError(new DOMException("The operation timed out.", "TimeoutError"))).toBe(true)
    })

    it("detects offline status", () => {
      const originalOnLine = navigator.onLine
      try {
        Object.defineProperty(navigator, "onLine", { value: false, configurable: true })
        expect(isNetworkError(new Error("any error"))).toBe(true)
      } finally {
        Object.defineProperty(navigator, "onLine", { value: originalOnLine, configurable: true })
      }
    })
  })

  describe("isJsonParseError", () => {
    it("detects SyntaxError from JSON.parse failures", () => {
      expect(isJsonParseError(new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"))).toBe(true)
      expect(isJsonParseError(new SyntaxError("Unexpected end of JSON input"))).toBe(true)
    })

    it("detects Error with JSON parsing message", () => {
      expect(isJsonParseError(new Error("is not valid JSON"))).toBe(true)
    })
  })

  describe("toHumanErrorMessage", () => {
    it("translates 401 unauthorized to clear human English", () => {
      expect(toHumanErrorMessage("unauthorized", 401)).toBe(UNAUTHORIZED_ERROR_MSG)
      expect(toHumanErrorMessage("", 401, "Unauthorized")).toBe(UNAUTHORIZED_ERROR_MSG)
    })

    it("translates 403 forbidden to clear human English", () => {
      expect(toHumanErrorMessage("forbidden", 403)).toBe(FORBIDDEN_ERROR_MSG)
      expect(toHumanErrorMessage("", 403, "Forbidden")).toBe(FORBIDDEN_ERROR_MSG)
    })

    it("translates 500+ server errors to human English", () => {
      expect(toHumanErrorMessage("Internal Server Error", 500)).toBe(SERVER_ERROR_MSG)
      expect(toHumanErrorMessage("Bad Gateway", 502)).toBe(SERVER_ERROR_MSG)
    })

    it("translates technical validation strings into human English", () => {
      expect(toHumanErrorMessage("invalid body")).toBe(
        "The request format is invalid. Please check your information and try again."
      )
      expect(toHumanErrorMessage("invalid json")).toBe(
        "The request format is invalid. Please check your information and try again."
      )
      expect(toHumanErrorMessage("closing cannot exceed total (opening + receipts)")).toBe(
        "Closing stock cannot exceed total stock (opening + receipts)."
      )
      expect(toHumanErrorMessage("price cannot be negative")).toBe(
        "Price cannot be a negative number."
      )
      expect(toHumanErrorMessage("wrong password")).toBe(
        "The current password you entered is incorrect."
      )
    })
  })

  describe("errorMessage helper", () => {
    it("handles network errors with bad network message", () => {
      const err = new TypeError("Failed to fetch")
      expect(errorMessage(err, "Fallback")).toBe(NETWORK_ERROR_MSG)
    })

    it("handles json parse errors with reload message", () => {
      const err = new SyntaxError("Unexpected token < in JSON at position 0")
      expect(errorMessage(err, "Fallback")).toBe(JSON_PARSE_ERROR_MSG)
    })

    it("handles ApiError 401 unauthorized gracefully", () => {
      const err = new ApiError(401, "unauthorized")
      expect(errorMessage(err, "Fallback")).toBe(UNAUTHORIZED_ERROR_MSG)
    })

    it("handles ApiError 500 server error gracefully", () => {
      const err = new ApiError(500, "Internal Server Error")
      expect(errorMessage(err, "Fallback")).toBe(SERVER_ERROR_MSG)
    })
  })

  describe("api fetch wrapper", () => {
    const originalFetch = globalThis.fetch

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it("wraps non-ok response with humanized ApiError", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: "unauthorized" }),
      } as Response)

      await expect(api("/test")).rejects.toThrow(UNAUTHORIZED_ERROR_MSG)
    })

    it("handles malformed 200 JSON responses gracefully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON at position 0")
        },
      } as Response)

      await expect(api("/test")).rejects.toThrow(JSON_PARSE_ERROR_MSG)
    })
  })

  describe("getLoginErrorMessage", () => {
    it("formats network errors clearly", () => {
      const err = new TypeError("Failed to fetch")
      expect(getLoginErrorMessage(err)).toBe(NETWORK_ERROR_MSG)
    })

    it("formats json errors clearly", () => {
      const err = new SyntaxError("Unexpected token < in JSON at position 0")
      expect(getLoginErrorMessage(err)).toBe(JSON_PARSE_ERROR_MSG)
    })

    it("formats credential errors clearly", () => {
      const err = new ApiError(401, "invalid credentials")
      expect(getLoginErrorMessage(err)).toBe("Email or password is incorrect.")
    })
  })
})

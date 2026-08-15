import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateReceipt } from "./receiptSchema.js";

const validReceipt = {
  schema_version: 1,
  app: "ModelFlightRecorder",
  run_id: "run-1",
  model_id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
  model_size_mb: 204,
  runtime: "webgpu",
  ttft_ms: 120,
  itl_ms_p50: 40,
  itl_ms_p95: 80,
  tokens_out: 12,
  tok_per_s: 25,
  prompt_tokens: 8,
  wall_ms: 500,
  network_mode: "local-only",
  created_at: "2026-08-14T12:00:00.000Z",
};

describe("receipt schema", () => {
  it("accepts a complete receipt", () => {
    const result = validateReceipt(validReceipt);
    assert.equal(result.ok, true);
  });

  it("rejects missing fields and wrong app", () => {
    const result = validateReceipt({ ...validReceipt, app: "ChatApp" });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes("app")));
  });

  it("rejects non-objects", () => {
    assert.equal(validateReceipt(null).ok, false);
    assert.equal(validateReceipt([]).ok, false);
  });
});

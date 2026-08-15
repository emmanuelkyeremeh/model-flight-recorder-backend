import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createRequestHandler, listen } from "./server.js";
import { createReceiptStore } from "./store.js";

const receipt = {
  schema_version: 1,
  app: "ModelFlightRecorder",
  run_id: "run-live-1",
  model_id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
  model_size_mb: 204,
  runtime: "mock",
  ttft_ms: 90,
  itl_ms_p50: 30,
  itl_ms_p95: 45,
  tokens_out: 6,
  tok_per_s: 33.3,
  prompt_tokens: 4,
  wall_ms: 220,
  network_mode: "local-only",
  created_at: "2026-08-14T12:00:00.000Z",
};

describe("http server", () => {
  let server;
  let base;

  before(async () => {
    server = await listen(createRequestHandler({ store: createReceiptStore() }), 0);
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("reports health", async () => {
    const response = await fetch(`${base}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
  });

  it("stores and returns a valid receipt", async () => {
    const created = await fetch(`${base}/api/receipts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(receipt),
    });
    assert.equal(created.status, 201);

    const fetched = await fetch(`${base}/api/receipts/${receipt.run_id}`);
    const body = await fetched.json();
    assert.equal(fetched.status, 200);
    assert.equal(body.receipt.model_id, receipt.model_id);
  });

  it("rejects invalid receipts", async () => {
    const response = await fetch(`${base}/api/receipts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hello: "nope" }),
    });
    assert.equal(response.status, 400);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReceiptStore } from "../src/store.js";

describe("receipt store", () => {
  it("saves and fetches by run id", () => {
    const store = createReceiptStore();
    store.save({ run_id: "abc" });
    assert.equal(store.get("abc").run_id, "abc");
    assert.equal(store.get("missing"), null);
  });

  it("evicts the oldest entry when full", () => {
    const store = createReceiptStore(2);
    store.save({ run_id: "one" });
    store.save({ run_id: "two" });
    store.save({ run_id: "three" });
    assert.equal(store.get("one"), null);
    assert.equal(store.get("two").run_id, "two");
    assert.equal(store.get("three").run_id, "three");
    assert.equal(store.size(), 2);
  });
});

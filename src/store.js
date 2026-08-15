const DEFAULT_LIMIT = 100;

export function createReceiptStore(limit = DEFAULT_LIMIT) {
  const items = new Map();

  return {
    save(receipt) {
      if (items.size >= limit && !items.has(receipt.run_id)) {
        const oldest = items.keys().next().value;
        items.delete(oldest);
      }
      items.set(receipt.run_id, receipt);
      return receipt;
    },
    get(runId) {
      return items.get(runId) ?? null;
    },
    size() {
      return items.size;
    },
  };
}

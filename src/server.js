import { createServer as createHttpServer } from "node:http";
import { fileURLToPath } from "node:url";
import { validateReceipt } from "./receiptSchema.js";
import { createReceiptStore } from "./store.js";

const DEFAULT_PORT = 8787;
const JSON_LIMIT_BYTES = 64 * 1024;

export function createRequestHandler({ store = createReceiptStore(), corsOrigin = "*" } = {}) {
  return async function handle(request, response) {
    setCors(response, corsOrigin);

    const url = new URL(request.url, "http://127.0.0.1");

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, service: "modelflightrecorder-backend" });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/receipts") {
      const body = await readJsonBody(request);
      if (!body.ok) {
        sendJson(response, 400, { ok: false, errors: body.errors });
        return;
      }
      const parsed = validateReceipt(body.value);
      if (!parsed.ok) {
        sendJson(response, 400, { ok: false, errors: parsed.errors });
        return;
      }
      store.save(parsed.receipt);
      sendJson(response, 201, { ok: true, run_id: parsed.receipt.run_id });
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/receipts/")) {
      const runId = decodeURIComponent(url.pathname.slice("/api/receipts/".length));
      const receipt = store.get(runId);
      if (!receipt) {
        sendJson(response, 404, { ok: false, errors: ["Receipt not found."] });
        return;
      }
      sendJson(response, 200, { ok: true, receipt });
      return;
    }

    sendJson(response, 404, { ok: false, errors: ["Not found."] });
  };
}

export function listen(handler, port = Number(process.env.PORT ?? DEFAULT_PORT)) {
  const server = createHttpServer(handler);
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function setCors(response, origin) {
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let overflowed = false;

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > JSON_LIMIT_BYTES) {
        overflowed = true;
        request.destroy();
        resolve({ ok: false, errors: ["Body too large."] });
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      if (overflowed) {
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve({ ok: true, value: JSON.parse(raw) });
      } catch {
        resolve({ ok: false, errors: ["Invalid JSON."] });
      }
    });

    request.on("error", () => {
      if (!overflowed) {
        resolve({ ok: false, errors: ["Failed to read body."] });
      }
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await listen(createRequestHandler());
  const address = server.address();
  console.log(`Model Flight Recorder backend on http://127.0.0.1:${address.port}`);
}

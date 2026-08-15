# Model Flight Recorder — Backend

Optional local receipt archive for [Model Flight Recorder](https://github.com/emmanuelkyeremeh/model-flight-recorder-frontend).

The frontend is a static Vite app and works without this service. Run the backend only when you want to POST validated run receipts to a machine you control and fetch them back by `run_id`.

## What it stores

A receipt is a small JSON object of **metrics only**. It never contains the prompt or the completion text. The shape is validated against `src/receiptSchema.js` (the same contract the frontend builds against).

```js
{
  schema_version: 1,
  app: "ModelFlightRecorder",
  run_id, model_id, model_size_mb,
  runtime: "webgpu" | "mock",
  ttft_ms, itl_ms_p50, itl_ms_p95,
  tokens_out, tok_per_s, prompt_tokens, wall_ms,
  browser, gpu_renderer,
  network_mode: "local-only",
  created_at
}
```

## Run

```bash
npm start
```

Listens on `http://127.0.0.1:8787` (override with `PORT`).

```bash
npm test
```

No external dependencies. Node's built-in `http` module and `node:test`.

## API

| Method | Path | Behaviour |
| --- | --- | --- |
| `GET` | `/health` | `{ ok: true, service: "modelflightrecorder-backend" }` |
| `POST` | `/api/receipts` | Validate body, store, return `{ ok: true, run_id }` (201) |
| `GET` | `/api/receipts/:runId` | Return stored receipt or 404 |
| `OPTIONS` | any | CORS preflight |

Bodies larger than 64 KB are rejected. Invalid receipts return 400 with an `errors` array.

## Storage

In-memory `Map`, capped at 100 receipts. When full, the oldest entry is evicted. There is no disk persistence and no auth. This is a local archive for a single developer machine, not a multi-tenant service.

```js
import { createReceiptStore } from "./src/store.js";

const store = createReceiptStore(100);
store.save(receipt);
store.get(runId);
```

## Layout

```
backend/
├── package.json
├── README.md
└── src/
    ├── server.js            # http handler + listen()
    ├── store.js             # bounded in-memory Map
    ├── receiptSchema.js     # shared validation contract
    ├── server.test.js
    ├── store.test.js
    └── receiptSchema.test.js
```

## CORS

Default `Access-Control-Allow-Origin: *`. Pass `corsOrigin` into `createRequestHandler` if you want to lock it down.

## License

Private. All rights reserved.

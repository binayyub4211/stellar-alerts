import { z } from 'zod';

export const deadLetterIdSchema = z.object({
  id: z.string().min(1),
});

export const listDeadLettersQuerySchema = z.object({
  channel: z.string().min(1).max(40).optional(),
  status: z.enum(['pending', 'retried', 'suppressed']).optional(),
  q: z.string().max(200).optional(),
  maxAgeDays: z.coerce.number().int().min(1).max(365).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const suppressDeadLetterSchema = z.object({
  note: z.string().max(2000).optional(),
});

export const sandboxReplayIdSchema = z.object({
  replayId: z.string().min(1),
});

// Mock response the in-process sandbox receiver should return. Mirrors what a
// real receiver would produce so developers can exercise success paths,
// provider 4xx/5xx responses, and latency before wiring a real endpoint.
export const sandboxMockResponseSchema = z.object({
  // HTTP status the mock receiver responds with (default 200 = accepted).
  status: z.number().int().min(100).max(599).default(200),
  // Response headers echoed back by the mock receiver (at most 50 entries).
  headers: z
    // z.object({}).catchall(z.string()) instead of z.record(z.string(), z.string()): both
    // accept string-keyed/string-valued objects, but z.record() emits `propertyNames`
    // (JSON Schema Draft-07) which openapi-diff rejects as invalid OpenAPI 3.0.
    // catchall() emits only `additionalProperties` which is valid in OpenAPI 3.0.
    .object({})
    .catchall(z.string())
    .refine((headers) => Object.keys(headers).length <= 50, {
      message: 'At most 50 response headers are allowed',
    })
    .default({}),
  // Raw response body returned by the mock receiver (max 64 KB).
  body: z.string().max(65536).default(''),
  // Artificial delay (ms) the mock receiver waits before responding.
  // Capped at 5s so replays can never stall API workers.
  delayMs: z.number().int().min(0).max(5000).default(0),
});

export const sandboxReplayInputSchema = z.object({
  mockResponse: sandboxMockResponseSchema.default({
    status: 200,
    headers: {},
    body: '',
    delayMs: 0,
  }),
});

export const listSandboxReplaysQuerySchema = z.object({
  status: z.enum(['completed', 'failed']).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type SandboxMockResponse = z.infer<typeof sandboxMockResponseSchema>;
export type SandboxReplayInput = z.infer<typeof sandboxReplayInputSchema>;
export type ListSandboxReplaysQuery = z.infer<typeof listSandboxReplaysQuerySchema>;

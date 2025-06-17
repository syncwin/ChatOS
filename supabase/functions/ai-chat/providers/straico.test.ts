import { assertEquals, assertRejects, assertInstanceOf } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { handleStraico } from "./straico.ts";
import type { ChatMessage, NormalizedResponse } from '../_shared/types.ts';

// Store original fetch to restore it after tests
const originalFetch = globalThis.fetch;

Deno.test("handleStraico - successful non-streaming response", async () => {
  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
    assertEquals(url.toString(), "https://api.straico.com/v1/chat/completions");
    if (options?.body) {
      const body = JSON.parse(options.body as string);
      assertEquals(body.model, "straico/latest");
      assertEquals(body.stream, false);
    }

    return Promise.resolve(new Response(JSON.stringify({
      choices: [{ message: { content: "Test response from Straico" } }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      model: "straico-model-v1" // Assuming API returns the specific model version
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  };

  try {
    const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
    const response = await handleStraico("test-api-key", "straico/latest", messages, 0.7, 100, false) as NormalizedResponse;

    assertEquals(response.content, "Test response from Straico");
    assertEquals(response.provider, "Straico");
    assertEquals(response.model, "straico-model-v1");
    assertEquals(response.usage?.prompt_tokens, 10);
    assertEquals(response.usage?.completion_tokens, 20);
    assertEquals(response.usage?.total_tokens, 30);
  } finally {
    globalThis.fetch = originalFetch; // Restore fetch
  }
});

Deno.test("handleStraico - API error handling", async () => {
  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
    assertEquals(url.toString(), "https://api.straico.com/v1/chat/completions");
    return Promise.resolve(new Response(JSON.stringify({ error: { message: "Invalid API key" } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }));
  };

  try {
    const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
    await assertRejects(
      async () => {
        await handleStraico("invalid-key", "straico/latest", messages, 0.7, 100, false);
      },
      Error,
      'Straico API error: 401 {"error":{"message":"Invalid API key"}}' // Adjust expected message based on actual error thrown
    );
  } finally {
    globalThis.fetch = originalFetch; // Restore fetch
  }
});

Deno.test("handleStraico - successful streaming response", async () => {
  const mockStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("data: chunk1\n\n"));
      controller.close();
    }
  });

  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
    assertEquals(url.toString(), "https://api.straico.com/v1/chat/completions");
     if (options?.body) {
      const body = JSON.parse(options.body as string);
      assertEquals(body.model, "straico/latest");
      assertEquals(body.stream, true);
    }
    return Promise.resolve(new Response(mockStream, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' }
    }));
  };

  try {
    const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
    const response = await handleStraico("test-api-key", "straico/latest", messages, 0.7, 100, true);
    assertInstanceOf(response, ReadableStream);
  } finally {
    globalThis.fetch = originalFetch; // Restore fetch
  }
});

Deno.test("handleStraico - fetch throws network error", async () => {
  globalThis.fetch = async (_url: string | URL | Request, _options?: RequestInit): Promise<Response> => {
    return Promise.reject(new TypeError("Network request failed"));
  };

  try {
    const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
    await assertRejects(
      async () => {
        await handleStraico("test-key", "straico/latest", messages, 0.7, 100, false);
      },
      TypeError, // Expecting the original TypeError from fetch
      "Network request failed"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("handleStraico - non-JSON error response from API", async () => {
  globalThis.fetch = async (_url: string | URL | Request, _options?: RequestInit): Promise<Response> => {
    return Promise.resolve(new Response("Server Error 500 - Not JSON", {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    }));
  };

  try {
    const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
    await assertRejects(
      async () => {
        await handleStraico("test-key", "straico/latest", messages, 0.7, 100, false);
      },
      Error,
      "Straico API error: 500 Server Error 500 - Not JSON"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("handleStraico - stream response with null body", async () => {
  globalThis.fetch = async (_url: string | URL | Request, _options?: RequestInit): Promise<Response> => {
    return Promise.resolve(new Response(null, { // Null body
      status: 200, // Status is OK, but body is null
      headers: { 'Content-Type': 'text/event-stream' }
    }));
  };

  try {
    const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
    await assertRejects(
      async () => {
        await handleStraico("test-key", "straico/latest", messages, 0.7, 100, true); // stream: true
      },
      Error,
      "Straico API response body is null for stream."
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("handleStraico - non-streaming unexpected response structure", async () => {
  globalThis.fetch = async (_url: string | URL | Request, _options?: RequestInit): Promise<Response> => {
    return Promise.resolve(new Response(JSON.stringify({
      // Missing 'choices' array
      some_other_data: "data",
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      model: "straico-model-v1"
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  };

  try {
    const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
    await assertRejects(
      async () => {
        await handleStraico("test-key", "straico/latest", messages, 0.7, 100, false);
      },
      Error,
      "Unexpected Straico API response structure"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

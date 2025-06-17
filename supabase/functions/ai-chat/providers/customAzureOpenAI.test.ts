import { assertEquals, assertRejects, assertInstanceOf, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { handleCustomAzureOpenAI } from "./customAzureOpenAI.ts";
import type { ChatMessage, NormalizedResponse, ProviderHandlerParams } from '../_shared/types.ts';

const DEFAULT_API_VERSION = '2025-01-01-preview'; // Match the one in customAzureOpenAI.ts

// Store original fetch to restore it after tests
const originalFetch = globalThis.fetch;

const commonMessages: ChatMessage[] = [{ role: "user", content: "Hello Azure" }];
const commonApiKey = "test-azure-key";
const commonModel = "gpt-4o-deployment"; // This is the deployment_id

Deno.test("handleCustomAzureOpenAI - successful non-streaming response (endpoint without slash)", async () => {
  const params: ProviderHandlerParams = { endpoint_url: "https://test-resource.openai.azure.com", deployment_id: commonModel };
  const expectedUrl = `https://test-resource.openai.azure.com/openai/deployments/${commonModel}/chat/completions?api-version=${DEFAULT_API_VERSION}`;

  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
    assertEquals(url.toString(), expectedUrl);
    assertEquals(options?.method, "POST");
    if (options?.headers) {
      const headers = new Headers(options.headers);
      assertEquals(headers.get("api-key"), commonApiKey);
      assertEquals(headers.get("Content-Type"), "application/json");
    }
    if (options?.body) {
      const body = JSON.parse(options.body as string);
      assertEquals(body.stream, false);
    }
    return Promise.resolve(new Response(JSON.stringify({
      choices: [{ message: { content: "Azure says hello" } }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      model: commonModel // Azure might return the deployment ID or a base model name
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  };

  try {
    const response = await handleCustomAzureOpenAI(commonApiKey, commonModel, commonMessages, 0.7, 100, false, params) as NormalizedResponse;
    assertEquals(response.content, "Azure says hello");
    assertEquals(response.provider, "Azure OpenAI (Custom)");
    assertEquals(response.model, commonModel);
    assertEquals(response.usage?.total_tokens, 30);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("handleCustomAzureOpenAI - successful non-streaming response (endpoint with slash)", async () => {
  const params: ProviderHandlerParams = { endpoint_url: "https://test-resource.openai.azure.com/", deployment_id: commonModel };
  const expectedUrl = `https://test-resource.openai.azure.com/openai/deployments/${commonModel}/chat/completions?api-version=${DEFAULT_API_VERSION}`;

  globalThis.fetch = async (url: string | URL | Request, _options?: RequestInit): Promise<Response> => {
    assertEquals(url.toString(), expectedUrl); // Main check for this test
    return Promise.resolve(new Response(JSON.stringify({
      choices: [{ message: { content: "Azure response" } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  };

  try {
    await handleCustomAzureOpenAI(commonApiKey, commonModel, commonMessages, 0.7, 100, false, params);
    // Basic check passed if fetch was called with correct URL
  } finally {
    globalThis.fetch = originalFetch;
  }
});


Deno.test("handleCustomAzureOpenAI - API error handling (401 Unauthorized)", async () => {
  const params: ProviderHandlerParams = { endpoint_url: "https://test-resource.openai.azure.com", deployment_id: commonModel };
  globalThis.fetch = async (_url, _options): Promise<Response> => {
    return Promise.resolve(new Response(JSON.stringify({ error: { message: "Invalid API key" } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }));
  };

  try {
    await assertRejects(
      async () => {
        await handleCustomAzureOpenAI(commonApiKey, commonModel, commonMessages, 0.7, 100, false, params);
      },
      Error,
      'Custom Azure OpenAI API error: 401 {"error":{"message":"Invalid API key"}}'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("handleCustomAzureOpenAI - missing endpoint_url configuration", async () => {
  const params: ProviderHandlerParams = { deployment_id: commonModel }; // endpoint_url is missing
  await assertRejects(
    async () => {
      await handleCustomAzureOpenAI(commonApiKey, commonModel, commonMessages, 0.7, 100, false, params);
    },
    Error,
    "Azure OpenAI endpoint URL or deployment ID is not configured for this API key."
  );
});

Deno.test("handleCustomAzureOpenAI - missing deployment_id configuration", async () => {
  const params: ProviderHandlerParams = { endpoint_url: "https://test-resource.openai.azure.com" }; // deployment_id is missing
  await assertRejects(
    async () => {
      await handleCustomAzureOpenAI(commonApiKey, commonModel, commonMessages, 0.7, 100, false, params);
    },
    Error,
    "Azure OpenAI endpoint URL or deployment ID is not configured for this API key."
  );
});

Deno.test("handleCustomAzureOpenAI - successful streaming response", async () => {
  const params: ProviderHandlerParams = { endpoint_url: "https://test-resource.openai.azure.com", deployment_id: commonModel };
  const mockStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("data: chunk1\n\n"));
      controller.close();
    }
  });

  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
    const body = JSON.parse(options!.body as string);
    assertEquals(body.stream, true);
    return Promise.resolve(new Response(mockStream, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' }
    }));
  };

  try {
    const response = await handleCustomAzureOpenAI(commonApiKey, commonModel, commonMessages, 0.7, 100, true, params);
    assertInstanceOf(response, ReadableStream);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("handleCustomAzureOpenAI - non-JSON error response from API", async () => {
  const params: ProviderHandlerParams = { endpoint_url: "https://test-resource.openai.azure.com", deployment_id: commonModel };
  globalThis.fetch = async (_url, _options): Promise<Response> => {
    return Promise.resolve(new Response("Internal Server Error - Plain Text", {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    }));
  };

  try {
    await assertRejects(
      async () => {
        await handleCustomAzureOpenAI(commonApiKey, commonModel, commonMessages, 0.7, 100, false, params);
      },
      Error,
      "Custom Azure OpenAI API error: 500 Internal Server Error - Plain Text"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("handleCustomAzureOpenAI - stream response with null body", async () => {
 const params: ProviderHandlerParams = { endpoint_url: "https://test-resource.openai.azure.com", deployment_id: commonModel };
  globalThis.fetch = async (_url, _options): Promise<Response> => {
    return Promise.resolve(new Response(null, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' }
    }));
  };

  try {
    await assertRejects(
      async () => {
        await handleCustomAzureOpenAI(commonApiKey, commonModel, commonMessages, 0.7, 100, true, params);
      },
      Error,
      "Custom Azure OpenAI API response body is null for stream."
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("handleCustomAzureOpenAI - non-streaming unexpected response structure", async () => {
  const params: ProviderHandlerParams = { endpoint_url: "https://test-resource.openai.azure.com", deployment_id: commonModel };
  globalThis.fetch = async (_url, _options): Promise<Response> => {
    return Promise.resolve(new Response(JSON.stringify({
      invalid_structure: "no choices field"
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  };

  try {
    await assertRejects(
      async () => {
        await handleCustomAzureOpenAI(commonApiKey, commonModel, commonMessages, 0.7, 100, false, params);
      },
      Error,
      "Unexpected Custom Azure OpenAI API response structure"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

import { createRequestHandler } from "react-router";
import type { CamelAiBinding } from "./camelai-binding";

interface AiBinding {
  run(model: string, input: { messages: Array<{ role: string; content: string }> }): Promise<unknown>;
}

interface Env {
  ASSETS?: { fetch(request: Request): Promise<Response> | Response };
  AI: AiBinding;
  CAMELAI: CamelAiBinding;
}

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: { env: Env; ctx: ExecutionContext };
  }
}

const requestHandler = createRequestHandler(() => import("virtual:react-router/server-build"), import.meta.env.MODE);

function shouldServeAsset(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return false;
  const pathname = new URL(request.url).pathname;
  return pathname.startsWith("/assets/") || pathname.includes(".") || pathname === "/robots.txt";
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (env.ASSETS && shouldServeAsset(request)) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) return assetResponse;
    }
    return requestHandler(request, { cloudflare: { env, ctx } });
  },
} satisfies ExportedHandler<Env>;

// Auto-generated Cloudflare binding types.
// @see https://alchemy.run/docs/concepts/bindings.html#type-safe-bindings

import type { website } from "../alchemy.run.ts";

export type CloudflareEnv = typeof website.Env;

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}

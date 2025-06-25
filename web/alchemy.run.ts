/// <reference types="@types/node" />

import alchemy from "alchemy";
import { Assets, Worker, Zone, CustomDomain } from "alchemy/cloudflare";
import { exec } from "alchemy/os";

const app = await alchemy("vibe-rules-website");

// Build the static site
await exec("bun run generate");

// Deploy static assets
export const assets = await Assets("vibe-rules-assets", {
  path: ".output/public",
});

// Create a simple worker to serve the static assets
export const worker = await Worker("vibe-rules-worker", {
  script: `
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
}`,
  bindings: {
    ASSETS: assets,
  },
  url: true,
});

// Create the zone
export const zone = await Zone("vibe-rules-zone", {
  name: "vibe-rules.com",
  type: "full",
  delete: true,
});

// Set up custom domains
export const customDomain = await CustomDomain("vibe-rules-custom-domain", {
  name: "vibe-rules.com",
  zoneId: zone.id,
  workerName: worker.id,
});

export const wwwDomain = await CustomDomain("vibe-rules-www-domain", {
  name: "www.vibe-rules.com",
  zoneId: zone.id,
  workerName: worker.id,
});

console.log({
  message: "Static site deployed successfully!",
  workersUrl: worker.url,
  customDomain: "https://vibe-rules.com",
  wwwDomain: "https://www.vibe-rules.com",
  nameservers: zone.name_servers,
});

await app.finalize();

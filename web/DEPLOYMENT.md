# Deploying vibe-rules Website with Alchemy

This website can be deployed to Cloudflare using Alchemy.

## Prerequisites

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Cloudflare Authentication:**

   ```bash
   bun wrangler login
   ```

   This will authenticate you with Cloudflare. Alchemy automatically reuses your Wrangler OAuth tokens.

3. **Environment Setup:**
   Update the `.env` file and change the `ALCHEMY_PASSWORD` to something secure:
   ```bash
   ALCHEMY_PASSWORD=your-secure-password-here
   ```

## Deploy

Deploy the website to Cloudflare:

```bash
bun run deploy
```

You'll get the live URL of your Nuxt site:

```
{
  url: "https://vibe-rules-web.<your-account>.workers.dev"
}
```

## Local Development

Work locally using the dev script:

```bash
bun run dev
```

## Destroy

Clean up all Cloudflare resources created by this deployment:

```bash
bun run destroy
```

## Files Overview

- **`alchemy.run.ts`** - Main Alchemy deployment script that defines the Nuxt resource
- **`types/env.d.ts`** - TypeScript definitions for Cloudflare environment bindings
- **`.env`** - Local environment variables (including Alchemy password)

## Configuration

The deployment:

- Builds the site using `bun run generate` for static output
- Deploys static assets to Cloudflare
- Creates a Worker to serve the assets
- Sets up custom domains (vibe-rules.com and www.vibe-rules.com)
- Provides both workers.dev and custom domain URLs

## Custom Domain Setup

The deployment automatically:

- Creates or adopts the zone for `vibe-rules.com`
- Sets up `vibe-rules.com` as the main domain
- Sets up `www.vibe-rules.com` as a subdomain
- Configures Worker routes for both domains

**If the zone doesn't exist yet:**

- Alchemy will attempt to create it
- You'll need appropriate permissions on your Cloudflare account
- After deployment, update your domain's nameservers to the ones provided

**If the zone already exists:**

- Alchemy will adopt and use it
- Custom domains will be configured automatically

export default defineNuxtConfig({
  // Enable Nuxt 4 compatibility
  compatibilityVersion: 4,

  // Compatibility date
  compatibilityDate: "2025-06-18",

  devtools: { enabled: true },

  // TypeScript configuration for Alchemy (disabled typeCheck for now)
  typescript: {
    typeCheck: false,
    include: ["alchemy.run.ts", "types/**/*.ts"],
  },

  modules: ["@nuxtjs/tailwindcss", "@nuxt/fonts"],

  fonts: {
    families: [
      { name: "Inter", provider: "google" },
      { name: "JetBrains Mono", provider: "google" },
    ],
  },

  app: {
    head: {
      title: "vibe-rules - AI Rules Management CLI",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "A powerful CLI tool for managing and sharing AI rules (prompts, configurations) across different editors and tools.",
        },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.SITE_URL || "https://vibe-rules.dev",
    },
  },
});

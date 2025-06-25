<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
/* Global styles */
html {
  font-family: 'Inter', system-ui, sans-serif;
  scroll-behavior: smooth;
}

/* Custom button styles */
.btn-primary {
  @apply inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold transition-all duration-200 hover:from-primary-700 hover:to-primary-800 hover:shadow-lg hover:shadow-primary-500/25 active:scale-95;
}

.btn-secondary {
  @apply inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-md active:scale-95;
}

.btn-ghost {
  @apply inline-flex items-center justify-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 active:scale-95;
}

/* Custom code block styles */
.code-block {
  @apply bg-gray-900 dark:bg-gray-950 text-gray-100 p-6 rounded-2xl overflow-x-auto font-mono text-sm border border-gray-800 dark:border-gray-700 shadow-xl;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
}

.code-block::-webkit-scrollbar {
  height: 8px;
}

.code-block::-webkit-scrollbar-track {
  @apply bg-gray-800 rounded;
}

.code-block::-webkit-scrollbar-thumb {
  @apply bg-gray-600 rounded hover:bg-gray-500;
}

/* Feature card styles */
.feature-card {
  @apply bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-1;
}

/* Glow effects */
.glow-effect {
  @apply animate-glow;
}

/* Typography */
.text-gradient {
  @apply bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent;
}

/* Glass morphism effect */
.glass {
  @apply bg-white/10 dark:bg-gray-900/20 backdrop-blur-md border border-white/20 dark:border-gray-700/30;
}

/* Section styling */
.section-padding {
  @apply py-20 lg:py-32;
}

/* Container improvements */
.container-custom {
  @apply mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl;
}

/* Background grid pattern */
.bg-grid-pattern {
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* Fonts are now handled by @nuxt/fonts */
</style>
<template>
  <div class="min-h-screen flex flex-col">
    <!-- Modern Header with Glass Effect -->
    <header
      class="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300"
    >
      <nav class="container-custom py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center space-x-3 group">
            <div
              class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary-500/25 transition-all duration-200 group-hover:scale-105"
            >
              <span class="text-white font-bold text-lg">V</span>
            </div>
            <span
              class="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
            >
              vibe-rules
            </span>
          </NuxtLink>

          <!-- Navigation & Controls -->
          <div class="flex items-center space-x-2">
            <!-- Navigation Links -->
            <div class="hidden md:flex items-center space-x-1 mr-4">
              <NuxtLink to="/local-usage" class="nav-link"> Local Usage </NuxtLink>
              <NuxtLink to="/maintainers" class="nav-link"> Maintainers </NuxtLink>
              <a
                href="https://github.com/futureexcited/vibe-rules"
                target="_blank"
                class="nav-link"
              >
                GitHub
                <div class="flex items-center gap-1 ml-1">
                  <div
                    v-if="stars"
                    class="flex items-center gap-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full"
                  >
                    <svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    <span>{{ formatStars(stars) }}</span>
                  </div>
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                      clip-rule="evenodd"
                    />
                    <path
                      fill-rule="evenodd"
                      d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </a>
            </div>

            <!-- Dark Mode Toggle -->
            <button
              @click="toggleDark"
              class="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 hover:scale-105"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <!-- Sun Icon (shown in dark mode) -->
              <svg
                v-if="isDark"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <!-- Moon Icon (shown in light mode) -->
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>

            <!-- Mobile Menu Button -->
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div
          v-if="mobileMenuOpen"
          class="md:hidden mt-4 py-4 border-t border-gray-200 dark:border-gray-800"
        >
          <div class="flex flex-col space-y-2">
            <NuxtLink to="/local-usage" class="mobile-nav-link" @click="mobileMenuOpen = false">
              Local Usage
            </NuxtLink>
            <NuxtLink to="/maintainers" class="mobile-nav-link" @click="mobileMenuOpen = false">
              Maintainers
            </NuxtLink>
            <a
              href="https://github.com/futureexcited/vibe-rules"
              target="_blank"
              class="mobile-nav-link"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Modern Footer -->
    <footer
      class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300"
    >
      <div class="container-custom py-12">
        <div class="text-center">
          <div class="flex items-center justify-center space-x-3 mb-4">
            <div
              class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center"
            >
              <span class="text-white font-bold text-sm">V</span>
            </div>
            <span class="text-lg font-semibold text-gray-900 dark:text-white">vibe-rules</span>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            A powerful CLI tool for managing AI rules across different editors
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            &copy; 2024 vibe-rules. MIT License.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const { isDark, toggleDark } = useDarkMode();
const { stars, formatStars } = useGitHubStars();
const mobileMenuOpen = ref(false);

// Close mobile menu when clicking outside
onMounted(() => {
  document.addEventListener("click", (e) => {
    if (!e.target.closest("nav")) {
      mobileMenuOpen.value = false;
    }
  });
});
</script>

<style scoped>
.nav-link {
  @apply px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-all duration-200 flex items-center;
}

.mobile-nav-link {
  @apply px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-all duration-200 flex items-center;
}

.router-link-active.nav-link {
  @apply text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950;
}

.router-link-active.mobile-nav-link {
  @apply text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950;
}
</style>

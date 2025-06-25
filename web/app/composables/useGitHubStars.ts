export const useGitHubStars = () => {
  const stars = ref<number | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchStars = async () => {
    if (stars.value !== null) return; // Already fetched

    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{ stargazers_count: number }>(
        "https://api.github.com/repos/FutureExcited/vibe-rules"
      );
      stars.value = response.stargazers_count;
    } catch (err) {
      error.value = "Failed to fetch stars";
      console.error("Error fetching GitHub stars:", err);
    } finally {
      loading.value = false;
    }
  };

  const formatStars = (count: number | null): string => {
    if (count === null) return "★";
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Auto-fetch on mount
  onMounted(() => {
    fetchStars();
  });

  return {
    stars: readonly(stars),
    loading: readonly(loading),
    error: readonly(error),
    formatStars,
    fetchStars,
  };
};

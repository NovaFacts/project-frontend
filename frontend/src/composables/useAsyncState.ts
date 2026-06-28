import { ref } from 'vue';
import { isAxiosError } from '@/services/api';

export function useAsyncState() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  function clearError(): void {
    error.value = null;
  }

  async function run(asyncFn: () => Promise<void>): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await asyncFn();
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        error.value = err.response?.data?.error ?? 'Error inesperado del servidor.';
      } else {
        error.value = 'Error inesperado del servidor.';
      }
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, clearError, run };
}

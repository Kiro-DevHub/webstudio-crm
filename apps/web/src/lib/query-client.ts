import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** 4xx is an answer, not a hiccup: only retry what a retry could fix. */
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error) && error.response !== undefined) {
          return error.response.status >= 500 && failureCount < 2;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

import { QueryClient } from "@tanstack/query-core";

export const createBoardQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        gcTime: 5 * 60 * 1000,
      },
    },
  });

import { QueryClient } from "@tanstack/react-query";

const getDefaultOptions = () => ({
  queries: {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5
  }
});

export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: getDefaultOptions()
  });


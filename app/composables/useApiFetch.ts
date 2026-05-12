import type { UseFetchOptions } from '#app'

export function useApiFetch<T>(
  request: string | (() => string),
  options: UseFetchOptions<T> = {},
) {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server ? config.apiBase : config.public.apiBase

  return useFetch<T>(request, {
    baseURL,
    credentials: 'include',
    ...options,
  })
}

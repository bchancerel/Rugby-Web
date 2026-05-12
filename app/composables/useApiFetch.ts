export const useApiFetch = createUseFetch((options) => {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server ? config.apiBase : config.public.apiBase

  return {
    ...options,
    baseURL,
    credentials: 'include',
  }
})

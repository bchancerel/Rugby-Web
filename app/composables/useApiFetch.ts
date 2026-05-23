export const useApiFetch = createUseFetch((options) => {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server ? config.apiBase : config.public.apiBase

  return {
    ...options,
    baseURL,
    credentials: 'include',
  }
})

export const useApiRequest = () => {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server ? config.apiBase : config.public.apiBase

  return $fetch.create({
    baseURL,
    credentials: 'include',
  })
}

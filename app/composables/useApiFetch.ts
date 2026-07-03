export const useApiFetch = createUseFetch((options) => {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server ? config.apiBase : config.public.apiBase

  return {
    ...options,
    baseURL,
    credentials: 'include',
  }
})

const isAuthRefreshRequest = (request: unknown) =>
  typeof request === 'string' && request.includes('/auth/refresh')

const isUnauthorizedError = (error: unknown) => {
  const apiError = error as { status?: number, statusCode?: number, response?: { status?: number } }

  return apiError.status === 401 || apiError.statusCode === 401 || apiError.response?.status === 401
}

let refreshRequest: Promise<unknown> | null = null

export const useApiRequest = () => {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server ? config.apiBase : config.public.apiBase
  const apiFetch = $fetch.create({
    baseURL,
    credentials: 'include',
  })

  const refreshSessionCookie = async () => {
    if (!refreshRequest) {
      refreshRequest = apiFetch('/auth/refresh', { method: 'POST' })
        .finally(() => {
          refreshRequest = null
        })
    }

    await refreshRequest
  }

  return async <T>(request: Parameters<typeof apiFetch>[0], options?: Parameters<typeof apiFetch>[1]) => {
    try {
      return await apiFetch<T>(request, options)
    } catch (error) {
      if (isAuthRefreshRequest(request) || !isUnauthorizedError(error)) {
        throw error
      }

      await refreshSessionCookie()
      return await apiFetch<T>(request, options)
    }
  }
}

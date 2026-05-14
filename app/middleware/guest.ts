export default defineNuxtRouteMiddleware(async () => {
    if (import.meta.server) return

    const { initialized, isAuthenticated, fetchMe } = useAuth()

    if (!initialized.value) {
        await fetchMe()
    }

    if (isAuthenticated.value) {
        return navigateTo('/leagues')
    }
})

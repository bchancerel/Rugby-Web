export default defineNuxtRouteMiddleware(async () => {
    if (import.meta.server) return

    const { initialized, user, isAuthenticated, fetchMe } = useAuth()

    if (!initialized.value) {
        await fetchMe()
    }

    if (!isAuthenticated.value) {
        return navigateTo('/auth/login')
    }

    if (user.value?.role !== 'ADMIN') {
        return navigateTo('/leagues')
    }
})

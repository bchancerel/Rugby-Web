export default defineNuxtPlugin(async () => {
    const { initialized, fetchMe } = useAuth()

    if (!initialized.value) {
        await fetchMe()
    }
})

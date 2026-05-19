import type {
    ApiMessageResponse,
    AuthResponse,
    AuthUser,
    ForgotPasswordPayload,
    LoginPayload,
    RegisterPayload,
    ResetPasswordPayload,
    UpdateMePayload,
    VerifyEmailPayload,
} from '~/types/auth'

type ApiError = {
    status?: number
    statusCode?: number
    response?: {
        status?: number
    }
    data?: {
        message?: string;
        errors?: Array<{message?: string}>
    }
    message?: string
}

const getErrorMessage = (error: unknown) => {
    const apiError = error as ApiError;

    return (
        apiError.data?.message ||
        apiError.data?.errors?.[0]?.message ||
        apiError.message ||
        'Une erreur est survenue.'
    )
}

const getErrorStatus = (error: unknown) => {
    const apiError = error as ApiError

    return apiError.statusCode || apiError.status || apiError.response?.status
}

export const useAuth = () => {
    const user = useState<AuthUser | null>('auth:user', () => null)
    const pending = useState<boolean>('auth:pending', () => false)
    const initialized = useState<boolean>('auth:initialized', () => false)

    const isAuthenticated = computed(() => Boolean(user.value))

    const setUser = (nextUser : AuthUser | null) => {
        user.value = nextUser
    }

    const login = async (payload: LoginPayload) => {
        pending.value = true

        try {
            const data = await $fetch<AuthResponse>('/api/auth/login', {
                method: 'POST',
                body: payload,
                credentials: 'include',
            })

            setUser(data.user)
            return data.user
        } catch (error) {
            throw new Error(getErrorMessage(error))
        } finally {
            pending.value = false
        }
    }

    const register = async (payload: RegisterPayload) => {
        pending.value = true

        try {
            const data = await $fetch<AuthResponse>('/api/auth/register', {
                method: 'POST',
                body: payload,
                credentials: 'include',
            })

            setUser(data.user)
            return data.user
        } catch (error) {
            throw new Error(getErrorMessage(error))
        } finally {
            pending.value = false
        }
    }

    const refreshAccessToken = async () => {
        try {
            await $fetch<ApiMessageResponse>('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include',
            })

            return true
        } catch {
            return false
        }
    }

    const fetchMe = async (tryRefresh = true) => {
        pending.value = true
        
        try {
            const data = await $fetch<AuthUser>('/api/users/me', {
                credentials: 'include',
            })

            setUser(data)
            return data
        } catch (error) {
            if (tryRefresh && getErrorStatus(error) === 401 && await refreshAccessToken()) {
                return await fetchMe(false)
            }

            setUser(null)
            return null
        } finally {
            pending.value = false
            initialized.value = true
        }
    }

    const updateMe = async (payload: UpdateMePayload) => {
        pending.value = true

        try {
            const data = await $fetch<AuthUser>('/api/users/me', {
                method: 'PATCH',
                body: payload,
                credentials: 'include',
            })

            setUser(data)
            return data
        } catch (error) {
            throw new Error(getErrorMessage(error))
        } finally {
            pending.value = false
        }
    }

    const refreshSession = async () => {
        if (await refreshAccessToken()) {
            return await fetchMe()
        }   

        setUser(null)
        return null
    }

    const forgotPassword = async (payload: ForgotPasswordPayload) => {
        pending.value = true

        try {
            return await $fetch<ApiMessageResponse>('/api/auth/forgot-password', {
                method: 'POST',
                body: payload,
                credentials: 'include',
            })
        } catch (error) {
            throw new Error(getErrorMessage(error))
        } finally {
            pending.value = false
        }
    }

    const resetPassword = async (payload: ResetPasswordPayload) => {
        pending.value = true

        try {
            return await $fetch<ApiMessageResponse>('/api/auth/reset-password', {
                method: 'POST',
                body: payload,
                credentials: 'include',
            })
        } catch (error) {
            throw new Error(getErrorMessage(error))
        } finally {
            pending.value = false
        }
    }

    const verifyEmail = async (payload: VerifyEmailPayload) => {
        pending.value = true

        try {
            return await $fetch<ApiMessageResponse>('/api/auth/verify-email', {
                method: 'POST',
                body: payload,
                credentials: 'include',
            })
        } catch (error) {
            throw new Error(getErrorMessage(error))
        } finally {
            pending.value = false
        }
    }

    const resendVerification = async () => {
        pending.value = true

        try {
            return await $fetch<ApiMessageResponse>('/api/auth/resend-verification', {
                method: 'POST',
                credentials: 'include',
            })
        } catch (error) {
            throw new Error(getErrorMessage(error))
        } finally {
            pending.value = false
        }
    }

    const logout = async () => {
        pending.value = true

        try {
            await $fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            })
        } finally {
            setUser(null)
            pending.value = false
            initialized.value = true
        }
    }

    return {
        user,
        pending,
        initialized,
        isAuthenticated,
        login,
        register,
        fetchMe,
        updateMe,
        refreshSession,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        setUser,
        logout,
    }
}

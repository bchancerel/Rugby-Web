import type {
    AdminRoleUpdateResponse,
    AdminUser,
    AdminUsersResponse,
} from '~/types/admin'
import type { AuthRole } from '~/types/auth'

type ApiError = {
    data?: {
        message?: string
        errors?: Array<{message?: string}>
    }
    message?: string
}

const getAdminErrorMessage = (error: unknown) => {
    const apiError = error as ApiError

    return (
        apiError.data?.message ||
        apiError.data?.errors?.[0]?.message ||
        apiError.message ||
        'Une erreur est survenue.'
    )
}

export const useAdminUsers = () => {
    const users = useState<AdminUser[]>('admin-users:list', () => [])
    const page = useState<number>('admin-users:page', () => 1)
    const limit = useState<number>('admin-users:limit', () => 20)
    const total = useState<number>('admin-users:total', () => 0)
    const totalPages = useState<number>('admin-users:total-pages', () => 1)
    const pending = useState<boolean>('admin-users:pending', () => false)
    const actionPendingUserId = useState<string | null>('admin-users:action-pending-user-id', () => null)
    const errorMessage = useState<string | null>('admin-users:error-message', () => null)

    const fetchUsers = async (nextPage = page.value) => {
        pending.value = true
        errorMessage.value = null

        try {
            const data = await $fetch<AdminUsersResponse>('/api/admin/users', {
                query: {
                    page: nextPage,
                    limit: limit.value,
                },
                credentials: 'include',
            })

            users.value = data.users
            total.value = data.total
            page.value = data.page
            totalPages.value = data.totalPages

            return data
        } catch (error) {
            errorMessage.value = getAdminErrorMessage(error)
            return null
        } finally {
            pending.value = false
        }
    }

    const updateUserRole = async (userId: string, role: AuthRole) => {
        actionPendingUserId.value = userId
        errorMessage.value = null

        try {
            const updatedUser = await $fetch<AdminRoleUpdateResponse>(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                body: { role },
                credentials: 'include',
            })

            users.value = users.value.map((user) => {
                if (user.id !== userId) {
                    return user
                }

                return {
                    ...user,
                    role: updatedUser.role,
                }
            })

            return updatedUser
        } catch (error) {
            errorMessage.value = getAdminErrorMessage(error)
            return null
        } finally {
            actionPendingUserId.value = null
        }
    }

    const deleteUser = async (userId: string) => {
        actionPendingUserId.value = userId
        errorMessage.value = null

        try {
            await $fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            const shouldGoBack = users.value.length === 1 && page.value > 1
            await fetchUsers(shouldGoBack ? page.value - 1 : page.value)

            return true
        } catch (error) {
            errorMessage.value = getAdminErrorMessage(error)
            return false
        } finally {
            actionPendingUserId.value = null
        }
    }

    return {
        users,
        page,
        limit,
        total,
        totalPages,
        pending,
        actionPendingUserId,
        errorMessage,
        fetchUsers,
        updateUserRole,
        deleteUser,
    }
}

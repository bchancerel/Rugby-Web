import type { AuthRole } from './auth'

export type AdminUser = {
    id: string
    email: string
    username: string | null
    role: AuthRole
    createdAt: string
}

export type AdminUsersResponse = {
    users: AdminUser[]
    total: number
    page: number
    totalPages: number
}

export type AdminRoleUpdatePayload = {
    role: AuthRole
}

export type AdminRoleUpdateResponse = Pick<AdminUser, 'id' | 'email' | 'username' | 'role'>

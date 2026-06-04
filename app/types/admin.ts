import type { AuthRole } from './auth'
import type { SupporterLevel } from './supporter'

export type AdminUser = {
    id: string
    email: string
    username: string | null
    role: AuthRole
    createdAt: string
    supporter: {
        totalXp: number
        level: SupporterLevel
        badges: {
            unlocked: number
            total: number
        }
    }
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

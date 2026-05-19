export type AuthRole = 'USER' | 'ADMIN'

export type AuthUser = {
    id: string
    email: string
    username: string | null
    role: AuthRole
    emailVerified: boolean
    createdAt?: string
    updatedAt?: string
}

export type AuthResponse = {
    user: AuthUser
}

export type LoginPayload = {
    email: string
    password: string
}

export type RegisterPayload = LoginPayload & {
    username?: string
}

export type UpdateMePayload = {
    username?: string
    currentPassword?: string
    password?: string
}

export type ForgotPasswordPayload = {
    email: string
}

export type ResetPasswordPayload = {
    token: string
    password: string
}

export type VerifyEmailPayload = {
    token: string
}

export type ApiMessageResponse = {
    message: string
}

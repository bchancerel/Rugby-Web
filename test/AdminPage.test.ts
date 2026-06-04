import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import AdminPage from '~/pages/admin/index.vue'
import type { AdminUser } from '~/types/admin'

const adminUsers: AdminUser[] = [
  {
    id: 'user-1',
    email: 'user1@test.com',
    username: 'user1',
    role: 'USER',
    createdAt: '2026-06-04T10:00:00.000Z',
    supporter: {
      totalXp: 680,
      level: {
        value: 4,
        label: 'Analyste du vestiaire',
        currentLevelXp: 500,
        nextLevelXp: 900,
        nextLevelLabel: 'Legende locale',
        progress: 45,
      },
      badges: {
        unlocked: 4,
        total: 12,
      },
    },
  },
]

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    user: computed(() => ({ id: 'admin-user', role: 'ADMIN' })),
  }),
}))

vi.mock('~/composables/useAdminUsers', () => ({
  useAdminUsers: () => ({
    users: ref(adminUsers),
    page: ref(1),
    total: ref(1),
    totalPages: ref(1),
    pending: ref(false),
    actionPendingUserId: ref(null),
    errorMessage: ref(null),
    fetchUsers: vi.fn(),
    updateUserRole: vi.fn(),
    deleteUser: vi.fn(),
  }),
}))

describe('AdminPage', () => {
  it('renders supporter level, XP and badge progress for each user', () => {
    const wrapper = mount(AdminPage)

    expect(wrapper.text()).toContain('Supporter')
    expect(wrapper.text()).toContain('Niv. 4')
    expect(wrapper.text()).toContain('Analyste du vestiaire')
    expect(wrapper.text()).toContain('680 XP / 4/12 badges')
  })
})

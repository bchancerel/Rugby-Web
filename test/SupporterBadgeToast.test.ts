import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import SupporterBadgeToast from '~/components/supporter/SupporterBadgeToast.vue'
import { useSupporterRewards } from '~/composables/useSupporterRewards'
import { createSupporterBadge, createSupporterLevel } from './fixtures/supporter'

describe('SupporterBadgeToast', () => {
  it('renders badge notifications with the badge image', async () => {
    vi.useFakeTimers()
    const rewards = useSupporterRewards()

    rewards.notifyBadgeUnlocked(createSupporterBadge({ key: 'MATCH_DAY', label: 'Jour de match' }))
    mount(SupporterBadgeToast, { attachTo: document.body })
    await nextTick()

    const toast = document.body.querySelector('.supporter-badge-toast')
    const image = document.body.querySelector<HTMLImageElement>('.supporter-badge-toast-mark img')

    expect(toast?.textContent).toContain('Badge débloqué')
    expect(toast?.textContent).toContain('Jour de match')
    expect(image?.getAttribute('src')).toBe('/images/badges/badge_3.png')
  })

  it('renders level notifications and dismisses them from the close button', async () => {
    vi.useFakeTimers()
    const rewards = useSupporterRewards()

    rewards.notifyLevelUnlocked(createSupporterLevel({ value: 4, label: 'Capitaine de tribune' }))
    mount(SupporterBadgeToast, { attachTo: document.body })
    await nextTick()

    expect(document.body.querySelector('.supporter-badge-toast.level-up')).not.toBeNull()
    expect(document.body.textContent).toContain('Niveau atteint')
    expect(document.body.textContent).toContain('Capitaine de tribune')

    document.body.querySelector<HTMLButtonElement>('.supporter-badge-toast-close')?.click()
    await nextTick()

    expect(rewards.toasts.value).toHaveLength(0)
  })
})

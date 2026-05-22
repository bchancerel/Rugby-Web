import { describe, expect, it, vi } from 'vitest'
import { useSupporterRewards } from '~/composables/useSupporterRewards'
import { createSupporterBadge, createSupporterLevel } from './fixtures/supporter'

describe('useSupporterRewards', () => {
  it('creates one badge toast, persists the recent badge and deduplicates it', () => {
    vi.useFakeTimers()
    const rewards = useSupporterRewards()
    const badge = createSupporterBadge()

    rewards.notifyBadgeUnlocked(badge)
    rewards.notifyBadgeUnlocked(badge)

    expect(rewards.toasts.value).toHaveLength(1)
    expect(rewards.toasts.value[0]).toMatchObject({ type: 'badge', badge })
    expect(rewards.recentBadgeKeys.value).toEqual(['FIRST_FAVORITE'])
    expect(window.sessionStorage.getItem('rugbyjam:supporter:recent-badges')).toBe(
      '["FIRST_FAVORITE"]'
    )

    vi.advanceTimersByTime(6500)

    expect(rewards.toasts.value).toHaveLength(0)
  })

  it('creates one level toast, persists the recent level and can clear it', () => {
    vi.useFakeTimers()
    const rewards = useSupporterRewards()
    const level = createSupporterLevel({ value: 3, label: 'Pilier local' })

    rewards.notifyLevelUnlocked(level)
    rewards.notifyLevelUnlocked(level)

    expect(rewards.toasts.value).toHaveLength(1)
    expect(rewards.toasts.value[0]).toMatchObject({ type: 'level', level })
    expect(rewards.isLevelRecentlyUnlocked(3)).toBe(true)
    expect(window.sessionStorage.getItem('rugbyjam:supporter:recent-levels')).toBe('[3]')

    rewards.clearRecentLevel(3)

    expect(rewards.isLevelRecentlyUnlocked(3)).toBe(false)
    expect(window.sessionStorage.getItem('rugbyjam:supporter:recent-levels')).toBe('[]')
  })

  it('can notify a badge while a level toast is already visible', () => {
    vi.useFakeTimers()
    const rewards = useSupporterRewards()

    rewards.notifyLevelUnlocked(createSupporterLevel({ value: 2 }))

    expect(() => rewards.notifyBadgeUnlocked(createSupporterBadge())).not.toThrow()
    expect(rewards.toasts.value.map((toast) => toast.type)).toEqual(['level', 'badge'])
  })
})

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import SupporterLevelGauge from '~/components/supporter/SupporterLevelGauge.vue'
import { createSupporterLevel } from './fixtures/supporter'

describe('SupporterLevelGauge', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  it('renders level progress metadata and animates the gauge width', async () => {
    const wrapper = mount(SupporterLevelGauge, {
      props: {
        level: createSupporterLevel({
          value: 2,
          label: 'Tribune active',
          currentLevelXp: 120,
          nextLevelXp: 250,
          nextLevelLabel: 'Pilier local',
          progress: 48,
        }),
        totalXp: 370,
      },
    })
    await nextTick()

    expect(wrapper.text()).toContain('Niveau 2')
    expect(wrapper.text()).toContain('Tribune active')
    expect(wrapper.text()).toContain('370 XP')
    expect(wrapper.text()).toContain('48% vers Pilier local')
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('48')
    expect(wrapper.get('.supporter-gauge span').attributes('style')).toContain('width: 48%')
  })

  it('marks the panel as recently unlocked and emits when its animation ends', async () => {
    const wrapper = mount(SupporterLevelGauge, {
      props: {
        level: createSupporterLevel({ value: 3 }),
        totalXp: 500,
        recentlyUnlocked: true,
      },
    })

    expect(wrapper.get('section').classes()).toContain('recently-unlocked')

    await wrapper.get('section').trigger('animationend')

    expect(wrapper.emitted('animationComplete')).toEqual([[3]])
  })

  it('uses max labels when there is no next level', () => {
    const wrapper = mount(SupporterLevelGauge, {
      props: {
        level: createSupporterLevel({
          value: 5,
          label: 'Legende RugbyJam',
          nextLevelXp: null,
          nextLevelLabel: null,
          progress: 100,
        }),
        totalXp: 1200,
      },
    })

    expect(wrapper.text()).toContain('Max')
    expect(wrapper.text()).toContain('100% vers Niveau maximum')
  })
})

import type { SupporterBadge, SupporterLevel } from '~/types/supporter'

export const createSupporterBadge = (
  overrides: Partial<SupporterBadge> = {}
): SupporterBadge => ({
  key: 'FIRST_FAVORITE',
  label: 'Premier favori',
  description: 'Ajoute une equipe en favori.',
  xp: 25,
  unlocked: true,
  unlockedAt: '2026-05-22T12:00:00.000Z',
  ...overrides,
})

export const createSupporterLevel = (
  overrides: Partial<SupporterLevel> = {}
): SupporterLevel => ({
  value: 2,
  label: 'Tribune active',
  currentLevelXp: 120,
  nextLevelXp: 250,
  nextLevelLabel: 'Pilier local',
  progress: 48,
  ...overrides,
})

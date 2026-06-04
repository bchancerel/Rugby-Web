import { describe, expect, it } from 'vitest'
import { getSupporterBadgeImageSrc } from '~/utils/supporterBadges'

describe('getSupporterBadgeImageSrc', () => {
  it('returns the public asset path for every supporter badge key', () => {
    expect(getSupporterBadgeImageSrc('FIRST_FAVORITE')).toBe('/images/badges/badge_1.png')
    expect(getSupporterBadgeImageSrc('CALENDAR_SUBSCRIBER')).toBe('/images/badges/badge_2.png')
    expect(getSupporterBadgeImageSrc('MATCH_DAY')).toBe('/images/badges/badge_3.png')
    expect(getSupporterBadgeImageSrc('FINISHER')).toBe('/images/badges/badge_4.png')
    expect(getSupporterBadgeImageSrc('LOYAL_SUPPORTER')).toBe('/images/badges/badge_5.png')
    expect(getSupporterBadgeImageSrc('EXPLORER')).toBe('/images/badges/badge_6.png')
    expect(getSupporterBadgeImageSrc('DERBY_HUNTER')).toBe('/images/badges/badge_7.png')
    expect(getSupporterBadgeImageSrc('LIVE_REGULAR')).toBe('/images/badges/badge_8.png')
    expect(getSupporterBadgeImageSrc('MATCH_ARCHIVIST')).toBe('/images/badges/badge_9.png')
    expect(getSupporterBadgeImageSrc('TEAM_SCOUT')).toBe('/images/badges/badge_10.png')
    expect(getSupporterBadgeImageSrc('COMPETITION_TOUR')).toBe('/images/badges/badge_11.png')
    expect(getSupporterBadgeImageSrc('SUPER_FAVORITE')).toBe('/images/badges/badge_12.png')
  })
})

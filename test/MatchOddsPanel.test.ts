import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MatchOddsPanel from '~/components/match/MatchOddsPanel.vue'
import type { RugbyFixture, RugbyMatchOdds } from '~/types/rugby'

const fixture: RugbyFixture = {
  id: 100,
  date: '2026-05-06T20:00:00+00:00',
  timestamp: 1778097600,
  timezone: 'Europe/Paris',
  status: { long: 'Not Started', short: 'NS', elapsed: null },
  league: { id: 4, name: 'Top 14', season: 2026, logo: null, round: 'Regular Season - 1' },
  teams: {
    home: { id: 10, name: 'Toulouse', logo: null, winner: null },
    away: { id: 11, name: 'La Rochelle', logo: null, winner: null },
  },
  score: { home: null, away: null },
  periods: {
    first: { home: null, away: null },
    second: { home: null, away: null },
    overtime: { home: null, away: null },
    secondOvertime: { home: null, away: null },
  },
}

const odds: RugbyMatchOdds = {
  gameId: 100,
  favorite: {
    side: 'home',
    teamName: 'Toulouse',
    odd: 1.75,
    confidence: 'clear',
  },
  averages: {
    home: 1.75,
    away: 2.15,
    draw: null,
  },
  bookmakersCount: 2,
  updatedAt: '2026-05-05T12:00:00+00:00',
  markets: [
    {
      id: 1,
      name: 'Match Winner',
      bookmakers: [
        {
          id: 1,
          name: 'Book A',
          values: [
            { label: 'Toulouse', odd: 1.7, side: 'home' },
            { label: 'La Rochelle', odd: 2.2, side: 'away' },
          ],
        },
        {
          id: 2,
          name: 'Book B',
          values: [
            { label: 'Home', odd: 1.8, side: 'home' },
            { label: 'Away', odd: 2.1, side: 'away' },
          ],
        },
      ],
    },
  ],
}

describe('MatchOddsPanel', () => {
  it('renders the favorite, average odds and bookmaker rows', () => {
    const wrapper = mount(MatchOddsPanel, {
      props: {
        fixture,
        odds,
        pending: false,
        errorMessage: '',
        isLive: false,
      },
    })

    expect(wrapper.text()).toContain('Favori selon les cotes')
    expect(wrapper.text()).toContain('tendance nette')
    expect(wrapper.text()).toContain('Toulouse')
    expect(wrapper.text()).toContain('1,75')
    expect(wrapper.text()).toContain('2,15')
    expect(wrapper.text()).toContain('Book A')
    expect(wrapper.text()).toContain('Book B')
    expect(wrapper.text()).toContain('Cotes fournies a titre informatif')
  })

  it('labels live fixtures as pre-match odds', () => {
    const wrapper = mount(MatchOddsPanel, {
      props: {
        fixture,
        odds,
        pending: false,
        errorMessage: '',
        isLive: true,
      },
    })

    expect(wrapper.text()).toContain('Cotes pre-match')
  })

  it('renders loading, error and empty states', async () => {
    const wrapper = mount(MatchOddsPanel, {
      props: {
        fixture,
        odds: null,
        pending: true,
        errorMessage: '',
        isLive: false,
      },
    })

    expect(wrapper.text()).toContain('Chargement des cotes')

    await wrapper.setProps({ pending: false, errorMessage: 'API indisponible' })
    expect(wrapper.text()).toContain('API indisponible')

    await wrapper.setProps({ errorMessage: '', odds: { ...odds, bookmakersCount: 0, markets: [] } })
    expect(wrapper.text()).toContain('Aucune cote disponible')
  })
})

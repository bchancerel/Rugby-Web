export type RugbyCountry = {
    name: string | null
    code: string | null
    flag: string | null
}

export type RugbyLeagueSeason = {
    year: number | null
    start: string | null
    end: string | null
    current: boolean | null
}

export type RugbyLeague = {
    id: number | null
    name: string | null
    type: string | null
    logo: string | null
    country: RugbyCountry
    seasons: RugbyLeagueSeason[]
}

export type RugbyTeam = {
    id: number | null
    name: string | null
    logo: string | null
    country: RugbyCountry
}

export type RugbyFixtureStatus = {
    long: string | null
    short: string | null
    elapsed: number | null
}

export type RugbyFixtureLeague = {
    id: number | null
    name: string | null
    season: number | null
    logo: string | null
    round: string | null
}

export type RugbyFixtureTeam = {
    id: number | null
    name: string | null
    logo: string | null
    winner: boolean | null
}

export type RugbyFixturePeriodScore = {
    home: number | null
    away: number | null
}

export type RugbyFixture = {
    id: number | null
    date: string | null
    timestamp: number | null
    timezone: string | null
    status: RugbyFixtureStatus
    league: RugbyFixtureLeague
    teams: {
        home: RugbyFixtureTeam
        away: RugbyFixtureTeam
    }
    score: {
        home: number | null
        away: number | null
    }
    periods: {
        first: RugbyFixturePeriodScore
        second: RugbyFixturePeriodScore
        overtime: RugbyFixturePeriodScore
        secondOvertime: RugbyFixturePeriodScore
    }
}

export type RugbyStandingTeam = {
    id: number | null
    name: string | null
    logo: string | null
}

export type RugbyStandingRecord = {
    played: number | null
    win: number | null
    draw: number | null
    loss: number | null
    pointsFor: number | null
    pointsAgainst: number | null
}

export type RugbyStanding = {
    rank: number | null
    team: RugbyStandingTeam
    group: string | null
    form: string | null
    status: string | null
    description: string | null
    points: number | null
    pointsDiff: number | null
    all: RugbyStandingRecord
}

export type RugbyStandingGroup = {
    name: string | null
    rows: RugbyStanding[]
}

export type RugbyLeagueOverview = {
    league: RugbyLeague
    season: number | null
    standings: RugbyStandingGroup[]
    rounds: string[]
    fixtures: RugbyFixture[]
}

export type RugbyTeamStatisticsRecord = {
    played: number | null
    win: number | null
    draw: number | null
    loss: number | null
    pointsFor: number | null
    pointsAgainst: number | null
}

export type RugbyTeamStatistics = {
    team: RugbyStandingTeam
    league: {
        id: number | null
        name: string | null
        season: number | null
        logo: string | null
    }
    form: string | null
    all: RugbyTeamStatisticsRecord
    home: RugbyTeamStatisticsRecord
    away: RugbyTeamStatisticsRecord
}

export type RugbyTeamContext = {
    team: RugbyStandingTeam
    league: {
        id: number
        name: string | null
        season: number
        logo: string | null
    }
    fixturesCount: number
    lastFixtureTimestamp: number | null
}

export type RugbyFavoriteMatch = {
    key: string
    label: string
    type: 'competition' | 'team'
    entityId: string
    logo: string | null
    lastFixture: RugbyFixture | null
    nextFixture: RugbyFixture | null
}

export type RugbyMatchesHome = {
    favoriteMatches: RugbyFavoriteMatch[]
    liveFixtures: RugbyFixture[]
    upcomingFixtures: RugbyFixture[]
}

export type RugbyOddsSide = 'home' | 'away' | 'draw'
export type RugbyOddsConfidence = 'clear' | 'close' | 'unknown'

export type RugbyOddsValue = {
    label: string
    odd: number | null
    side: RugbyOddsSide | null
}

export type RugbyOddsBookmaker = {
    id: number | null
    name: string | null
    values: RugbyOddsValue[]
}

export type RugbyOddsMarket = {
    id: number | null
    name: string | null
    bookmakers: RugbyOddsBookmaker[]
}

export type RugbyMatchOdds = {
    gameId: number | null
    favorite: {
        side: RugbyOddsSide | null
        teamName: string | null
        odd: number | null
        confidence: RugbyOddsConfidence
    }
    averages: {
        home: number | null
        away: number | null
        draw: number | null
    }
    markets: RugbyOddsMarket[]
    bookmakersCount: number
    updatedAt: string | null
}

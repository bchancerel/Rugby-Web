import type { RugbyFixture } from '~/types/rugby'

export const useRugbyTeamLinks = () => {
    const getFixtureTeamPath = (fixture: RugbyFixture, teamId: string | number | null) => {
        if (teamId === null) return undefined

        const query: Record<string, string> = {}
        if (fixture.league.id !== null) query.league = String(fixture.league.id)
        if (fixture.league.season !== null) query.season = String(fixture.league.season)

        return {
            path: `/teams/${teamId}`,
            query,
        }
    }

    return {
        getFixtureTeamPath,
    }
}

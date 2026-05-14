import type { Ref } from 'vue'
import type { RugbyLeague } from '~/types/rugby'

export type RugbyLeagueCountryGroup = {
    countryName: string
    countryCode: string | null
    flag: string | null
    leagues: RugbyLeague[]
}

export type RugbyLeagueFilters = {
    searchQuery: Ref<string>
    selectedCountry: Ref<string>
    selectedType: Ref<string>
    currentSeasonOnly: Ref<boolean>
}

export const RUGBY_PLACEHOLDER_LOGO = '/images/competitions/placeholder.svg'

export const RUGBY_MAJOR_LEAGUE_IDS = [16, 17, 52, 54, 13, 76, 71, 69, 85, 51]

export const hasRugbyCurrentSeason = (league: RugbyLeague) =>
    league.seasons.some((season) => season.current)

export const getRugbyLeaguePath = (league: RugbyLeague | null) =>
    league?.id ? `/leagues/${league.id}` : '/leagues'

export const getRugbyLeagueKey = (league: RugbyLeague, fallback: string) =>
    String(league.id ?? league.name ?? fallback)

export const getRugbyLeagueSeasonLabel = (league: RugbyLeague) => {
    const currentSeason = league.seasons.find((season) => season.current)
    const latestSeason = [...league.seasons]
        .filter((season) => season.year)
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]

    return currentSeason?.year ?? latestSeason?.year ?? null
}

export const setRugbyPlaceholderLogo = (event: Event) => {
    const image = event.target as HTMLImageElement

    if (!image.src.endsWith(RUGBY_PLACEHOLDER_LOGO)) {
        image.src = RUGBY_PLACEHOLDER_LOGO
    }
}

export const useRugbyLeagueCatalog = (
    leagues: Ref<RugbyLeague[]>,
    filters: RugbyLeagueFilters
) => {
    const totalLeagues = computed(() => leagues.value.length)
    const totalCountries = computed(() => {
        const countries = new Set(
            leagues.value
                .map((league) => league.country.name)
                .filter((country): country is string => Boolean(country))
        )

        return countries.size
    })

    const countryOptions = computed(() =>
        Array.from(
            new Set(
                leagues.value
                    .map((league) => league.country.name)
                    .filter((country): country is string => Boolean(country))
            )
        ).sort((a, b) => a.localeCompare(b))
    )

    const typeOptions = computed(() =>
        Array.from(
            new Set(
                leagues.value
                    .map((league) => league.type)
                    .filter((type): type is string => Boolean(type))
            )
        ).sort((a, b) => a.localeCompare(b))
    )

    const filteredLeagues = computed(() => {
        const query = filters.searchQuery.value.trim().toLowerCase()

        return leagues.value
            .filter((league) => {
                const matchesQuery = !query
                    || league.name?.toLowerCase().includes(query)
                    || league.country.name?.toLowerCase().includes(query)
                const matchesCountry = !filters.selectedCountry.value
                    || league.country.name === filters.selectedCountry.value
                const matchesType = !filters.selectedType.value
                    || league.type === filters.selectedType.value
                const matchesCurrentSeason = !filters.currentSeasonOnly.value
                    || hasRugbyCurrentSeason(league)

                return matchesQuery && matchesCountry && matchesType && matchesCurrentSeason
            })
            .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    })

    const groupedLeaguesByCountry = computed<RugbyLeagueCountryGroup[]>(() => {
        const groups = new Map<string, RugbyLeagueCountryGroup>()

        for (const league of filteredLeagues.value) {
            const countryName = league.country.name ?? 'Pays inconnu'
            const existingGroup = groups.get(countryName)

            if (existingGroup) {
                existingGroup.leagues.push(league)
                continue
            }

            groups.set(countryName, {
                countryName,
                countryCode: league.country.code,
                flag: league.country.flag,
                leagues: [league],
            })
        }

        return Array.from(groups.values()).sort((a, b) => a.countryName.localeCompare(b.countryName))
    })

    const majorLeagues = computed(() =>
        RUGBY_MAJOR_LEAGUE_IDS
            .map((id) => leagues.value.find((league) => league.id === id) ?? null)
            .filter((league): league is RugbyLeague => Boolean(league))
    )

    const resetFilters = () => {
        filters.searchQuery.value = ''
        filters.selectedCountry.value = ''
        filters.selectedType.value = ''
        filters.currentSeasonOnly.value = false
    }

    return {
        totalLeagues,
        totalCountries,
        countryOptions,
        typeOptions,
        filteredLeagues,
        groupedLeaguesByCountry,
        majorLeagues,
        resetFilters,
    }
}

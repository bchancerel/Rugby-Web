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

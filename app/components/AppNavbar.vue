<script setup lang="ts">
const route = useRoute()
const open = ref(false)
const { user } = useAuth()
const logoPath = '/dashboard'

type NavIcon = 'trophy' | 'calendar' | 'news' | 'user' | 'shield' | 'medal' | 'arrow' | 'menu' | 'close'

type NavLink = {
    to: string
    label: string
    icon: NavIcon
}

const links: NavLink[] = [
    { label: 'Leagues', to: '/leagues', icon: 'trophy' },
    { label: 'Matchs', to: '/match', icon: 'calendar' },
    { label: 'Actualités', to: '/actualites', icon: 'news' },
    { label: 'Supporter', to: '/supporter', icon: 'medal' },
    { label: 'Mon compte', to: '/user', icon: 'user' },
]
const desktopLinks: NavLink[] = [
    { label: 'Leagues', to: '/leagues', icon: 'trophy' },
    { label: 'Matchs', to: '/match', icon: 'calendar' },
    { label: 'Actualités', to: '/actualites', icon: 'news' },
    { label: 'Supporter', to: '/supporter', icon: 'medal' },
]
const isAdmin = computed(() => user.value?.role === 'ADMIN')

const iconPaths: Record<NavIcon, string[]> = {
    trophy: [
        'M8 21h8',
        'M12 17v4',
        'M7 4h10v5a5 5 0 0 1-10 0V4Z',
        'M5 6H3v2a4 4 0 0 0 4 4',
        'M19 6h2v2a4 4 0 0 1-4 4',
    ],
    calendar: [
        'M8 3v4',
        'M16 3v4',
        'M4 8h16',
        'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
        'M8 12h3',
        'M13 12h3',
        'M8 16h3',
    ],
    news: [
        'M4 5h11a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3V5Z',
        'M18 9h2v7a3 3 0 0 1-3 3',
        'M7 9h7',
        'M7 13h7',
        'M7 17h4',
    ],
    user: [
        'M20 21a8 8 0 0 0-16 0',
        'M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
    ],
    shield: [
        'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
        'M9.5 12.5 11 14l3.5-4',
    ],
    medal: [
        'M8 3h8l-2 5h-4L8 3Z',
        'M12 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z',
        'm10.5 14 1 1 2-2',
    ],
    arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
    menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
    close: ['M6 6l12 12', 'M18 6 6 18'],
}

const isActive = (to: string) => {
    return route.path === to || route.path.startsWith(`${to}/`)
}

const closeMenu = () => {
    open.value = false
}

watch(
    () => route.path,
    () => {
        closeMenu()
    }
)
</script>

<template>
    <header class="app-navbar" :class="{ 'is-open': open }">
        <div class="app-navbar-fade" aria-hidden="true" />

        <nav class="app-navbar-wrap" aria-label="Navigation principale">
            <div class="app-navbar-inner">
                <button
                    type="button"
                    class="app-navbar-toggle"
                    :aria-expanded="open"
                    aria-controls="app-navbar-mobile"
                    aria-label="Ouvrir le menu"
                    @click="open = !open"
                >
                    <span class="app-navbar-toggle-icon">
                        <svg
                            class="app-navbar-svg app-navbar-menu-icon"
                            :class="{ visible: !open }"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                v-for="path in iconPaths.menu"
                                :key="path"
                                :d="path"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                        <svg
                            class="app-navbar-svg app-navbar-close-icon"
                            :class="{ visible: open }"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                v-for="path in iconPaths.close"
                                :key="path"
                                :d="path"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </span>
                </button>

                <div class="app-navbar-desktop">
                    <div class="app-navbar-desktop-main">
                        <NuxtLink
                            :to="logoPath"
                            class="app-navbar-brand"
                            :class="{ active: isActive(logoPath) }"
                            aria-label="RugbyJam"
                            title="RugbyJam"
                        >
                            <span class="app-navbar-brand-frame">
                                <img src="/images/logo_app.svg" alt="RugbyJam" class="app-navbar-logo">
                            </span>
                        </NuxtLink>

                        <NuxtLink
                            v-for="link in desktopLinks"
                            :key="link.to + link.label"
                            :to="link.to"
                            class="app-navbar-link"
                            :class="{ active: isActive(link.to) }"
                            :aria-label="link.label"
                            :title="link.label"
                        >
                            <span class="app-navbar-link-bg" aria-hidden="true" />
                            <svg class="app-navbar-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    v-for="path in iconPaths[link.icon]"
                                    :key="path"
                                    :d="path"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </NuxtLink>
                    </div>

                    <div class="app-navbar-desktop-actions">
                        <NuxtLink
                            to="/user"
                            class="app-navbar-link"
                            :class="{ active: isActive('/user') }"
                            aria-label="Mon compte"
                            title="Mon compte"
                        >
                            <span class="app-navbar-link-bg" aria-hidden="true" />
                            <svg class="app-navbar-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    v-for="path in iconPaths.user"
                                    :key="path"
                                    :d="path"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </NuxtLink>

                        <NuxtLink
                            v-if="isAdmin"
                            to="/admin"
                            class="app-navbar-link app-navbar-admin-link"
                            :class="{ active: isActive('/admin') }"
                            aria-label="Administration"
                            title="Administration"
                        >
                            <span class="app-navbar-link-bg" aria-hidden="true" />
                            <svg class="app-navbar-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    v-for="path in iconPaths.shield"
                                    :key="path"
                                    :d="path"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </NuxtLink>
                    </div>
                </div>

                <NuxtLink :to="logoPath" class="app-navbar-mobile-brand" aria-label="RugbyJam" @click="closeMenu">
                    <img src="/images/logo_app.svg" alt="RugbyJam" class="app-navbar-mobile-logo">
                </NuxtLink>

                <div class="app-navbar-mobile-spacer" aria-hidden="true" />
            </div>

            <div
                id="app-navbar-mobile"
                class="app-navbar-mobile"
                :class="{ open }"
                :aria-hidden="!open"
            >
                <div class="app-navbar-mobile-list">
                    <NuxtLink
                        :to="logoPath"
                        class="app-navbar-mobile-link"
                        :class="{ active: isActive(logoPath) }"
                        @click="closeMenu"
                    >
                        <span class="app-navbar-mobile-label">
                            <span class="app-navbar-mobile-logo-mark">
                                <img src="/images/logo_app.svg" alt="" class="app-navbar-mobile-mini-logo">
                            </span>
                            <span>RugbyJam</span>
                        </span>
                        <svg class="app-navbar-mobile-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                v-for="path in iconPaths.arrow"
                                :key="path"
                                :d="path"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </NuxtLink>

                    <div class="app-navbar-mobile-separator" />

                    <NuxtLink
                        v-for="link in links"
                        :key="link.to + link.label"
                        :to="link.to"
                        class="app-navbar-mobile-link"
                        :class="{ active: isActive(link.to) }"
                        @click="closeMenu"
                    >
                        <span class="app-navbar-mobile-label">
                            <svg class="app-navbar-mobile-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    v-for="path in iconPaths[link.icon]"
                                    :key="path"
                                    :d="path"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                            <span>{{ link.label }}</span>
                        </span>
                        <svg class="app-navbar-mobile-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                v-for="path in iconPaths.arrow"
                                :key="path"
                                :d="path"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </NuxtLink>

                    <NuxtLink
                        v-if="isAdmin"
                        to="/admin"
                        class="app-navbar-mobile-link"
                        :class="{ active: isActive('/admin') }"
                        @click="closeMenu"
                    >
                        <span class="app-navbar-mobile-label">
                            <svg class="app-navbar-mobile-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    v-for="path in iconPaths.shield"
                                    :key="path"
                                    :d="path"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                            <span>Administration</span>
                        </span>
                        <svg class="app-navbar-mobile-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                v-for="path in iconPaths.arrow"
                                :key="path"
                                :d="path"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </NuxtLink>
                </div>
            </div>
        </nav>
    </header>
</template>

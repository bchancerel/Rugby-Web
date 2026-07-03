<script setup lang="ts">
import type { SupporterEvent, SupporterEventType } from '~/types/supporter'

defineProps<{
    events: SupporterEvent[]
}>()

const eventLabels: Record<SupporterEventType, string> = {
    FAVORITE_TEAM_ADDED: 'Équipe favorite ajoutée',
    FAVORITE_CLUB_ADDED: 'Club favori ajoute',
    FAVORITE_COMPETITION_ADDED: 'Compétition favorite ajoutée',
    MATCH_VIEWED: 'Fiche match consultée',
    LIVE_MATCH_FOLLOWED: 'Match live suivi',
    FINISHED_MATCH_VIEWED: 'Match terminé consulté',
    PROFILE_COMPLETED: 'Profil complété',
    DAILY_ACTIVE: 'Jour actif',
    TEAM_VIEWED: 'Équipe visitée',
    COMPETITION_VIEWED: 'Championnat visite',
    BADGE_UNLOCKED: 'Badge débloqué',
}

const formatEventDate = (date: string) => {
    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) return 'Date inconnue'

    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(parsedDate)
}
</script>

<template>
    <section class="supporter-panel" aria-labelledby="supporter-events-title">
        <div class="supporter-panel-heading">
            <div>
                <p class="supporter-eyebrow">Activite</p>
                <h2 id="supporter-events-title">Derniers points</h2>
            </div>
            <strong>{{ events.length }}</strong>
        </div>

        <div v-if="events.length" class="supporter-event-list">
            <article v-for="event in events" :key="event.id" class="supporter-event">
                <div>
                    <h3>{{ eventLabels[event.type] ?? event.type }}</h3>
                    <p>{{ formatEventDate(event.createdAt) }}</p>
                </div>
                <strong>+{{ event.xp }} XP</strong>
            </article>
        </div>

        <p v-else class="supporter-progress-copy">
            Les prochaines actions supporter apparaîtront ici.
        </p>
    </section>
</template>

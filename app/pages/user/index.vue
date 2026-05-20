<script setup lang="ts">
import UserAccountActions from '~/components/user/UserAccountActions.vue'
import UserInfoPanel from '~/components/user/UserInfoPanel.vue'
import UserPasswordForm from '~/components/user/UserPasswordForm.vue'
import UserSessionsPanel from '~/components/user/UserSessionsPanel.vue'
import UserUsernameForm from '~/components/user/UserUsernameForm.vue'

definePageMeta({
    middleware: 'auth',
})

useHead({
    title: 'RugbyJam | Mon compte',
})

const { user, pending } = useAuth()
</script>

<template>
    <main class="user-page">
        <section class="user-shell" aria-labelledby="user-title">
            <div class="user-heading">
                <p class="user-eyebrow">Mon compte</p>
                <h1 id="user-title">Profil utilisateur</h1>
            </div>

            <div class="user-grid">
                <UserInfoPanel :user="user" />
                <UserUsernameForm :user="user" :pending="pending" />
                <UserPasswordForm :pending="pending" />
                <UserSessionsPanel />
                <UserAccountActions :pending="pending" />
            </div>
        </section>
    </main>
</template>

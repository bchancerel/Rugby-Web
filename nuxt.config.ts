// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@pinia/nuxt'],
  vite: {
    plugins: [tailwindcss()],
  },
  devServer: {
    port: Number(process.env.NUXT_DEV_PORT) || 5173,
  },
  runtimeConfig: {
    apiBase: process.env.NUXT_API_BASE || 'http://localhost:3000/api',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },
  nitro: {
    devProxy: {
      '/api': {
        target: process.env.NUXT_API_PROXY_TARGET || 'http://localhost:3000/api',
        changeOrigin: true,
      },
    },
  },
})

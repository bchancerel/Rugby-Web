import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  vite: {
    plugins: [
      {
        name: 'test-public-asset-stub',
        enforce: 'pre',
        resolveId(id) {
          return id.startsWith('virtual:public?') ? id : null
        },
        load(id) {
          return id.startsWith('virtual:public?') ? 'export default ""' : null
        },
      },
    ],
  },
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        url: 'http://localhost:3000/__vitest__',
      },
    },
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
})

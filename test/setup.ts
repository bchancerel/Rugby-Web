import { afterEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { useState } from '#app'

enableAutoUnmount(afterEach)

afterEach(() => {
  useState('supporter:reward-toasts').value = []
  useState('supporter:recent-badge-keys').value = []
  useState('supporter:recent-level-values').value = []
  window.sessionStorage.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

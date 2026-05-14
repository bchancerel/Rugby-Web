<script setup lang="ts">
const route = useRoute()
const scrollProgress = ref(0)

let scrollFrame: number | null = null
let bodyResizeObserver: ResizeObserver | null = null

const useAppBackground = computed(() =>
  route.path !== '/' && !route.path.startsWith('/auth/')
)

const updateScrollProgress = () => {
  const documentElement = document.documentElement
  const scrollableHeight = documentElement.scrollHeight - documentElement.clientHeight

  scrollProgress.value = scrollableHeight > 0
    ? Math.min(documentElement.scrollTop / scrollableHeight, 1)
    : 0
}

const requestScrollProgressUpdate = () => {
  if (scrollFrame !== null) {
    return
  }

  scrollFrame = window.requestAnimationFrame(() => {
    updateScrollProgress()
    scrollFrame = null
  })
}

onMounted(() => {
  updateScrollProgress()
  window.addEventListener('scroll', requestScrollProgressUpdate, { passive: true })
  window.addEventListener('resize', requestScrollProgressUpdate)

  bodyResizeObserver = new ResizeObserver(requestScrollProgressUpdate)
  bodyResizeObserver.observe(document.body)
})

onUnmounted(() => {
  window.removeEventListener('scroll', requestScrollProgressUpdate)
  window.removeEventListener('resize', requestScrollProgressUpdate)
  bodyResizeObserver?.disconnect()

  if (scrollFrame !== null) {
    window.cancelAnimationFrame(scrollFrame)
  }
})
</script>

<template>
  <div :class="{ 'app-theme-shell': useAppBackground }">
    <NuxtRouteAnnouncer />
    <div
      class="app-scroll-progress"
      :style="{ transform: `scaleX(${scrollProgress})` }"
      aria-hidden="true"
    />
    <NuxtPage />
  </div>
</template>

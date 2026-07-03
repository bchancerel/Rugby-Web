import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ActualitesPage from '~/pages/actualites.vue'
import type { NewsResponse } from '~/types/news'

const apiRequestMock = vi.fn()

vi.mock('~/composables/useApiFetch', () => ({
  useApiRequest: () => apiRequestMock,
}))

const newsResponse: NewsResponse = {
  updatedAt: '2026-06-17T12:00:00.000Z',
  total: 2,
  limit: 24,
  offset: 0,
  hasMore: true,
  sources: [
    {
      source: 'rugbyrama',
      sourceLabel: 'Rugbyrama',
      status: 'ok',
      articlesCount: 1,
      error: null,
    },
    {
      source: 'rugbypass',
      sourceLabel: 'RugbyPass',
      status: 'error',
      articlesCount: 0,
      error: 'Feed unreachable',
    },
  ],
  items: [
    {
      id: 'article-1',
      title: 'Toulouse prepare sa finale',
      source: 'rugbyrama',
      sourceLabel: 'Rugbyrama',
      url: 'https://www.rugbyrama.fr/article-1',
      publishedAt: '2026-06-17T10:00:00.000Z',
      excerpt: 'Le Stade Toulousain affine ses derniers reglages.',
      imageUrl: 'https://example.com/article.jpg',
    },
  ],
}

const olderNewsResponse: NewsResponse = {
  ...newsResponse,
  offset: 1,
  hasMore: false,
  items: [
    {
      id: 'article-2',
      title: 'Un article plus ancien',
      source: 'rugbypass',
      sourceLabel: 'RugbyPass',
      url: 'https://www.rugbypass.com/news/article-2',
      publishedAt: '2026-06-16T10:00:00.000Z',
      excerpt: 'Le fil remonte dans le temps.',
      imageUrl: null,
    },
  ],
}

const emptyNewsResponse: NewsResponse = {
  ...newsResponse,
  total: 0,
  hasMore: false,
  sources: [
    {
      source: 'rugbyrama',
      sourceLabel: 'Rugbyrama',
      status: 'ok',
      articlesCount: 0,
      error: null,
    },
  ],
  items: [],
}

beforeEach(() => {
  apiRequestMock.mockReset()
  apiRequestMock.mockResolvedValue(newsResponse)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ActualitesPage', () => {
  it('renders articles and source status from the news API', async () => {
    const wrapper = mount(ActualitesPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(apiRequestMock).toHaveBeenCalledWith('/news', {
      query: {
        limit: 24,
        offset: 0,
      },
    })
    expect(wrapper.text()).toContain('Actualités')
    expect(wrapper.text()).toContain('Toulouse prepare sa finale')
    expect(wrapper.text()).toContain('Le Stade Toulousain affine ses derniers reglages.')
    expect(wrapper.text()).toContain('Rugbyrama')
    expect(wrapper.text()).toContain('Indisponible')
  })

  it('fetches the selected source when a source filter is clicked', async () => {
    const wrapper = mount(ActualitesPage)

    await flushPromises()
    await wrapper.findAll('.news-source-tabs button')[2].trigger('click')
    await flushPromises()

    expect(apiRequestMock).toHaveBeenLastCalledWith('/news', {
      query: {
        limit: 24,
        offset: 0,
        source: 'rugbypass',
      },
    })
  })

  it('fetches transfer articles when the transfer switch is enabled', async () => {
    const wrapper = mount(ActualitesPage)

    await flushPromises()
    await wrapper.find('.news-topic-switch input').setValue(true)
    await flushPromises()

    expect(apiRequestMock).toHaveBeenLastCalledWith('/news', {
      query: {
        limit: 24,
        offset: 0,
        topic: 'transfers',
      },
    })
  })

  it('combines the selected source with the transfer filter', async () => {
    const wrapper = mount(ActualitesPage)

    await flushPromises()
    await wrapper.find('.news-topic-switch input').setValue(true)
    await flushPromises()
    await wrapper.findAll('.news-source-tabs button')[1].trigger('click')
    await flushPromises()

    expect(apiRequestMock).toHaveBeenLastCalledWith('/news', {
      query: {
        limit: 24,
        offset: 0,
        source: 'rugbyrama',
        topic: 'transfers',
      },
    })
  })

  it('shows a specific empty state when transfer articles are filtered out', async () => {
    apiRequestMock
      .mockResolvedValueOnce(newsResponse)
      .mockResolvedValueOnce(emptyNewsResponse)

    const wrapper = mount(ActualitesPage)

    await flushPromises()
    await wrapper.find('.news-topic-switch input').setValue(true)
    await flushPromises()

    expect(wrapper.text()).toContain('Aucun article transfert disponible pour cette source.')
  })

  it('loads older articles when the load more button is clicked', async () => {
    apiRequestMock
      .mockResolvedValueOnce(newsResponse)
      .mockResolvedValueOnce(olderNewsResponse)

    const wrapper = mount(ActualitesPage)

    await flushPromises()
    expect(wrapper.text()).toContain('Toulouse prepare sa finale')
    expect(wrapper.text()).toContain('1 / 2 articles affiche')

    await wrapper.find('.news-load-more button').trigger('click')
    await flushPromises()

    expect(apiRequestMock).toHaveBeenLastCalledWith('/news', {
      query: {
        limit: 24,
        offset: 1,
      },
    })
    expect(wrapper.text()).toContain('Un article plus ancien')
    expect(wrapper.text()).toContain('2 / 2 articles affiches')
  })

  it('refreshes news every ten minutes while mounted', async () => {
    vi.useFakeTimers()

    const wrapper = mount(ActualitesPage)
    await flushPromises()

    expect(apiRequestMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    await flushPromises()

    expect(apiRequestMock).toHaveBeenCalledTimes(2)

    wrapper.unmount()

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    await flushPromises()

    expect(apiRequestMock).toHaveBeenCalledTimes(2)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import axios from 'axios'
import HomeView from '@/views/HomeView.vue'
import UploadProduct from '@/components/UploadProduct.vue'
import ProductIndex from '@/components/product/ProductIndex.vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const BASE_URL = 'http://127.0.0.1:8000'
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const graphqlProducts = [
  { id: 1, type: 'Phone', brand: 'Acme', model: 'X100', capacity: '128GB', quantity: 5 },
  { id: 2, type: 'Laptop', brand: 'Globex', model: 'Pro 15', capacity: '1TB', quantity: 2 },
]

const restProducts = [
  { id: 3, type: 'Tablet', brand: 'Initech', model: 'Slab 8', capacity: '64GB', quantity: 7 },
]

function graphqlResponse(products, paginator = {}) {
  return {
    data: {
      data: {
        products: {
          paginatorInfo: {
            currentPage: 1,
            lastPage: 1,
            total: products.length,
            perPage: 10,
            ...paginator,
          },
          data: products,
        },
      },
    },
  }
}

function restResponse(products, paginator = {}) {
  return {
    data: {
      data: {
        data: products,
        current_page: 1,
        last_page: 1,
        total: products.length,
        per_page: 10,
        ...paginator,
      },
    },
  }
}

function mountHome() {
  return mount(HomeView, {
    global: {
      // UploadProduct depends on the global VeeValidate components; stub it so the
      // view mounts standalone. Upload behaviour is still exercised via its emit.
      stubs: { UploadProduct: true },
    },
  })
}

// ProductIndex debounces its search box by 500 ms. HomeView's own handlers are the
// unit under test here, so drive them through the child's emit rather than typing
// (the debounce itself is covered in ProductIndex.spec.js).
function emitFromTable(wrapper, event, payload) {
  wrapper.findComponent(ProductIndex).vm.$emit(event, payload)
  return flushPromises()
}

function silenceWarn() {
  return vi.spyOn(console, 'warn').mockImplementation(() => {})
}

beforeEach(() => {
  axios.post.mockResolvedValue(graphqlResponse(graphqlProducts))
  axios.get.mockResolvedValue(restResponse(restProducts))
})

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('HomeView — fetching', () => {
  it('fetches products over GraphQL on mount and renders the table rows', async () => {
    const wrapper = mountHome()
    await flushPromises()

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(axios.post).toHaveBeenCalledWith(
      `${BASE_URL}/api/graphql`,
      expect.objectContaining({
        query: expect.stringContaining('products(filter: $filter, page: $page)'),
        variables: { filter: { search: '' }, page: 1 },
      }),
    )

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Acme')
    expect(rows[1].text()).toContain('Globex')
    expect(wrapper.text()).toContain('Showing 1 to 2 of 2 entries')
  })

  it('refetches from the REST endpoint when the API type is switched', async () => {
    const wrapper = mountHome()
    await flushPromises()

    await wrapper.find('#apiCallType').setValue('restApi')
    await flushPromises()

    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(axios.get).toHaveBeenCalledWith(`${BASE_URL}/api/products?page=1`)

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('Initech')
  })

  it('shows no demo banner while the backend is responding', async () => {
    const wrapper = mountHome()
    await flushPromises()

    expect(wrapper.find('[data-testid="demo-banner"]').exists()).toBe(false)
  })
})

describe('HomeView — search wiring', () => {
  it('passes the search term to GraphQL as variables.filter.search', async () => {
    const wrapper = mountHome()
    await flushPromises()

    await emitFromTable(wrapper, 'searchChanged', { apiCallType: 'graphql', search: 'foo' })

    expect(axios.post).toHaveBeenCalledTimes(2)
    expect(axios.post.mock.calls[1][0]).toBe(`${BASE_URL}/api/graphql`)
    expect(axios.post.mock.calls[1][1].variables).toEqual({
      filter: { search: 'foo' },
      page: 1,
    })
  })

  it('appends the search term to the REST query string', async () => {
    const wrapper = mountHome()
    await flushPromises()

    await emitFromTable(wrapper, 'searchChanged', { apiCallType: 'restApi', search: 'foo' })

    expect(axios.get).toHaveBeenCalledWith(`${BASE_URL}/api/products?page=1&search=foo`)
  })

  it('omits the search parameter from the REST URL when the term is empty', async () => {
    const wrapper = mountHome()
    await flushPromises()

    await emitFromTable(wrapper, 'searchChanged', { apiCallType: 'restApi', search: '' })

    expect(axios.get).toHaveBeenCalledWith(`${BASE_URL}/api/products?page=1`)
  })

  it('resets to page 1 when a new search comes in from a later page', async () => {
    axios.post
      .mockResolvedValueOnce(graphqlResponse(graphqlProducts, { currentPage: 3, lastPage: 5 }))
      .mockResolvedValueOnce(graphqlResponse(graphqlProducts, { currentPage: 1, lastPage: 1 }))

    const wrapper = mountHome()
    await flushPromises()

    await emitFromTable(wrapper, 'searchChanged', { apiCallType: 'graphql', search: 'foo' })

    expect(axios.post.mock.calls[1][1].variables.page).toBe(1)
  })
})

describe('HomeView — pagination guards', () => {
  it('advances to the next page while pages remain', async () => {
    axios.post.mockResolvedValue(graphqlResponse(graphqlProducts, { lastPage: 3 }))

    const wrapper = mountHome()
    await flushPromises()

    await emitFromTable(wrapper, 'nextPage', { apiCallType: 'graphql', search: '' })

    expect(axios.post).toHaveBeenCalledTimes(2)
    expect(axios.post.mock.calls[1][1].variables.page).toBe(2)
  })

  it('does not advance past the last page', async () => {
    axios.post.mockResolvedValue(graphqlResponse(graphqlProducts, { currentPage: 3, lastPage: 3 }))

    const wrapper = mountHome()
    await flushPromises()
    expect(axios.post).toHaveBeenCalledTimes(1)

    await emitFromTable(wrapper, 'nextPage', { apiCallType: 'graphql', search: '' })

    // Guard held: no extra request, and the page indicator stayed put.
    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(wrapper.find('span.border').text()).toBe('3')
  })

  it('steps back to the previous page', async () => {
    axios.post
      .mockResolvedValueOnce(graphqlResponse(graphqlProducts, { currentPage: 2, lastPage: 3 }))
      .mockResolvedValueOnce(graphqlResponse(graphqlProducts, { currentPage: 1, lastPage: 3 }))

    const wrapper = mountHome()
    await flushPromises()

    await emitFromTable(wrapper, 'prevPage', { apiCallType: 'graphql', search: '' })

    expect(axios.post).toHaveBeenCalledTimes(2)
    expect(axios.post.mock.calls[1][1].variables.page).toBe(1)
  })

  it('does not step below page 1', async () => {
    const wrapper = mountHome()
    await flushPromises()
    expect(axios.post).toHaveBeenCalledTimes(1)

    await emitFromTable(wrapper, 'prevPage', { apiCallType: 'graphql', search: '' })

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(wrapper.find('span.border').text()).toBe('1')
  })

  it('carries the active search term across a page change', async () => {
    axios.get.mockResolvedValue(restResponse(restProducts, { last_page: 3 }))

    const wrapper = mountHome()
    await flushPromises()

    await emitFromTable(wrapper, 'searchChanged', { apiCallType: 'restApi', search: 'slab' })
    await emitFromTable(wrapper, 'nextPage', { apiCallType: 'restApi', search: 'slab' })

    expect(axios.get).toHaveBeenLastCalledWith(`${BASE_URL}/api/products?page=2&search=slab`)
  })
})

describe('HomeView — demo-data fallback', () => {
  it('falls back to demo data with a dismissible banner when the backend is unreachable', async () => {
    axios.post.mockRejectedValue(new Error('ECONNREFUSED'))
    silenceWarn()

    const wrapper = mountHome()
    await flushPromises()

    // Demo catalogue rendered instead of an empty table
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBeGreaterThanOrEqual(5)
    expect(rows.length).toBeLessThanOrEqual(8)
    expect(wrapper.text()).not.toContain('NaN')

    // Banner points at the companion backend and can be dismissed
    const banner = wrapper.find('[data-testid="demo-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('Demo data')
    expect(banner.text()).toContain('laravel-inventory-api')
    expect(banner.find('a').attributes('href')).toContain('laravel-inventory-api')

    await banner.find('[data-testid="demo-banner-dismiss"]').trigger('click')
    expect(wrapper.find('[data-testid="demo-banner"]').exists()).toBe(false)
    // Demo rows stay after dismissing the notice
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThanOrEqual(5)
  })

  it('falls back to demo data when the REST branch fails, not just GraphQL', async () => {
    axios.get.mockRejectedValue(new Error('ECONNREFUSED'))
    silenceWarn()

    const wrapper = mountHome()
    await flushPromises()
    expect(wrapper.find('[data-testid="demo-banner"]').exists()).toBe(false)

    await wrapper.find('#apiCallType').setValue('restApi')
    await flushPromises()

    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="demo-banner"]').exists()).toBe(true)
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThanOrEqual(5)
    expect(wrapper.text()).not.toContain('NaN')
    expect(wrapper.text()).not.toContain('No products found')
  })

  it('logs a warning rather than throwing when the backend is unreachable', async () => {
    axios.post.mockRejectedValue(new Error('ECONNREFUSED'))
    const consoleWarn = silenceWarn()

    mountHome()
    await flushPromises()

    expect(consoleWarn).toHaveBeenCalledWith(
      'Backend unreachable, serving demo data:',
      expect.any(Error),
    )
  })

  it('hides the demo banner again once a later fetch succeeds', async () => {
    axios.post.mockRejectedValue(new Error('ECONNREFUSED'))
    silenceWarn()

    const wrapper = mountHome()
    await flushPromises()
    expect(wrapper.find('[data-testid="demo-banner"]').exists()).toBe(true)

    // Backend reachable over REST — leaving demo mode retires the banner.
    await wrapper.find('#apiCallType').setValue('restApi')
    await flushPromises()

    expect(wrapper.find('[data-testid="demo-banner"]').exists()).toBe(false)
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('Initech')
  })

  it('keeps the banner dismissed for the rest of the session once closed, even when demo mode is re-entered (dismissal is sticky by design)', async () => {
    axios.post.mockRejectedValue(new Error('ECONNREFUSED'))
    silenceWarn()

    const wrapper = mountHome()
    await flushPromises()

    await wrapper.find('[data-testid="demo-banner-dismiss"]').trigger('click')
    expect(wrapper.find('[data-testid="demo-banner"]').exists()).toBe(false)

    // A successful REST fetch leaves demo mode...
    await wrapper.find('#apiCallType').setValue('restApi')
    await flushPromises()
    expect(wrapper.find('[data-testid="demo-banner"]').exists()).toBe(false)

    // ...and switching back to the still-dead GraphQL endpoint re-enters it.
    await wrapper.find('#apiCallType').setValue('graphql')
    await flushPromises()

    // Demo data is served again, but the notice stays closed: re-opening it on
    // every failed refetch would nag a user who already acknowledged it.
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThanOrEqual(5)
    expect(wrapper.find('[data-testid="demo-banner"]').exists()).toBe(false)
  })
})

describe('HomeView — spreadsheet import', () => {
  function xlsxFile() {
    return new File(['fake-xlsx'], 'products.xlsx', { type: XLSX_MIME })
  }

  it('posts the spreadsheet to the import endpoint on upload', async () => {
    vi.stubGlobal('alert', vi.fn())
    vi.stubGlobal('location', { reload: vi.fn() })

    const wrapper = mountHome()
    await flushPromises()

    const file = xlsxFile()
    wrapper.findComponent(UploadProduct).vm.$emit('uploadProducts', { file })
    await flushPromises()

    const importCall = axios.post.mock.calls.find(
      ([url]) => url === `${BASE_URL}/api/products/import`,
    )
    expect(importCall).toBeDefined()
    const [, body, config] = importCall
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('file')).toBe(file)
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })
  })

  it('alerts and reloads the page after a successful import', async () => {
    const alertSpy = vi.fn()
    const reloadSpy = vi.fn()
    vi.stubGlobal('alert', alertSpy)
    vi.stubGlobal('location', { reload: reloadSpy })

    const wrapper = mountHome()
    await flushPromises()

    axios.post.mockResolvedValueOnce({ data: { message: 'imported' } })
    wrapper.findComponent(UploadProduct).vm.$emit('uploadProducts', { file: xlsxFile() })
    await flushPromises()

    expect(alertSpy).toHaveBeenCalledWith('Upload successful!')
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })

  it('alerts the failure and does not reload when the import is rejected', async () => {
    const alertSpy = vi.fn()
    const reloadSpy = vi.fn()
    vi.stubGlobal('alert', alertSpy)
    vi.stubGlobal('location', { reload: reloadSpy })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mountHome()
    await flushPromises()

    axios.post.mockRejectedValueOnce(new Error('backend offline'))
    wrapper.findComponent(UploadProduct).vm.$emit('uploadProducts', { file: xlsxFile() })
    await flushPromises()

    expect(alertSpy).toHaveBeenCalledWith('Upload failed.')
    expect(reloadSpy).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith('Upload failed:', expect.any(Error))
  })
})

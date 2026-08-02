import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import axios from 'axios'
import HomeView from '@/views/HomeView.vue'
import UploadProduct from '@/components/UploadProduct.vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const BASE_URL = 'http://127.0.0.1:8000'

const graphqlProducts = [
  { id: 1, type: 'Phone', brand: 'Acme', model: 'X100', capacity: '128GB', quantity: 5 },
  { id: 2, type: 'Laptop', brand: 'Globex', model: 'Pro 15', capacity: '1TB', quantity: 2 },
]

const restProducts = [
  { id: 3, type: 'Tablet', brand: 'Initech', model: 'Slab 8', capacity: '64GB', quantity: 7 },
]

function graphqlResponse(products) {
  return {
    data: {
      data: {
        products: {
          paginatorInfo: { currentPage: 1, lastPage: 1, total: products.length, perPage: 10 },
          data: products,
        },
      },
    },
  }
}

function restResponse(products) {
  return {
    data: {
      data: {
        data: products,
        current_page: 1,
        last_page: 1,
        total: products.length,
        per_page: 10,
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

beforeEach(() => {
  axios.post.mockResolvedValue(graphqlResponse(graphqlProducts))
  axios.get.mockResolvedValue(restResponse(restProducts))
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('HomeView', () => {
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

  it('posts the spreadsheet to the import endpoint on upload', async () => {
    vi.stubGlobal('alert', vi.fn())

    const wrapper = mountHome()
    await flushPromises()

    const file = new File(['fake-xlsx'], 'products.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    // Make the import call fail so onSubmit takes the catch branch instead of
    // calling window.location.reload() (not implementable under jsdom).
    axios.post.mockRejectedValueOnce(new Error('backend offline'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    wrapper.findComponent(UploadProduct).vm.$emit('uploadProducts', { file })
    await flushPromises()

    const importCall = axios.post.mock.calls.find(([url]) =>
      url === `${BASE_URL}/api/products/import`,
    )
    expect(importCall).toBeDefined()
    const [, body, config] = importCall
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('file')).toBe(file)
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })

    consoleError.mockRestore()
  })
})

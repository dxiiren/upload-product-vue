import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ProductIndex from '@/components/product/ProductIndex.vue'

// Initial HomeView state before any fetch resolves: no `current_page` key.
// The old pagination math did `(undefined - 1) * per_page` and rendered
// "Showing 0 to NaN of 0 entries".
const initialProductsData = {
  data: [],
  last_page: 1,
  total: 0,
  per_page: 10,
}

// A partial final page: 13 total entries, page 2 of 2 holds the last 3.
const lastPageProducts = [
  { id: 11, type: 'Phone', brand: 'Samsung', model: 'Galaxy S24', capacity: '256GB', quantity: 12 },
  { id: 12, type: 'Laptop', brand: 'Lenovo', model: 'ThinkPad X1', capacity: '1TB', quantity: 5 },
  { id: 13, type: 'Tablet', brand: 'Apple', model: 'iPad Air', capacity: '128GB', quantity: 8 },
]

const partialLastPage = {
  data: lastPageProducts,
  current_page: 2,
  last_page: 2,
  total: 13,
  per_page: 10,
}

function mountIndex(productsData = initialProductsData, extraProps = {}) {
  return mount(ProductIndex, { props: { productsData, ...extraProps } })
}

// The search box is backed by useDebouncedRef(500). Run the timers out, then let
// Vue flush the watcher the debounced assignment triggers.
async function settleDebounce(ms = 500) {
  vi.advanceTimersByTime(ms)
  await nextTick()
}

function paginationButtons(wrapper) {
  const buttons = wrapper.findAll('button')
  return {
    prev: buttons.find((button) => button.text() === 'Previous'),
    next: buttons.find((button) => button.text() === 'Next'),
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ProductIndex — pagination summary', () => {
  it('guards the pagination summary when current_page is missing (no NaN)', () => {
    const wrapper = mountIndex(initialProductsData)

    expect(wrapper.text()).toContain('Showing 0 to 0 of 0 entries')
    expect(wrapper.text()).not.toContain('NaN')
  })

  it('guards every pagination field when the payload is completely empty', () => {
    const wrapper = mountIndex({})

    expect(wrapper.text()).toContain('Showing 0 to 0 of 0 entries')
    expect(wrapper.text()).not.toContain('NaN')
    expect(wrapper.text()).not.toContain('undefined')
    // The page indicator falls back to 1, never 0 or blank.
    expect(wrapper.find('span.border').text()).toBe('1')
  })

  it('computes showingFrom/showingTo from the page offset on a partial last page', () => {
    const wrapper = mountIndex(partialLastPage)

    expect(wrapper.text()).toContain('Showing 11 to 13 of 13 entries')
  })

  it('numbers rows continuously across pages using the page offset', () => {
    const wrapper = mountIndex(partialLastPage)

    const numbers = wrapper.findAll('tbody tr').map((row) => row.findAll('td')[0].text())
    expect(numbers).toEqual(['11', '12', '13'])
  })

  it('starts numbering at 1 on the first page', () => {
    const wrapper = mountIndex({ ...partialLastPage, current_page: 1, last_page: 2 })

    const firstCell = wrapper.findAll('tbody tr')[0].findAll('td')[0]
    expect(firstCell.text()).toBe('1')
    expect(wrapper.text()).toContain('Showing 1 to 3 of 13 entries')
  })
})

describe('ProductIndex — table body states', () => {
  it('renders an empty state when there are no products and loading is done', () => {
    const wrapper = mountIndex(initialProductsData, { loading: false })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(1)

    const cell = rows[0].find('td')
    expect(cell.attributes('colspan')).toBe('7')
    expect(cell.text()).toContain('No products found')
    expect(cell.text()).toContain('Upload an .xlsx file above or adjust your search.')

    expect(wrapper.findAll('[data-testid="skeleton-row"]')).toHaveLength(0)
  })

  it('renders skeleton rows instead of the empty state while loading', () => {
    const wrapper = mountIndex(initialProductsData, { loading: true })

    const skeletons = wrapper.findAll('[data-testid="skeleton-row"]')
    expect(skeletons).toHaveLength(5)
    // One placeholder cell per table column.
    expect(skeletons[0].findAll('td')).toHaveLength(7)

    expect(wrapper.text()).not.toContain('No products found')
    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
  })

  it('shows the skeleton over stale rows while a refetch is in flight', () => {
    const wrapper = mountIndex(partialLastPage, { loading: true })

    expect(wrapper.findAll('[data-testid="skeleton-row"]')).toHaveLength(5)
    expect(wrapper.text()).not.toContain('Galaxy S24')
  })

  it('renders one row per product with every column populated', () => {
    const wrapper = mountIndex(partialLastPage)

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[0].findAll('td').map((cell) => cell.text())).toEqual([
      '11',
      '11',
      'Phone',
      'Samsung',
      'Galaxy S24',
      '256GB',
      '12',
    ])
  })

  it('drops null and non-object rows instead of rendering blank cells', () => {
    const wrapper = mountIndex({
      data: [lastPageProducts[0], null, 'not-a-product', undefined, 42, lastPageProducts[1]],
      current_page: 1,
      last_page: 1,
      total: 6,
      per_page: 10,
    })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Samsung')
    expect(rows[1].text()).toContain('Lenovo')
    expect(wrapper.text()).not.toContain('not-a-product')
    // Only the two real rows count toward the summary.
    expect(wrapper.text()).toContain('Showing 1 to 2 of 6 entries')
  })

  it('falls back to the empty state when data is not an array', () => {
    const wrapper = mountIndex({ ...initialProductsData, data: null })

    expect(wrapper.text()).toContain('No products found')
  })
})

describe('ProductIndex — debounced search', () => {
  it('does not emit searchChanged before the 500 ms debounce elapses', async () => {
    const wrapper = mountIndex(partialLastPage)

    await wrapper.find('#search').setValue('samsung')
    await settleDebounce(499)

    expect(wrapper.emitted('searchChanged')).toBeUndefined()
  })

  it('emits searchChanged exactly once, 500 ms after typing stops', async () => {
    const wrapper = mountIndex(partialLastPage)

    await wrapper.find('#search').setValue('samsung')
    await settleDebounce()

    const emitted = wrapper.emitted('searchChanged')
    expect(emitted).toHaveLength(1)
    expect(emitted[0][0]).toEqual({ apiCallType: 'graphql', search: 'samsung' })
  })

  it('collapses a burst of keystrokes into a single searchChanged with the final term', async () => {
    const wrapper = mountIndex(partialLastPage)
    const input = wrapper.find('#search')

    await input.setValue('s')
    vi.advanceTimersByTime(200)
    await input.setValue('sam')
    vi.advanceTimersByTime(200)
    await input.setValue('samsung')
    await settleDebounce()

    const emitted = wrapper.emitted('searchChanged')
    expect(emitted).toHaveLength(1)
    expect(emitted[0][0].search).toBe('samsung')
  })

  it('emits an empty search when the box is cleared', async () => {
    const wrapper = mountIndex(partialLastPage)
    const input = wrapper.find('#search')

    await input.setValue('samsung')
    await settleDebounce()
    await input.setValue('')
    await settleDebounce()

    const emitted = wrapper.emitted('searchChanged')
    expect(emitted).toHaveLength(2)
    expect(emitted[1][0]).toEqual({ apiCallType: 'graphql', search: '' })
  })

  it('filters the rendered rows client-side while the server round-trips', async () => {
    const wrapper = mountIndex(partialLastPage)

    await wrapper.find('#search').setValue('lenovo')
    await settleDebounce()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('ThinkPad X1')
  })
})

describe('ProductIndex — API type switch', () => {
  it('emits apiCallTypeChanged with the selected type', async () => {
    const wrapper = mountIndex(partialLastPage)

    await wrapper.find('#apiCallType').setValue('restApi')
    await nextTick()

    const emitted = wrapper.emitted('apiCallTypeChanged')
    expect(emitted).toHaveLength(1)
    expect(emitted[0][0]).toEqual({ apiCallType: 'restApi', search: '' })
  })

  it('clears the active search term before emitting apiCallTypeChanged', async () => {
    const wrapper = mountIndex(partialLastPage)

    await wrapper.find('#search').setValue('samsung')
    await settleDebounce()

    await wrapper.find('#apiCallType').setValue('restApi')
    await nextTick()

    const emitted = wrapper.emitted('apiCallTypeChanged')
    expect(emitted).toHaveLength(1)
    // The parent must refetch the unfiltered list — not re-run the stale term
    // against the newly selected transport.
    expect(emitted[0][0]).toEqual({ apiCallType: 'restApi', search: '' })
  })

  it('does not fire a second searchChanged when the debounced clear lands', async () => {
    const wrapper = mountIndex(partialLastPage)

    await wrapper.find('#search').setValue('samsung')
    await settleDebounce()
    expect(wrapper.emitted('searchChanged')).toHaveLength(1)

    await wrapper.find('#apiCallType').setValue('restApi')
    await settleDebounce()

    // apiCallTypeChanged already told the parent the search is empty; a trailing
    // searchChanged here would refetch the exact same list a second time.
    expect(wrapper.emitted('searchChanged')).toHaveLength(1)
    expect(wrapper.find('#search').element.value).toBe('')
  })

  it('still emits searchChanged for a term typed right after an API type switch', async () => {
    const wrapper = mountIndex(partialLastPage)

    await wrapper.find('#search').setValue('samsung')
    await settleDebounce()

    await wrapper.find('#apiCallType').setValue('restApi')
    await wrapper.find('#search').setValue('lenovo')
    await settleDebounce()

    const emitted = wrapper.emitted('searchChanged')
    expect(emitted).toHaveLength(2)
    expect(emitted[1][0]).toEqual({ apiCallType: 'restApi', search: 'lenovo' })
  })
})

describe('ProductIndex — pagination controls', () => {
  const middlePage = {
    data: lastPageProducts,
    current_page: 2,
    last_page: 3,
    total: 25,
    per_page: 10,
  }

  it('disables Previous on the first page', () => {
    const wrapper = mountIndex({ ...middlePage, current_page: 1 })

    const { prev, next } = paginationButtons(wrapper)
    expect(prev.element.disabled).toBe(true)
    expect(next.element.disabled).toBe(false)
  })

  it('disables Next on the last page', () => {
    const wrapper = mountIndex({ ...middlePage, current_page: 3 })

    const { prev, next } = paginationButtons(wrapper)
    expect(next.element.disabled).toBe(true)
    expect(prev.element.disabled).toBe(false)
  })

  it('disables both controls when there is only one page', () => {
    const wrapper = mountIndex({ ...middlePage, current_page: 1, last_page: 1 })

    const { prev, next } = paginationButtons(wrapper)
    expect(prev.element.disabled).toBe(true)
    expect(next.element.disabled).toBe(true)
  })

  it('enables both controls in the middle of the range', () => {
    const wrapper = mountIndex(middlePage)

    const { prev, next } = paginationButtons(wrapper)
    expect(prev.element.disabled).toBe(false)
    expect(next.element.disabled).toBe(false)
  })

  it('emits nextPage with the current API type and search term', async () => {
    const wrapper = mountIndex(middlePage)

    await wrapper.find('#search').setValue('samsung')
    await settleDebounce()

    await paginationButtons(wrapper).next.trigger('click')

    expect(wrapper.emitted('nextPage')[0][0]).toEqual({
      apiCallType: 'graphql',
      search: 'samsung',
    })
  })

  it('emits prevPage with the current API type and search term', async () => {
    const wrapper = mountIndex(middlePage)

    await wrapper.find('#apiCallType').setValue('restApi')
    await nextTick()

    await paginationButtons(wrapper).prev.trigger('click')

    expect(wrapper.emitted('prevPage')[0][0]).toEqual({
      apiCallType: 'restApi',
      search: '',
    })
  })

  it('renders the current page number in the indicator', () => {
    const wrapper = mountIndex(middlePage)

    expect(wrapper.find('span.border').text()).toBe('2')
  })
})

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
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

describe('ProductIndex', () => {
  it('guards the pagination summary when current_page is missing (no NaN)', () => {
    const wrapper = mount(ProductIndex, {
      props: { productsData: initialProductsData },
    })

    expect(wrapper.text()).toContain('Showing 0 to 0 of 0 entries')
    expect(wrapper.text()).not.toContain('NaN')
  })

  it('renders an empty state when there are no products and loading is done', () => {
    const wrapper = mount(ProductIndex, {
      props: { productsData: initialProductsData, loading: false },
    })

    expect(wrapper.text()).toContain('No products found')
  })

  it('renders skeleton rows instead of the empty state while loading', () => {
    const wrapper = mount(ProductIndex, {
      props: { productsData: initialProductsData, loading: true },
    })

    expect(wrapper.findAll('[data-testid="skeleton-row"]').length).toBeGreaterThan(0)
    expect(wrapper.text()).not.toContain('No products found')
  })
})

import { describe, it, expect } from 'vitest'
import { demoProducts, fetchFromDemo } from '@/data/demoProducts'

// fetchFromDemo is the fallback HomeView.getProducts() swaps in when the backend
// is unreachable. Its return value is fed straight into ProductIndex, so it has
// to match the shape the REST/GraphQL adapters produce key-for-key — otherwise
// the pagination math renders "Showing 0 to NaN of 0 entries".
const ADAPTER_KEYS = ['current_page', 'data', 'last_page', 'per_page', 'total']

describe('demoProducts catalogue', () => {
  it('ships a non-empty catalogue where every row has the columns the table renders', () => {
    expect(demoProducts.length).toBeGreaterThan(0)

    for (const product of demoProducts) {
      expect(Object.keys(product).sort()).toEqual(
        ['brand', 'capacity', 'id', 'model', 'quantity', 'type'].sort(),
      )
    }
  })
})

describe('fetchFromDemo — response contract', () => {
  it('returns exactly the keys the REST and GraphQL adapters return', () => {
    expect(Object.keys(fetchFromDemo()).sort()).toEqual(ADAPTER_KEYS)
  })

  it('keeps the adapter shape even when nothing matches', () => {
    expect(Object.keys(fetchFromDemo('no-such-product')).sort()).toEqual(ADAPTER_KEYS)
  })

  it('returns pagination numbers as numbers, never undefined or NaN', () => {
    const result = fetchFromDemo()

    for (const key of ['current_page', 'last_page', 'total', 'per_page']) {
      expect(typeof result[key]).toBe('number')
      expect(Number.isNaN(result[key])).toBe(false)
    }
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('reports total as the match count, not the size of the current page', () => {
    const result = fetchFromDemo()

    expect(result.total).toBe(demoProducts.length)
    expect(result.per_page).toBe(10)
  })
})

describe('fetchFromDemo — search', () => {
  it('returns the whole catalogue when the search term is empty', () => {
    expect(fetchFromDemo().data).toHaveLength(demoProducts.length)
    expect(fetchFromDemo('').data).toHaveLength(demoProducts.length)
  })

  it('matches on brand case-insensitively', () => {
    const lower = fetchFromDemo('samsung')
    const upper = fetchFromDemo('SAMSUNG')
    const mixed = fetchFromDemo('SaMsUnG')

    expect(lower.total).toBe(2)
    expect(upper.data).toEqual(lower.data)
    expect(mixed.data).toEqual(lower.data)
    expect(lower.data.every((p) => p.brand === 'Samsung')).toBe(true)
  })

  it('matches on type', () => {
    const result = fetchFromDemo('tablet')

    expect(result.total).toBe(1)
    expect(result.data[0].type).toBe('Tablet')
  })

  it('matches on model', () => {
    const result = fetchFromDemo('ipad')

    expect(result.total).toBe(1)
    expect(result.data[0].model).toBe('iPad Air')
  })

  it('matches on capacity', () => {
    const result = fetchFromDemo('ax5400')

    expect(result.total).toBe(1)
    expect(result.data[0].brand).toBe('TP-Link')
  })

  it('matches numeric fields by stringifying them', () => {
    const result = fetchFromDemo('15')

    expect(result.total).toBe(1)
    expect(result.data[0].quantity).toBe(15)
  })

  it('returns an empty page — not an error — when nothing matches', () => {
    const result = fetchFromDemo('definitely-not-in-the-catalogue')

    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
  })

  it('treats null and undefined search terms as no search', () => {
    expect(fetchFromDemo(null).total).toBe(demoProducts.length)
    expect(fetchFromDemo(undefined).total).toBe(demoProducts.length)
  })
})

describe('fetchFromDemo — pagination', () => {
  it('clamps a page beyond the end back to the last page', () => {
    const result = fetchFromDemo('', 99)

    expect(result.current_page).toBe(result.last_page)
    expect(result.current_page).toBe(1)
  })

  it('clamps page 0 and negative pages up to page 1', () => {
    expect(fetchFromDemo('', 0).current_page).toBe(1)
    expect(fetchFromDemo('', -5).current_page).toBe(1)
  })

  it('keeps last_page at 1 when there are zero matches', () => {
    const result = fetchFromDemo('definitely-not-in-the-catalogue')

    expect(result.last_page).toBe(1)
    expect(result.current_page).toBe(1)
  })

  it('never returns last_page below 1, so the page indicator is never 0', () => {
    for (const term of ['', 'samsung', 'nothing-matches-this']) {
      expect(fetchFromDemo(term).last_page).toBeGreaterThanOrEqual(1)
      expect(fetchFromDemo(term).current_page).toBeGreaterThanOrEqual(1)
    }
  })

  it('never returns more rows than per_page', () => {
    const result = fetchFromDemo()

    expect(result.data.length).toBeLessThanOrEqual(result.per_page)
  })
})

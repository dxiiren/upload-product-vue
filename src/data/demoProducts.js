// Demo catalogue served when the companion backend (laravel-inventory-api on
// http://127.0.0.1:8000) is unreachable. Keeps the table populated so the UI is
// browsable without the backend running.

export const demoProducts = [
  { id: 1, type: 'Phone', brand: 'Samsung', model: 'Galaxy S24', capacity: '256GB', quantity: 12 },
  { id: 2, type: 'Laptop', brand: 'Lenovo', model: 'ThinkPad X1 Carbon', capacity: '1TB', quantity: 5 },
  { id: 3, type: 'Tablet', brand: 'Apple', model: 'iPad Air', capacity: '128GB', quantity: 8 },
  { id: 4, type: 'Monitor', brand: 'Dell', model: 'UltraSharp U2723QE', capacity: '27"', quantity: 6 },
  { id: 5, type: 'Router', brand: 'TP-Link', model: 'Archer AX73', capacity: 'AX5400', quantity: 15 },
  { id: 6, type: 'SSD', brand: 'Samsung', model: '990 Pro', capacity: '2TB', quantity: 20 },
]

const PER_PAGE = 10

// Mock adapter mirroring the paginated shape returned by the REST/GraphQL fetchers.
export function fetchFromDemo(search = '', page = 1) {
  const term = String(search || '').toLowerCase()

  const matches = term
    ? demoProducts.filter((product) =>
        Object.values(product).some((val) => String(val).toLowerCase().includes(term)),
      )
    : demoProducts

  const lastPage = Math.max(1, Math.ceil(matches.length / PER_PAGE))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * PER_PAGE

  return {
    data: matches.slice(start, start + PER_PAGE),
    current_page: currentPage,
    last_page: lastPage,
    total: matches.length,
    per_page: PER_PAGE,
  }
}

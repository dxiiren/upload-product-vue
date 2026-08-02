<template>
    <!-- Header and Search -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- Title  -->
        <h2 class="text-lg font-semibold text-gray-800">Product Master List</h2>

        <!-- API Type Selector & Search -->
        <div class="flex items-center gap-4">

            <!-- API Type Selector -->
            <div class="flex flex-col">
                <label for="apiCallType" class="text-sm text-gray-600 mb-1">API Type</label>
                <select id="apiCallType" v-model="apiCallType"
                    class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                    <option value="restApi">REST API</option>
                    <option value="graphql">GraphQL</option>
                </select>
            </div>

            <!-- Search -->
            <div class="flex flex-col">
                <label for="search" class="text-sm text-gray-600 mb-1">Search Products</label>
                <input id="search" v-model="search" type="text" placeholder="Search..."
                    class="border border-gray-300 rounded px-3 py-1.5 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
        </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto border rounded">
        <table class="min-w-full text-sm text-left">
            <thead class="bg-blue-100 text-gray-700">
                <tr>
                    <th class="px-4 py-2">No.</th>
                    <th class="px-4 py-2">Product ID</th>
                    <th class="px-4 py-2">Types</th>
                    <th class="px-4 py-2">Brand</th>
                    <th class="px-4 py-2">Model</th>
                    <th class="px-4 py-2">Capacity</th>
                    <th class="px-4 py-2">Quantity</th>
                </tr>
            </thead>
            <tbody>
                <!-- Loading skeleton -->
                <template v-if="props.loading">
                    <tr v-for="n in 5" :key="`skeleton-${n}`" data-testid="skeleton-row" class="animate-pulse">
                        <td v-for="col in 7" :key="col" class="px-4 py-3">
                            <div class="h-3 rounded bg-gray-200"></div>
                        </td>
                    </tr>
                </template>

                <!-- Empty state -->
                <tr v-else-if="filteredData.length === 0">
                    <td colspan="7" class="px-4 py-12 text-center">
                        <p class="text-gray-700 font-medium">No products found</p>
                        <p class="text-gray-500 text-sm mt-1">
                            Upload an .xlsx file above or adjust your search.
                        </p>
                    </td>
                </tr>

                <!-- Rows -->
                <tr v-else v-for="(item, index) in filteredData" :key="item.id" class="hover:bg-gray-50">
                    <td class="px-4 py-2">{{ pageOffset + index + 1 }}</td>
                    <td class="px-4 py-2">{{ item.id }}</td>
                    <td class="px-4 py-2">{{ item.type }}</td>
                    <td class="px-4 py-2">{{ item.brand }}</td>
                    <td class="px-4 py-2">{{ item.model }}</td>
                    <td class="px-4 py-2">{{ item.capacity }}</td>
                    <td class="px-4 py-2">{{ item.quantity }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    <div class="flex justify-between items-center mt-3">
        <p class="text-sm">
            Showing {{ showingFrom }} to {{ showingTo }} of {{ totalEntries }} entries
        </p>
        <div class="flex items-center gap-2">
            <button @click="prevPage" :disabled="currentPage <= 1"
                class="text-blue-500 text-sm hover:underline disabled:text-gray-400">
                Previous
            </button>
            <span class="px-2 py-1 text-sm border rounded">{{ currentPage }}</span>
            <button @click="nextPage" :disabled="currentPage >= lastPage"
                class="text-blue-500 text-sm hover:underline disabled:text-gray-400">
                Next
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useDebouncedRef } from '@/composables/useDebouncedRef'

defineOptions({
    name: 'ProductIndex'
})
const emit = defineEmits(['apiCallTypeChanged', 'searchChanged', 'prevPage', 'nextPage'])
const props = defineProps({
    productsData: {
        type: Object,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    },
})

// ── Guarded pagination math ──────────────────────────────────────────────
// The initial productsData (before any fetch resolves) may lack current_page /
// per_page; coercing through Number(...) || fallback prevents the old
// "Showing 0 to NaN of 0 entries" bug.
const currentPage = computed(() => Number(props.productsData.current_page) || 1)
const perPage = computed(() => Number(props.productsData.per_page) || 0)
const lastPage = computed(() => Number(props.productsData.last_page) || 1)
const totalEntries = computed(() => Number(props.productsData.total) || 0)
const pageOffset = computed(() => (currentPage.value - 1) * perPage.value)
const showingFrom = computed(() => (filteredData.value.length ? pageOffset.value + 1 : 0))
const showingTo = computed(() => pageOffset.value + filteredData.value.length)

const search = useDebouncedRef('', 500)
const apiCallType = ref('graphql')

// `search` is debounced, so `search.value = ''` does not land until the delay
// elapses — reading it back straight after still yields the stale term. Track
// the pending reset so the API-type switch can report the cleared search up
// front and swallow the trailing searchChanged the delayed clear would fire
// (which refetched the identical list a second time).
let pendingApiSwitchClear = false

watch(search, (newValue) => {
    const searchValue = newValue.length > 0 ? newValue : ''
    const isApiSwitchClear = pendingApiSwitchClear && searchValue === ''
    pendingApiSwitchClear = false

    if (isApiSwitchClear) return

    emit('searchChanged', { apiCallType: apiCallType.value, search: searchValue })
})

watch(apiCallType, (newValue) => {
    pendingApiSwitchClear = search.value !== ''
    search.value = ''
    emit('apiCallTypeChanged', { apiCallType: newValue, search: '' })
})

const filteredData = computed(() => {
    const list = Array.isArray(props.productsData.data) ? props.productsData.data : []

    const safeList = list.filter(p => !!p && typeof p === 'object')

    if (!search.value) return safeList

    return safeList.filter(product =>
        Object.values(product).some(val =>
            String(val).toLowerCase().includes(search.value.toLowerCase())
        )
    )
})

function prevPage() {
    emit('prevPage', { apiCallType: apiCallType.value, search: search.value })
}

function nextPage() {
    emit('nextPage', { apiCallType: apiCallType.value, search: search.value })
}

</script>
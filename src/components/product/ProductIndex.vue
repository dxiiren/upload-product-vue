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
                <tr v-for="(item, index) in filteredData" :key="item.id" class="hover:bg-gray-50">
                    <td class="px-4 py-2">{{ ((props.productsData.current_page - 1) * props.productsData.per_page) +
                        index + 1 }}</td>
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
            Showing
            {{ props.productsData.data.length ? ((props.productsData.current_page - 1) * props.productsData.per_page +
                1) : 0 }}
            to
            {{ ((props.productsData.current_page - 1) * props.productsData.per_page) + filteredData.length }}
            of {{ props.productsData.total }} entries
        </p>
        <div class="flex items-center gap-2">
            <button @click="prevPage" :disabled="props.productsData.current_page <= 1"
                class="text-blue-500 text-sm hover:underline disabled:text-gray-400">
                Previous
            </button>
            <span class="px-2 py-1 text-sm border rounded">{{ props.productsData.current_page }}</span>
            <button @click="nextPage" :disabled="props.productsData.current_page >= props.productsData.last_page"
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
})

const search = useDebouncedRef('', 500)
const apiCallType = ref('graphql')

watch(search, (newValue) => {
    const searchValue = newValue.length > 0 ? newValue : ''
    emit('searchChanged', { apiCallType: apiCallType.value, search: searchValue })
})

watch(apiCallType, (newValue) => {
    search.value = ''
    emit('apiCallTypeChanged', { apiCallType: newValue, search: search.value })
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
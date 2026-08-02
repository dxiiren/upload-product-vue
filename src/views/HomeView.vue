<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center py-12">
        <div class="w-full max-w-6xl space-y-6">

            <!-- ⬆ Upload Card -->
            <upload-product @uploadProducts="onSubmit" />

            <!-- 🔔 Demo-data notice (backend unreachable) -->
            <div v-if="demoMode && !demoBannerDismissed" data-testid="demo-banner"
                class="flex items-start justify-between gap-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-2xl shadow-sm px-6 py-4">
                <p class="text-sm leading-relaxed">
                    <span class="font-semibold">Demo data</span> — start
                    <a href="https://github.com/dxiiren/laravel-inventory-api" target="_blank" rel="noopener"
                        class="font-medium underline decoration-amber-400 underline-offset-2 hover:text-amber-900">
                        laravel-inventory-api
                    </a>
                    on <code class="text-xs bg-amber-100 rounded px-1 py-0.5">http://127.0.0.1:8000</code>
                    for live data.
                </p>
                <button type="button" data-testid="demo-banner-dismiss" aria-label="Dismiss demo data notice"
                    @click="demoBannerDismissed = true"
                    class="text-amber-500 hover:text-amber-700 text-lg leading-none cursor-pointer shrink-0">
                    ✕
                </button>
            </div>

            <!-- 📦 Product Table Card -->
            <div class="bg-white rounded-2xl shadow-md p-6">
                <product-index :productsData="productsData" :loading="loading"
                    @apiCallTypeChanged="apiCallTypeChanged"
                    @searchChanged="searchChanged"
                    @prevPage="prevPage" @nextPage="nextPage"
                />
            </div>

        </div>
    </div>
</template>

<script setup>
import ProductIndex from '@/components/product/ProductIndex.vue'
import UploadProduct from '@/components/UploadProduct.vue'
import { fetchFromDemo } from '@/data/demoProducts'
import axios from 'axios'
import { ref, onMounted } from 'vue'

const baseURL = 'http://127.0.0.1:8000'

const productsData = ref({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
})

const currentPage = ref(1)
const loading = ref(true)
const demoMode = ref(false)
const demoBannerDismissed = ref(false)

onMounted(() => {
    getProducts()
})

function apiCallTypeChanged(data) {
    currentPage.value = 1
    getProducts(data.search, data.apiCallType)
}

function searchChanged(data) {
    currentPage.value = 1
    getProducts(data.search, data.apiCallType)
}

function prevPage(data) {
    if (currentPage.value > 1) {
        currentPage.value--
        getProducts(data.search, data.apiCallType)
    }
}

function nextPage(data) {
    if (currentPage.value < productsData.value.last_page) {
        currentPage.value++
        getProducts(data.search, data.apiCallType)
    }
}

async function onSubmit(values) {

    const formData = new FormData()
    formData.append("file", values.file)

    try {
        await axios.post(`${baseURL}/api/products/import`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })

        alert("Upload successful!")
        window.location.reload()
        
    } catch (err) {
        console.error("Upload failed:", err)
        alert("Upload failed.")
    }
}

async function getProducts(search = '', apiCallType = 'graphql') {

    loading.value = true

    try {

        const responseData = apiCallType === 'graphql'
            ? await fetchFromGraphQL(search, currentPage.value)
            : await fetchFromRestAPI(search, currentPage.value)

        productsData.value = responseData
        currentPage.value = responseData.current_page
        demoMode.value = false

    } catch (error) {
        // Backend unreachable — fall back to the static demo catalogue so the
        // table stays browsable. The banner tells the user how to go live.
        console.warn('Backend unreachable, serving demo data:', error)
        demoMode.value = true
        const demoData = fetchFromDemo(search, currentPage.value)
        productsData.value = demoData
        currentPage.value = demoData.current_page
    } finally {
        loading.value = false
    }
}

async function fetchFromGraphQL(search = '', page = 1) {
    const graphqlQuery = {
        query: `
            query SearchProducts($filter: ProductFilterInput, $page: Int) {
                products(filter: $filter, page: $page) {
                paginatorInfo {
                    currentPage
                    lastPage
                    total
                    perPage
                }
                data {
                    id
                    type
                    brand
                    model
                    capacity
                    quantity
                }
            }
        }
        `,
        variables: {
            filter: { search: search || '' },
            page
        }
    }

    const response = await axios.post(`${baseURL}/api/graphql`, graphqlQuery)
    const result = response.data.data.products

    return {
        data: result.data,
        current_page: result.paginatorInfo.currentPage,
        last_page: result.paginatorInfo.lastPage,
        total: result.paginatorInfo.total,
        per_page: result.paginatorInfo.perPage
    }
}

async function fetchFromRestAPI(search = '', page = 1) {
    let queryParams = `?page=${page}`
    if (search) {
        queryParams += `&search=${search}`
    }
    const response = await axios.get(`${baseURL}/api/products${queryParams}`)
    const result = response.data
    return {
        data: result.data.data,
        current_page: result.data.current_page,
        last_page: result.data.last_page,
        total: result.data.total,
        per_page: result.data.per_page
    }
}
</script>
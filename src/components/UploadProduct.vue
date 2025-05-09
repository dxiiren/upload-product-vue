<template>
<div class="bg-white rounded-2xl shadow-md p-6">
    <VeeForm @submit="onSubmit">
        <div class="flex items-start gap-4">
            <div class="flex-1">
                <div class="flex gap-5 items-baseline">
                    <div class="flex-1">
                        <VeeField name="file" :as="'input'" type="file" accept=".xlsx"
                            rules="required|excluded:application/pdf,text/plain,image/jpeg" class="block w-full text-sm cursor-pointer text-gray-600
                            file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:cursor-pointer file:text-black-700
                            file:bg-gray-200 hover:file:bg-gray-300
                            border border-gray-500 rounded-md shadow-sm" />
                    </div>

                    <div class="">
                        <button type="submit"
                            class="bg-green-500 text-white px-10 py-2 rounded hover:bg-green-600 cursor-pointer transition">
                            ⬆ Upload
                        </button>
                    </div>

                </div>

                <div class="h-5 mt-2">
                    <ErrorMessage name="file" class="text-red-500 text-sm" />
                </div>
            </div>
        </div>
    </VeeForm>
</div>
</template>

<script setup>

const emit = defineEmits(['uploadProducts'])

defineOptions({
    name: 'UploadProduct'
})

async function onSubmit(values) {
    emit('uploadProducts', values)
}
</script>
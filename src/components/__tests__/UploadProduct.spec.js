import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import UploadProduct from '@/components/UploadProduct.vue'
import VeeValidationPlugin from '@/includes/validation'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// UploadProduct renders VeeForm / VeeField / ErrorMessage, which are registered
// globally by the validation plugin in main.js — install it here too rather than
// stubbing, so the `required|excluded:...` rules actually run.
function mountUpload() {
  return mount(UploadProduct, {
    global: { plugins: [VeeValidationPlugin] },
  })
}

// jsdom's FileList is read-only, so hand the input a plain array of File objects.
// vee-validate reads `input.files` and unwraps the first entry as the field value.
function attachFile(wrapper, file) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  return input
}

function makeFile(name, type) {
  return new File(['binary-content'], name, { type })
}

describe('UploadProduct — markup', () => {
  it('renders a file input that only advertises .xlsx', () => {
    const wrapper = mountUpload()

    const input = wrapper.find('input[type="file"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('accept')).toBe('.xlsx')
    expect(input.attributes('name')).toBe('file')
  })

  it('renders no validation error before the user picks anything', () => {
    const wrapper = mountUpload()

    expect(wrapper.text()).not.toContain('not allowed')
    expect(wrapper.text()).not.toContain('is required')
  })
})

describe('UploadProduct — MIME validation', () => {
  it('rejects a PDF via the excluded rule and renders the ErrorMessage', async () => {
    const wrapper = mountUpload()

    const input = attachFile(wrapper, makeFile('report.pdf', 'application/pdf'))
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.text()).toContain('You are not allowed to use this value for the field file.')
  })

  it('rejects the other blocklisted MIME types too', async () => {
    for (const [name, type] of [
      ['notes.txt', 'text/plain'],
      ['photo.jpg', 'image/jpeg'],
    ]) {
      const wrapper = mountUpload()
      const input = attachFile(wrapper, makeFile(name, type))
      await input.trigger('change')
      await flushPromises()

      expect(wrapper.text()).toContain('You are not allowed to use this value for the field file.')
    }
  })

  it('does not emit uploadProducts when a blocklisted file is submitted', async () => {
    const wrapper = mountUpload()

    const input = attachFile(wrapper, makeFile('report.pdf', 'application/pdf'))
    await input.trigger('change')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('uploadProducts')).toBeUndefined()
  })

  it('accepts an .xlsx file without an error message', async () => {
    const wrapper = mountUpload()

    const input = attachFile(wrapper, makeFile('products.xlsx', XLSX_MIME))
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.text()).not.toContain('You are not allowed to use this value')
  })
})

describe('UploadProduct — submission', () => {
  it('emits uploadProducts with the chosen .xlsx file', async () => {
    const wrapper = mountUpload()
    const file = makeFile('products.xlsx', XLSX_MIME)

    const input = attachFile(wrapper, file)
    await input.trigger('change')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const emitted = wrapper.emitted('uploadProducts')
    expect(emitted).toHaveLength(1)
    expect(emitted[0][0].file).toBe(file)
  })

  it('blocks submission with the required rule when no file is chosen', async () => {
    const wrapper = mountUpload()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('uploadProducts')).toBeUndefined()
    expect(wrapper.text()).toContain('The field file is required.')
  })
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/demo.ts', 'src/Demo.vue'],
      insertTypesEntry: true,
    })
  ],  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LayerVue',
      fileName: (format) => `layer-vue.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})

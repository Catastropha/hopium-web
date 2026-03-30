import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2022',
    modulePreload: { polyfill: false },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
  },
})

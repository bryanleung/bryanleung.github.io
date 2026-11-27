import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: 'esbuild',
    lib: { entry: resolve(__dirname, 'entry.tsx'), formats: ['iife'], name: 'CoursePacingScene', fileName: () => 'course-pacing-scene.js', cssFileName: 'course-pacing-scene' },
  },
})

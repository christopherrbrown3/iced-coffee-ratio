import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/iced-coffee-ratio/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['graphics/ice-mascot-pointing.png', 'graphics/ice-mascot-coffee.png'],
      manifest: {
        name: 'Iced Coffee Calculator',
        short_name: 'Iced Coffee',
        description: 'Ice-aware coffee ratios and guided timers for immersion, flash brew, and AeroPress.',
        theme_color: '#b91f24',
        background_color: '#f5fbfa',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/pwa-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
        navigateFallback: 'index.html'
      }
    })
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})

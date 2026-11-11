import { defineConfig } from '@vite-pwa/assets-generator/config';

/** The night-glass tile colour of the icon. The icons are full-bleed and opaque. */
const BACKGROUND = '#0b0e15';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: { sizes: [64, 192, 512], favicons: [[48, 'favicon.ico']], padding: 0 },
    maskable: { sizes: [512], padding: 0, resizeOptions: { background: BACKGROUND } },
    apple: { sizes: [180], padding: 0, resizeOptions: { background: BACKGROUND } },
  },
  images: ['public/icon.svg'],
});

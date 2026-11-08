import { defineConfig } from 'vite';

const proxy = { '/api': 'http://127.0.0.1:8000' };

export default defineConfig({
  server: { proxy, strictPort: true },
  preview: { proxy, strictPort: true },
});

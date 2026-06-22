import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages 배포 시 './' 또는 '/repo-name/' 으로 변경
base: '/Marineblast/',
  build: {
    target: 'es2020',
    minify: 'esbuild',
  },
});

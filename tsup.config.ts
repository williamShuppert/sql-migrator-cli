import { defineConfig } from 'tsup'

export default defineConfig({
    format: ['cjs', 'esm'],
    entry: ['src/index.ts'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
})
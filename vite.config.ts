// `defineConfig` se importa de vitest/config (no de vite) para que el campo
// `test` este tipado; vitest reexporta la configuracion de vite.
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const SHADER_RE = /\.(glsl|frag|vert)$/

/**
 * Plugin GLSL minimo: importa .glsl/.frag/.vert como string y resuelve
 * `#include "otro.glsl"` recursivamente (relativo al archivo que incluye).
 *
 * Se implementa a mano en vez de usar vite-plugin-glsl para que el mismo
 * pipeline funcione identico bajo vitest, y para poder emitir dependencias
 * con addWatchFile y tener HMR sobre los includes.
 */
function glslInclude(): Plugin {
  const expand = (file: string, seen: string[], deps: Set<string>): string => {
    if (seen.includes(file)) {
      throw new Error(`#include circular en GLSL: ${[...seen, file].join(' -> ')}`)
    }
    deps.add(file)
    const src = readFileSync(file, 'utf8')
    return src.replace(
      /^[ \t]*#include[ \t]+["<]([^">]+)[">][ \t]*$/gm,
      (_match: string, rel: string) => {
        const target = resolve(dirname(file), rel)
        if (!existsSync(target)) {
          throw new Error(`#include no encontrado: "${rel}" desde ${file}`)
        }
        // Marca de origen para que los errores del compilador GLSL sean rastreables.
        return `// ---- begin ${rel} ----\n${expand(target, [...seen, file], deps)}\n// ---- end ${rel} ----`
      },
    )
  }

  return {
    name: 'glsl-include',
    transform(_code, id) {
      const [path] = id.split('?')
      if (!SHADER_RE.test(path)) return null
      const deps = new Set<string>()
      const expanded = expand(path, [], deps)
      for (const d of deps) if (d !== path) this.addWatchFile(d)
      return {
        code: `export default ${JSON.stringify(expanded)};`,
        map: null,
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [glslInclude()],
  server: { port: 5173, open: false },
  build: { target: 'es2022', assetsInlineLimit: 0 },
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
  },
})

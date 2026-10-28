/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

/** La vidéo de la caméra ne doit jamais être visible : seul le tracé de la main s'affiche. */
describe("l'image de la caméra reste cachée", () => {
  it('la feuille de style rend la vidéo invisible', () => {
    const css = read('./index.css')
    const rule = css.match(/\.hidden-video\s*\{([^}]*)\}/)
    expect(rule, 'la règle .hidden-video a disparu de index.css').not.toBeNull()
    expect(rule![1]).toMatch(/opacity:\s*0/)
    expect(rule![1]).toMatch(/width:\s*1px/)
    expect(rule![1]).toMatch(/height:\s*1px/)
  })

  it("l'élément vidéo est caché même sans feuille de style", () => {
    const source = read('./components/LessonRunner.tsx')
    const video = source.match(/<video[\s\S]*?\/>/)
    expect(video, "l'élément <video> est introuvable").not.toBeNull()
    expect(video![0]).toMatch(/hidden-video/)
    expect(video![0]).toMatch(/opacity:\s*0/)
  })

  it("aucune autre vidéo n'est affichée dans l'application", () => {
    for (const file of ['./App.tsx', './components/LessonRunner.tsx', './components/SignDiagram.tsx']) {
      const count = (read(file).match(/<video/g) ?? []).length
      expect(count, file).toBeLessThanOrEqual(1)
    }
  })
})

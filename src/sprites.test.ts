/// <reference types="node" />
import { existsSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ALPHABET, HAND_SPRITES } from './lib/signs'

const publicFile = (path: string) => new URL(`../public/${path}`, import.meta.url)

describe('images des lettres', () => {
  it('chaque lettre déclarée avec une main robot a son fichier', () => {
    for (const id of HAND_SPRITES) {
      expect(existsSync(publicFile(`hands/${id}.png`)), `hands/${id}.png est introuvable`).toBe(true)
    }
  })

  it("seules des lettres de l'alphabet sont déclarées", () => {
    const letters = new Set(ALPHABET.map((s) => s.id))
    for (const id of HAND_SPRITES) expect(letters.has(id), id).toBe(true)
  })

  it('les lettres sans main robot gardent leur photo', () => {
    for (const { id } of ALPHABET) {
      if (!HAND_SPRITES.has(id)) {
        expect(existsSync(publicFile(`signs/${id}.jpg`)), `la photo signs/${id}.jpg est introuvable`).toBe(true)
      }
    }
  })

  it('aucun fichier de main robot ne reste inutilisé', () => {
    const files = readdirSync(publicFile('hands/')).map((f) => f.replace(/\.png$/, ''))
    for (const id of files) expect(HAND_SPRITES.has(id), `hands/${id}.png n'est pas utilisé`).toBe(true)
  })
})

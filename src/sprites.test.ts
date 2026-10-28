/// <reference types="node" />
import { existsSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  ALPHABET,
  BIG_NUMBERS,
  DIGITS,
  EXTRA_SPRITES,
  HAND_SPRITES,
  NUMBERS,
  TENS,
  TWENTY,
  spriteForFingers,
} from './lib/signs'
import { GREETINGS, ME } from './lib/words'

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
    for (const id of files) {
      expect(HAND_SPRITES.has(id) || EXTRA_SPRITES.includes(id), `hands/${id}.png n'est pas utilisé`).toBe(true)
    }
  })

  it('les mains supplémentaires ont leur fichier', () => {
    for (const id of EXTRA_SPRITES) expect(existsSync(publicFile(`hands/${id}.png`)), id).toBe(true)
  })
})

describe('mains robot des chiffres, des nombres et des mots', () => {
  /** Toutes les formes de main dessinées dans une illustration ou un schéma. */
  const drawn = [...DIGITS, ...NUMBERS, ...TENS, ...BIG_NUMBERS, ...GREETINGS, ME].flatMap((s) => [
    ...(s.hands ?? []).map((h) => h.fingers),
    ...(s.diagram ? [s.diagram.hand] : []),
  ])

  it('chaque forme associée à une main robot pointe vers un fichier qui existe', () => {
    for (const fingers of drawn) {
      const file = spriteForFingers(fingers)
      if (file) expect(existsSync(publicFile(`hands/${file}.png`)), `${file} pour ${fingers}`).toBe(true)
    }
  })

  it('les signes avec une main robot dédiée ont leur fichier', () => {
    for (const sign of [...DIGITS, ...NUMBERS, ...TENS, ...BIG_NUMBERS, TWENTY]) {
      if (sign.sprite) expect(existsSync(publicFile(`hands/${sign.sprite}.png`)), sign.id).toBe(true)
    }
  })

  it('le 1, le 2, le 4 et le 5 utilisent une main robot', () => {
    const fingers = (id: string) => DIGITS.find((s) => s.id === id)!.fingers
    expect(spriteForFingers(fingers('1'))).toBe('a')
    expect(spriteForFingers(fingers('2'))).toBe('l')
    expect(spriteForFingers(fingers('4'))).toBe('b')
    expect(spriteForFingers(fingers('5'))).toBe('five')
  })
})

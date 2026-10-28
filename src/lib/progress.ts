const KEY = 'lsfree.done'

/** Identifiants des leçons terminées, gardés dans le navigateur. */
export function loadDone(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function markDone(id: string): string[] {
  const done = loadDone()
  if (done.includes(id)) return done
  const next = [...done, id]
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // stockage indisponible : la progression ne sera pas gardée
  }
  return next
}

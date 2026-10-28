const KEY = 'lsfree.stars'
/** Ancienne clé : liste des leçons terminées, avant l'arrivée des étoiles. */
const LEGACY_KEY = 'lsfree.done'

/** Étoiles gagnées (0 à 3) pour chaque leçon, gardées dans le navigateur. */
export type StarsMap = Record<string, number>

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '') as T
  } catch {
    return fallback
  }
}

export function loadStars(): StarsMap {
  const stars = read<StarsMap>(KEY, {})
  const legacy = read<string[]>(LEGACY_KEY, [])
  // Une leçon déjà terminée avant les étoiles vaut au moins une étoile.
  for (const id of Array.isArray(legacy) ? legacy : []) stars[id] = Math.max(stars[id] ?? 0, 1)
  return stars
}

/** Garde le meilleur résultat de la leçon. */
export function saveStars(id: string, stars: number): StarsMap {
  const all = loadStars()
  all[id] = Math.max(all[id] ?? 0, stars)
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // stockage indisponible : la progression ne sera pas gardée
  }
  return all
}

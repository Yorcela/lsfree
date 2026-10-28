const STAR_POINTS = '50,6 62,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 38,38'

/** Rangée d'étoiles de récompense : `count` étoiles dorées sur `total`. */
export function Stars({ count, total = 3, size = 24 }: { count: number; total?: number; size?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${count} étoile${count > 1 ? 's' : ''} sur ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} className={i < count ? 'star on' : 'star'} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
          <polygon points={STAR_POINTS} />
        </svg>
      ))}
    </span>
  )
}

/** Barre de progression rayée avec le pourcentage ; `value` va de 0 à 1. */
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="bar-fill" style={{ width: `${percent}%` }} />
      <span className="bar-label">{percent} %</span>
    </div>
  )
}

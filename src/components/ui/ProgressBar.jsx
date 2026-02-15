/**
 * ProgressBar — animated horizontal bar.
 * @param {number} value - 0 to 1 (fraction of completion)
 * @param {string} color - Tailwind bg class (default: bg-akka-green)
 */
export default function ProgressBar({
  value = 0,
  color = 'bg-akka-green',
  className = '',
}) {
  const percent = Math.min(Math.max(value, 0), 1) * 100

  return (
    <div className={`h-2 w-full rounded-full bg-gray-100 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

/**
 * Badge — small pill/tag for categories, statuses, etc.
 */
export default function Badge({
  children,
  variant = 'default',
  className = '',
}) {
  const variants = {
    default: 'bg-gray-100 text-akka-text-secondary',
    green: 'bg-emerald-50 text-akka-green',
    red: 'bg-red-50 text-akka-red',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

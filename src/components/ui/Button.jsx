/**
 * Button — reusable button with primary/secondary/outline variants.
 * All buttons have 44px min touch target for mobile.
 */
export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl min-h-[52px] px-6 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-akka-dark text-white hover:opacity-90',
    secondary: 'bg-akka-green text-white hover:opacity-90',
    outline:
      'bg-transparent border-2 border-akka-border text-akka-text hover:border-akka-dark',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Card — reusable card with subtle shadow/border.
 * Rounded 12-16px as per design spec.
 */
export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#D1D5DB] shadow-sm p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

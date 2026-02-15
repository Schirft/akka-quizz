import { useEffect, useState } from 'react'

const COLORS = ['#2ECC71', '#FFD700', '#E74C3C', '#3498DB', '#9B59B6', '#FF6B35']
const PARTICLE_COUNT = 60

/**
 * Confetti — full-screen confetti animation for celebrations.
 * Renders colorful falling particles with rotation.
 * Auto-removes itself after animation completes (~4s).
 */
export default function Confetti() {
  const [particles, setParticles] = useState([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Generate particles
    const items = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // % from left
      delay: Math.random() * 0.8, // stagger delay
      duration: 2 + Math.random() * 2, // fall duration
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 720,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      drift: (Math.random() - 0.5) * 30, // horizontal drift in vw
    }))
    setParticles(items)

    // Auto-hide after all animations complete
    const timer = setTimeout(() => setVisible(false), 4500)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}vw`,
          }}
        >
          <div
            className="animate-confetti-spin"
            style={{
              animationDuration: `${0.5 + Math.random()}s`,
            }}
          >
            {p.shape === 'rect' ? (
              <div
                style={{
                  width: `${p.size}px`,
                  height: `${p.size * 0.6}px`,
                  backgroundColor: p.color,
                  borderRadius: '2px',
                }}
              />
            ) : (
              <div
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  borderRadius: '50%',
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

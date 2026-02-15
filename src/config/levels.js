/**
 * 10 investor-themed levels with XP thresholds.
 * Each level unlocks a benefit shown in the Level Up modal.
 */
export const LEVELS = [
  { level: 1, name: 'Initiate', xpRequired: 0, benefit: 'Welcome to Akka Quiz!' },
  { level: 2, name: 'Learner', xpRequired: 500, benefit: 'Unlock streak freezes' },
  { level: 3, name: 'Investor', xpRequired: 2000, benefit: 'Unlock speed bonus' },
  { level: 4, name: 'Analyst', xpRequired: 5000, benefit: 'Unlock detailed stats' },
  { level: 5, name: 'Angel', xpRequired: 12000, benefit: 'Unlock leaderboard' },
  { level: 6, name: 'Strategist', xpRequired: 25000, benefit: 'Unlock custom avatar' },
  { level: 7, name: 'Expert', xpRequired: 50000, benefit: 'Unlock expert badge' },
  { level: 8, name: 'Visionary', xpRequired: 100000, benefit: 'Unlock priority access' },
  { level: 9, name: 'Legend', xpRequired: 200000, benefit: 'Unlock legend frame' },
  { level: 10, name: 'Whale', xpRequired: 500000, benefit: 'Unlock all features' },
]

/**
 * Returns the level object for a given XP amount.
 */
export function getLevelForXP(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) return LEVELS[i]
  }
  return LEVELS[0]
}

/**
 * Returns progress towards the next level as a 0-1 fraction.
 */
export function getLevelProgress(xp) {
  const current = getLevelForXP(xp)
  if (current.level === 10) return 1
  const next = LEVELS[current.level] // next index (level N is at index N-1, so next is at index level)
  const progressXP = xp - current.xpRequired
  const neededXP = next.xpRequired - current.xpRequired
  return Math.min(progressXP / neededXP, 1)
}

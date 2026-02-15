/**
 * 15 badges across 3 tiers: Common, Uncommon, Rare.
 * Each badge has a unique id, display info, and unlock condition description.
 */
export const BADGES = [
  // Common (5)
  { id: 'first_steps', name: 'First Steps', tier: 'common', icon: '👣', description: 'Complete your first quiz' },
  { id: 'week_one', name: 'Week One', tier: 'common', icon: '📅', description: '7-day streak' },
  { id: 'quiz_starter', name: 'Quiz Starter', tier: 'common', icon: '🎯', description: 'Complete 5 quizzes' },
  { id: 'curious_mind', name: 'Curious Mind', tier: 'common', icon: '🧠', description: 'Answer in all 5 categories' },
  { id: 'early_bird', name: 'Early Bird', tier: 'common', icon: '🌅', description: 'Quiz before 9 AM' },

  // Uncommon (6)
  { id: 'rising_flame', name: 'Rising Flame', tier: 'uncommon', icon: '🔥', description: '14-day streak' },
  { id: 'consistent_investor', name: 'Consistent Investor', tier: 'uncommon', icon: '📈', description: '30-day streak' },
  { id: 'dedicated', name: 'Dedicated', tier: 'uncommon', icon: '💪', description: 'Complete 50 quizzes' },
  { id: 'speed_racer', name: 'Speed Racer', tier: 'uncommon', icon: '⚡', description: '5 speed bonuses in one quiz' },
  { id: 'accuracy_master', name: 'Accuracy Master', tier: 'uncommon', icon: '🎯', description: '80%+ accuracy over 20 quizzes' },
  { id: 'night_owl', name: 'Night Owl', tier: 'uncommon', icon: '🦉', description: 'Quiz after 11 PM' },

  // Rare (4)
  { id: 'streak_legend', name: 'Streak Legend', tier: 'rare', icon: '🏆', description: '50-day streak' },
  { id: 'centurion', name: 'Centurion', tier: 'rare', icon: '💯', description: 'Complete 100 quizzes' },
  { id: 'market_expert', name: 'Market Expert', tier: 'rare', icon: '🧙', description: 'Score 5/5 ten times' },
  { id: 'contrarian', name: 'Contrarian', tier: 'rare', icon: '🔮', description: 'Correct when 70%+ got it wrong' },
]

/** Tier display colors */
export const TIER_COLORS = {
  common: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  uncommon: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  rare: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
}

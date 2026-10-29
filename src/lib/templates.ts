export interface Template {
  name: string
  emoji: string
  goal?: number
  unit?: string
}

export const TEMPLATE_GROUPS: { category: string; items: Template[] }[] = [
  { category: 'Fitness', items: [
    { name: 'Fitnessstudio', emoji: '🏋️' },
    { name: 'Laufen', emoji: '🏃' },
    { name: 'Spazieren gehen', emoji: '🚶' },
    { name: 'Dehnen', emoji: '🤸' },
  ] },
  { category: 'Gesundheit', items: [
    { name: 'Wasser trinken', emoji: '💧', goal: 8, unit: 'Gläser' },
    { name: 'Vitamine nehmen', emoji: '💊' },
    { name: 'Gesund frühstücken', emoji: '🍳' },
    { name: 'Obst essen', emoji: '🍎' },
  ] },
  { category: 'Schlaf', items: [
    { name: 'Früh schlafen', emoji: '🌙' },
    { name: 'Früh aufstehen', emoji: '⏰' },
    { name: 'Kein Handy vorm Schlafen', emoji: '📵' },
  ] },
  { category: 'Achtsamkeit', items: [
    { name: 'Meditieren', emoji: '🧘' },
    { name: 'Atemübung', emoji: '🌬️' },
    { name: 'Dankbarkeit', emoji: '🙏' },
    { name: 'Tagebuch', emoji: '📔' },
  ] },
  { category: 'Produktivität', items: [
    { name: 'Tagesziele setzen', emoji: '✅' },
    { name: 'Morgen planen', emoji: '📝' },
    { name: 'Deep Work', emoji: '🎯' },
  ] },
  { category: 'Lernen', items: [
    { name: 'Lesen', emoji: '📚' },
    { name: 'Lernen', emoji: '🎓' },
    { name: 'Sprache üben', emoji: '🗣️' },
  ] },
  { category: 'Alltag', items: [
    { name: 'Bett machen', emoji: '🛏️' },
    { name: 'Zimmer aufräumen', emoji: '🧹' },
    { name: 'Meal Prep', emoji: '🥗' },
  ] },
  { category: 'Finanzen', items: [
    { name: 'Ausgaben tracken', emoji: '💸' },
    { name: 'Budget checken', emoji: '📊' },
  ] },
  { category: 'Soziales', items: [
    { name: 'Familie anrufen', emoji: '📞' },
    { name: 'Freund schreiben', emoji: '💬' },
  ] },
  { category: 'Digital Balance', items: [
    { name: 'Social Media Limit', emoji: '📱' },
    { name: 'Kein Handy morgens', emoji: '🌅' },
  ] },
]

export const CATEGORIES = [...TEMPLATE_GROUPS.map(g => g.category), 'Sonstiges']

export const CATEGORY_EMOJI: Record<string, string> = {
  Fitness: '🏋️', Gesundheit: '💧', Schlaf: '🌙', Achtsamkeit: '🧘', Produktivität: '✅', Lernen: '📚',
  Alltag: '🏠', Finanzen: '💸', Soziales: '💬', 'Digital Balance': '📱', Sonstiges: '✨',
}

export const EMOJIS = [
  '💧', '🏃', '🏋️', '🚶', '🧘', '📚', '🎓', '✍️', '📝', '🎯', '✅', '💊', '🍎', '🥗', '🍳', '🥦',
  '🌙', '⏰', '😴', '🛏️', '🧹', '🧺', '🪴', '🐶', '💸', '📊', '💰', '📞', '💬', '❤️', '🙏', '🌬️',
  '📵', '📱', '🌅', '☀️', '🚴', '🏊', '⚽', '🎸', '🎹', '🎨', '📷', '🧠', '💻', '🗣️', '🚭', '🍷',
  '☕', '🦷', '🧴', '🚿', '🌿', '🌍', '⭐', '🔥', '💪', '🎮', '📔', '🧩', '🕯️', '✨',
]

export const MOODS = ['😞', '😕', '😐', '🙂', '😄']
export const MOOD_LABELS = ['Schlecht', 'Mäßig', 'Okay', 'Gut', 'Super']

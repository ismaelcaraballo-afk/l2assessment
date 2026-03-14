/**
 * Urgency Scorer - Rule-based urgency calculation
 *
 * IMPROVEMENT 2: Fixed backwards urgency logic.
 * The original scorer penalized ALL CAPS (-50), off-hours (-15), and polite words (-15),
 * which meant "MY ACCOUNT IS LOCKED PLEASE HELP" scored as Low urgency.
 * Now high-urgency signals correctly raise the score.
 */

const HIGH_URGENCY_KEYWORDS = [
  'urgent', 'immediately', 'asap', 'emergency', 'critical',
  'data loss', 'security', 'breach', 'hacked', 'locked out',
  'cannot login', "can't login", "can't access", 'account locked',
  'down', 'outage', 'not working at all', 'completely broken',
  'cancel', 'canceling', 'cancelling', 'switching', 'leaving',
  'losing data', 'lost data', 'deleted', 'gone missing'
]

const LOW_URGENCY_KEYWORDS = [
  'suggestion', 'feature request', 'would be nice', 'someday',
  'just wondering', 'curious', 'no rush', 'when you get a chance',
  'love your product', 'great job', 'thank you', 'thanks for'
]

export function calculateUrgency(message) {
  const lower = message.toLowerCase()
  let score = 50

  // High-urgency keyword matches
  HIGH_URGENCY_KEYWORDS.forEach(keyword => {
    if (lower.includes(keyword)) score += 25
  })

  // ALL CAPS is a sign of frustration/urgency (original had this backwards at -50)
  if (message === message.toUpperCase() && message.replace(/\s/g, '').length > 10) {
    score += 20
  }

  // Multiple exclamation marks = elevated emotion
  const exclamations = (message.match(/!/g) || []).length
  if (exclamations >= 3) score += 15
  else if (exclamations >= 1) score += 5

  // Low-urgency signals
  LOW_URGENCY_KEYWORDS.forEach(keyword => {
    if (lower.includes(keyword)) score -= 20
  })

  // Questions without urgency signals are typically informational
  if (message.includes('?') && score < 60) score -= 10

  // Short messages are usually quick questions, not emergencies
  if (message.length < 30) score -= 15

  if (score >= 70) return "High"
  if (score <= 35) return "Low"
  return "Medium"
}

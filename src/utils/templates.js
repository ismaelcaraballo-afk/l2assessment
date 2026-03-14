/**
 * Recommendation Templates - Maps categories to recommended actions
 *
 * IMPROVEMENT 3: Fixed wrong recommendations and broken escalation logic.
 * Original bugs:
 * - "Feature Request" recommended "Ask user to check billing portal" (copy-paste error)
 * - "Technical Problem" recommended "Suggest user to restart their browser" (unhelpful)
 * - shouldEscalate() only checked message.length > 100, ignoring category and urgency
 *
 * Now recommendations are specific and actionable. Escalation uses category + urgency.
 */

const actionTemplates = {
  "Billing Issue": "Direct customer to the billing portal at /settings/billing. If the issue is a duplicate charge or failed payment, connect them with the billing support team.",
  "Technical Problem": "Ask for the customer's browser, OS, and steps to reproduce the issue. Check the status page first. If the issue is confirmed, create an engineering ticket.",
  "General Inquiry": "Search the help docs for a relevant article and respond with the link. If no article exists, answer directly and flag for documentation.",
  "Feature Request": "Thank the customer for the feedback and log the request in the product feedback tracker with their use case. Let them know it will be reviewed in the next product cycle.",
  "Account Access": "Send a password reset link immediately. If the customer still cannot log in, escalate to engineering with the account email and error details.",
  "Churn Risk": "Escalate to the customer success team within 1 hour. Offer a call with a CSM and check if there is an open technical or billing issue driving the frustration.",
  "Unknown": "Review manually — the message could not be automatically categorized."
}

/**
 * Get recommended action for a given category.
 */
export function getRecommendedAction(category) {
  return actionTemplates[category] || actionTemplates["Unknown"]
}

/**
 * Get all available categories.
 */
export function getAvailableCategories() {
  return Object.keys(actionTemplates)
}

/**
 * Determines if a message should be escalated to a human agent.
 * Original only checked message.length > 100 — now uses category and urgency.
 */
export function shouldEscalate(category, urgency) {
  if (urgency === "High") return true
  if (category === "Churn Risk") return true
  if (category === "Account Access") return true
  return false
}

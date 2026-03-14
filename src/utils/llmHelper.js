import Anthropic from '@anthropic-ai/sdk';

/**
 * LLM Helper for categorizing customer support messages
 * Using Anthropic Claude API for AI-powered categorization
 *
 * IMPROVEMENT 1: Structured prompt with defined categories and JSON output.
 * The original prompt was "Categorize this customer support message: {message}"
 * with no instructions — the LLM returned free-form text that was then parsed
 * with fragile keyword matching. Now we ask for structured JSON so every field
 * is reliable and the category/urgency/action all come from the same LLM call.
 */

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = `You are a customer support triage assistant for Relay AI, a SaaS customer operations platform.

Analyze the incoming customer message and respond with ONLY a valid JSON object — no markdown, no explanation, no extra text.

Use exactly this structure:
{
  "category": "<one of: Billing Issue | Technical Problem | Feature Request | General Inquiry | Account Access | Churn Risk>",
  "urgency": "<one of: High | Medium | Low>",
  "reasoning": "<1-2 sentence explanation of your classification>",
  "recommended_action": "<specific next step a support agent should take>",
  "should_escalate": <true | false>
}

Category definitions:
- Billing Issue: charges, invoices, refunds, subscription, pricing, payment failures
- Technical Problem: bugs, errors, crashes, features not working, performance issues
- Feature Request: suggestions, improvements, missing functionality the user wants added
- General Inquiry: questions about how the product works, onboarding, how-to questions
- Account Access: login failures, password resets, locked accounts, permissions
- Churn Risk: user mentions canceling, switching to competitors, expressing frustration about value

Urgency rules:
- High: data loss, security issues, complete service outage, user cannot do their job, mentions canceling
- Medium: partial functionality broken, billing errors, account access issues
- Low: general questions, feature requests, cosmetic issues

Escalate if: High urgency, Churn Risk category, or security/data issue.`;

/**
 * Analyze a customer support message using Anthropic Claude.
 * Returns category, urgency, reasoning, recommended action, and escalation flag.
 */
export async function categorizeMessage(message) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: message }],
    });

    const content = response.content[0].text.trim();
    const parsed = JSON.parse(content);

    return {
      category: parsed.category || "General Inquiry",
      urgency: parsed.urgency || "Medium",
      reasoning: parsed.reasoning || content,
      recommendedAction: parsed.recommended_action || "Review manually.",
      shouldEscalate: parsed.should_escalate || false,
    };
  } catch (error) {
    console.warn('Anthropic API failed, using mock response:', error.message);
    return getMockCategorization(message);
  }
}

/**
 * Mock categorization for when the API is unavailable.
 */
function getMockCategorization(message) {
  const lower = message.toLowerCase();

  if (lower.includes('cancel') || lower.includes('switching') || lower.includes('competitor') || lower.includes('not worth')) {
    return { category: "Churn Risk", urgency: "High", reasoning: "Customer is expressing intent to cancel or switch.", recommendedAction: "Escalate to retention team immediately. Offer a call with a customer success manager.", shouldEscalate: true };
  }
  if (lower.includes('login') || lower.includes('password') || lower.includes('locked') || lower.includes('access') || lower.includes('sign in')) {
    return { category: "Account Access", urgency: "High", reasoning: "Customer cannot access their account.", recommendedAction: "Send password reset link. If issue persists, escalate to engineering.", shouldEscalate: true };
  }
  if (lower.includes('bill') || lower.includes('payment') || lower.includes('charge') || lower.includes('invoice') || lower.includes('refund') || lower.includes('subscription')) {
    return { category: "Billing Issue", urgency: "Medium", reasoning: "Message contains billing or payment terminology.", recommendedAction: "Direct customer to the billing portal at /settings/billing. Offer to connect with billing support.", shouldEscalate: false };
  }
  if (lower.includes('bug') || lower.includes('error') || lower.includes('broken') || lower.includes('not working') || lower.includes('crash') || lower.includes('issue')) {
    return { category: "Technical Problem", urgency: "Medium", reasoning: "Customer is reporting a technical issue or error.", recommendedAction: "Ask for browser/OS details and steps to reproduce. Check the status page before escalating.", shouldEscalate: false };
  }
  if (lower.includes('feature') || lower.includes('improve') || lower.includes('suggestion') || lower.includes('would be great') || lower.includes('wish')) {
    return { category: "Feature Request", urgency: "Low", reasoning: "Customer is requesting a new feature or improvement.", recommendedAction: "Thank the customer and log the request in the product feedback tracker.", shouldEscalate: false };
  }
  return { category: "General Inquiry", urgency: "Low", reasoning: "Message appears to be a general question.", recommendedAction: "Respond with relevant help docs or FAQ link.", shouldEscalate: false };
}

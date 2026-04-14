import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "./logger";

export interface AgentDecision {
  decision: "call_insurance" | "call_pharmacy" | "escalate";
}

export interface CallResult {
  status: string;
  message: string;
}

/**
 * Calls the AI agent to determine what action to take for a rejected prescription.
 */
export async function getAiDecision(reason: string): Promise<AgentDecision> {
  const prompt = `Prescription rejected because: ${reason}. What should be done?

You must respond with a JSON object containing only a "decision" field.
Valid decisions are:
- "call_insurance" — if the issue is related to insurance authorization, coverage, or prior authorization
- "call_pharmacy" — if the issue is related to drug availability, substitution, or pharmacy stock
- "escalate" — if the case requires human review or is unclear

Respond with ONLY valid JSON, no explanation. Example: {"decision": "call_insurance"}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 128,
    messages: [
      {
        role: "system",
        content:
          "You are a clinical workflow AI agent that analyzes rejected prescriptions and decides on next steps. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  logger.info({ content }, "AI agent response received");

  try {
    const parsed = JSON.parse(content) as AgentDecision;
    if (!["call_insurance", "call_pharmacy", "escalate"].includes(parsed.decision)) {
      logger.warn({ parsed }, "Unexpected AI decision, defaulting to call_insurance");
      return { decision: "call_insurance" };
    }
    return parsed;
  } catch {
    logger.warn({ content }, "Failed to parse AI response, defaulting to call_insurance");
    return { decision: "call_insurance" };
  }
}

/**
 * Simulates a call to the insurance company for authorization.
 */
export function callInsurance(): CallResult {
  return {
    status: "approved",
    message: "Authorization granted by insurance provider",
  };
}

/**
 * Simulates a call to the pharmacy to check drug availability.
 */
export function callPharmacy(): CallResult {
  return {
    status: "available",
    message: "Drug available at partner pharmacy",
  };
}

/**
 * Simulates an escalation to a human reviewer.
 */
export function escalate(): CallResult {
  return {
    status: "escalated",
    message: "Case escalated to senior clinical pharmacist for manual review",
  };
}

/**
 * A minimal OpenAI chat-completion helper — a plain fetch() call
 * rather than installing OpenAI's full SDK, keeping this dependency
 * light and portable.
 *
 * Uses GPT-5 Nano — OpenAI's cheapest current model.
 *
 * TWO IMPORTANT GPT-5-SERIES-SPECIFIC DETAILS, both discovered through
 * real testing on this project:
 *
 * 1. `max_completion_tokens`, not the older `max_tokens` — sending
 *    the old parameter name is rejected outright with an
 *    "unsupported_parameter" error.
 *
 * 2. `reasoning_effort: "minimal"` — GPT-5-series models generate
 *    hidden internal "reasoning tokens" before writing their actual
 *    visible answer, and those reasoning tokens count against the
 *    SAME max_completion_tokens budget. Without this setting, the
 *    model can spend its entire token budget on invisible internal
 *    reasoning and return a technically successful response with
 *    completely empty visible text — exactly what happened before
 *    this fix. Since both features using this helper are short,
 *    simple summarization tasks with no real need for deep reasoning,
 *    minimizing it is both cheaper and more reliable. The token
 *    budget is also set generously higher than the bare minimum as a
 *    safety margin, in case any reasoning tokens are still consumed
 *    despite this setting — at GPT-5-nano's pricing, this costs
 *    a negligible fraction of a cent either way.
 */
export async function generateText(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<{ text: string | null; error: string | null }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("generateText: OPENAI_API_KEY is not set.");
    return { text: null, error: "AI feature is not configured yet." };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
        reasoning_effort: "minimal",
        max_completion_tokens: params.maxTokens ?? 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      return { text: null, error: "The AI request failed. Please try again." };
    }

    const data = await response.json();
    const text: string | undefined = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      // Logging the full usage breakdown here specifically helps
      // diagnose a repeat of the reasoning-tokens issue, if it ever
      // happens again despite the settings above.
      console.error("generateText: empty content. Full response:", JSON.stringify(data));
      return { text: null, error: "AI returned an empty response." };
    }

    return { text, error: null };
  } catch (err) {
    console.error("generateText error:", err);
    return { text: null, error: "Unable to reach the AI service." };
  }
}
export async function callClaude(
  prompt: string,
  apiKey: string,
  maxTokens: number = 300
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Claude API error");
  }

  return data.content?.[0]?.text || "Unable to generate response";
}

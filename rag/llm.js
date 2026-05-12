import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function askClaude(question, relevantChunks) {
  const context = relevantChunks
    .map((chunk, i) => `[Section ${i + 1}]\n${chunk}`)
    .join("\n\n");

  const prompt = `You are a helpful assistant that answers questions based strictly on the provided document content.

DOCUMENT CONTENT:
${context}

INSTRUCTIONS:
- Answer the question using ONLY the information in the document content above
- If the answer is not in the document, say "I couldn't find that information in the uploaded document"
- Be concise and direct

QUESTION: ${question}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].text;
}
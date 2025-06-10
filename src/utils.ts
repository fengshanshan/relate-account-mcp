import { OpenAI } from "openai";

export async function getTextResponseFromOpenAI(input: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.responses.create({
    model: "gpt-4.1",
    input,
  });

  return response.output_text;
}

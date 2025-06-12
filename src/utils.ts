import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";

export async function getTextResponseFromOpenAI(input: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.responses.create({
    model: "gpt-4.1",
    input,
  });

  return response.output_text ?? "";
}

export async function getTextResponseFromGemini(input: string) {
  const client = new GoogleGenAI({ apiKey: process.env.Gemini_API_KEY });

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: input,
  });

  return response.text ?? "";
}

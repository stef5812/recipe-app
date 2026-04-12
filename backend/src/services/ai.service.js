import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateText({
  prompt,
  temperature = 0.4,
  model = "gemini-2.0-flash",
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      temperature,
    },
  });

  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return { text };
}
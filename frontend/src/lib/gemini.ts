// Gemini AI integration placeholder
export const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-pro',
};

export async function generateWithGemini(prompt: string): Promise<string> {
  // Placeholder for Gemini API integration
  return `AI response for: ${prompt}`;
}

import { GoogleGenAI } from "@google/genai";
import { SurveyResponse } from "../types";

export const analyzeBullyingData = async (responses: SurveyResponse[], language: 'uz' | 'ru') => {
  if (responses.length === 0) return language === 'uz' ? "Tahlil qilish uchun ma'lumotlar mavjud emas." : "Нет данных для анализа.";

  // Initialize with process.env.API_KEY as injected by vite.config.ts
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  const summary = responses.map(r => ({
    school: r.user.schoolNumber,
    class: `${r.user.classNumber}-${r.user.classLetter}`,
    avgScore: Object.values(r.answers).reduce((a, b) => a + b, 0) / Object.values(r.answers).length
  }));

  const prompt = `
    Analyze the following school bullying survey data summary:
    ${JSON.stringify(summary)}
    
    The average scores are on a scale of 0 to 4, where higher scores might indicate higher exposure or risk of bullying.
    
    Please provide:
    1. A general overview of the situation.
    2. Identification of high-risk classes or schools.
    3. Practical advice for the administration and teachers to mitigate bullying.
    4. Recommendations for psychological support.
    
    Response language: ${language === 'uz' ? 'Uzbek' : 'Russian'}.
    Format: Professional educational report in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || (language === 'uz' ? "Tahlil natijasi bo'sh qaytdi." : "Результат анализа пуст.");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return language === 'uz' 
      ? "AI tahlili vaqtida xatolik yuz berdi. API kaliti to'g'ri sozlanganligini tekshiring." 
      : "Произошла ошибка при AI анализе. Проверьте настройки API ключа.";
  }
};
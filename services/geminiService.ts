
import { GoogleGenAI } from "@google/genai";
import { SurveyResponse } from "../types";

export const analyzeBullyingData = async (responses: SurveyResponse[], language: 'uz' | 'ru') => {
  if (responses.length === 0) return language === 'uz' ? "Tahlil qilish uchun ma'lumotlar mavjud emas." : "Нет данных для анализа.";

  // Fix: Initializing GoogleGenAI correctly using process.env.API_KEY directly as per requirements
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = responses.map(r => ({
    school: r.user.schoolNumber,
    class: `${r.user.classNumber}-${r.user.classLetter}`,
    // Fix: Explicitly cast Object.values to number[] and type reduce parameters to resolve TS unknown error
    avgScore: (Object.values(r.answers) as number[]).reduce((a: number, b: number) => a + b, 0) / (Object.values(r.answers).length || 1)
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
    // Fix: Using gemini-3-pro-preview for advanced reasoning/analysis task as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    
    // Fix: Access .text property directly (it is a property, not a method)
    return response.text || (language === 'uz' ? "Tahlil natijasi bo'sh qaytdi." : "Результат анализа пуст.");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return language === 'uz' 
      ? "AI tahlili vaqtida xatolik yuz berdi. API kaliti to'g'ri sozlanganligini tekshiring." 
      : "Произошла ошибка при AI анализе. Проверьте настройки API ключа.";
  }
};

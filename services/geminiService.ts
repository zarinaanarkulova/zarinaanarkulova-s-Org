
import { GoogleGenAI } from "@google/genai";
import { SurveyResponse } from "../types";
import { SURVEY_QUESTIONS, RESPONSE_LABELS } from "../constants";

export const analyzeBullyingData = async (responses: SurveyResponse[], language: 'uz' | 'ru') => {
  if (responses.length === 0) return language === 'uz' ? "Tahlil qilish uchun ma'lumotlar mavjud emas." : "Нет данных для анализа.";

  // Create instance right before call as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = responses.map(r => ({
    student: `${r.user.firstName} ${r.user.lastName}`,
    class: `${r.user.classNumber}-${r.user.classLetter}`,
    avgRiskScore: (Object.values(r.answers) as number[]).reduce((a: number, b: number) => a + b, 0) / (Object.values(r.answers).length || 1)
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Quyidagi maktab bulling monitoringi ma'lumotlarini tahlil qiling va hisobot tayyorlang: ${JSON.stringify(summary)}`,
      config: {
        systemInstruction: `Siz Guliston Davlat Pedagogika Instituti qoshidagi professional ta'lim psixologi va xulq-atvor tahlilchisiz. 
        Vazifangiz: 
        1. Taqdim etilgan ${responses.length} ta so'rovnoma natijalari asosida umumiy vaziyatni baholash.
        2. Eng yuqori xavf guruhidagi sinflarni aniqlash.
        3. Bullingni kamaytirish bo'yicha amaliy tavsiyalar berish.
        Javob tili: ${language === 'uz' ? 'O\'zbek tili' : 'Rus tili'}.
        Javobni professional Markdown formatida bering.`,
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });
    return response.text || "AI javob qaytarmadi.";
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw new Error(error.message || "AI tahlili jarayonida texnik xatolik yuz berdi.");
  }
};

export const analyzeIndividualResponse = async (response: SurveyResponse, language: 'uz' | 'ru') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const QandA = SURVEY_QUESTIONS.map(q => ({
    question: q.text[language],
    answer: RESPONSE_LABELS[language][response.answers[q.id]] || 'Noma\'lum'
  }));

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `O'quvchi ${response.user.firstName} ${response.user.lastName} ning javoblari: ${JSON.stringify(QandA)}`,
      config: {
        systemInstruction: `Siz bolalar psixologi va o'smirlar bo'yicha mutaxassissiz. 
        Ushbu individual javoblar asosida o'quvchining ruhiy holatini baholang va xavf darajasini tushuntiring.
        Sinf rahbari va ota-onalar uchun tavsiyalar bering.
        Javob tili: ${language === 'uz' ? 'O\'zbek tili' : 'Rus tili'}.
        Markdown formatida javob bering.`,
        thinkingConfig: { thinkingBudget: 1500 }
      }
    });
    return res.text || "Xulosa generatsiya qilinmadi.";
  } catch (error: any) {
    console.error("Individual AI Analysis Error:", error);
    throw new Error(error.message || "Individual tahlilda xatolik.");
  }
};

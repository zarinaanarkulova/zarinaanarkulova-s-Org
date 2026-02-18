
import { GoogleGenAI } from "@google/genai";
import { SurveyResponse } from "../types";
import { SURVEY_QUESTIONS, RESPONSE_LABELS } from "../constants";

const getAiInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBullyingData = async (responses: SurveyResponse[], language: 'uz' | 'ru') => {
  if (responses.length === 0) return language === 'uz' ? "Tahlil qilish uchun ma'lumotlar mavjud emas." : "Нет данных для анализа.";

  const ai = getAiInstance();

  const summary = responses.map(r => ({
    school: r.user.schoolNumber,
    class: `${r.user.classNumber}-${r.user.classLetter}`,
    avgScore: (Object.values(r.answers) as number[]).reduce((a: number, b: number) => a + b, 0) / (Object.values(r.answers).length || 1)
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Quyidagi maktab bulling monitoringi ma'lumotlarini tahlil qiling: ${JSON.stringify(summary)}`,
      config: {
        systemInstruction: `Siz professional ta'lim psixologi va xulq-atvor tahlilchisiz. 
        Vazifangiz: 
        1. Taqdim etilgan ma'lumotlar asosida umumiy vaziyatni baholash.
        2. Eng yuqori xavf guruhidagi sinf va maktablarni aniqlash.
        3. Bullingni kamaytirish bo'yicha amaliy (pedagogik va psixologik) tavsiyalar berish.
        4. O'qituvchilar uchun "yo'l xaritasi" taklif qilish.
        Javob tili: ${language === 'uz' ? 'O\'zbek tili' : 'Rus tili'}.
        Javobni chiroyli Markdown formatida, sarlavhalar va punktlar bilan bering.`,
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });
    return response.text || (language === 'uz' ? "Tahlil natijasi bo'sh qaytdi." : "Результат анализа пуст.");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return language === 'uz' 
      ? "AI tahlili vaqtida xatolik yuz berdi. Iltimos, API kalitini tekshiring yoki birozdan so'ng urinib ko'ring." 
      : "Произошла ошибка при AI анализе. Проверьте API ключ или попробуйте позже.";
  }
};

export const analyzeIndividualResponse = async (response: SurveyResponse, language: 'uz' | 'ru') => {
  const ai = getAiInstance();
  
  const QandA = SURVEY_QUESTIONS.map(q => ({
    question: q.text[language],
    answer: RESPONSE_LABELS[language][response.answers[q.id]] || 'Javob berilmagan'
  }));

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `O'quvchi javoblari: ${JSON.stringify(QandA)}`,
      config: {
        systemInstruction: `Siz bolalar psixologi va o'smirlar bo'yicha mutaxassissiz. 
        Sizga ${response.user.firstName} ${response.user.lastName} ismli (${response.user.classNumber}-sinf) o'quvchining so'rovnomadagi javoblari beriladi. 
        Vazifangiz:
        1. Ushbu individual javoblar asosida o'quvchining bullingga duchor bo'lish (yoki agressiya) xavfini 10 ballik tizimda baholang.
        2. O'quvchi bilan ishlash bo'yicha maxfiy tavsiyalar tayyorlang.
        3. Ota-onalar va sinf rahbari uchun aniq harakatlar algoritmini bering.
        Javob tili: ${language === 'uz' ? 'O\'zbek tili' : 'Rus tili'}.
        Markdown formatida javob bering.`,
        thinkingConfig: { thinkingBudget: 1500 }
      }
    });
    return res.text || "Xulosa generatsiya qilinmadi.";
  } catch (error) {
    console.error("Individual AI Analysis Error:", error);
    return language === 'uz' ? "Individual tahlil amalga oshmadi." : "Индивидуальный анализ не удался.";
  }
};

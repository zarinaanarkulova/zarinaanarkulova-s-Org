
import { GoogleGenAI } from "@google/genai";
import { SurveyResponse, Question } from "../types";
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
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || (language === 'uz' ? "Tahlil natijasi bo'sh qaytdi." : "Результат анализа пуст.");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return language === 'uz' 
      ? "AI tahlili vaqtida xatolik yuz berdi." 
      : "Произошла ошибка при AI анализе.";
  }
};

export const analyzeIndividualResponse = async (response: SurveyResponse, language: 'uz' | 'ru') => {
  const ai = getAiInstance();
  
  // Savollar va javoblarni matn ko'rinishiga o'tkazish
  const QandA = SURVEY_QUESTIONS.map(q => ({
    question: q.text[language],
    answer: RESPONSE_LABELS[language][response.answers[q.id]] || 'Javob berilmagan'
  }));

  const prompt = `
    Siz professional maktab psixologi va pedagogik ekspertsiz. 
    Quyidagi o'quvchining so'rovnomadagi javoblarini tahlil qiling:
    O'quvchi: ${response.user.firstName} ${response.user.lastName}, ${response.user.classNumber}-sinf.
    
    Javoblar:
    ${JSON.stringify(QandA)}
    
    Vazifangiz:
    1. O'quvchining ruhiy holati va bulling xavfi darajasini baholang.
    2. Aynan shu o'quvchi uchun mos keladigan psixologik-pedagogik metodlarni (masalan, treninglar, suhbat metodikasi, art-terapiya va h.k.) tavsiya qiling.
    3. O'qituvchilar va ota-onalar uchun individual harakatlar rejasini tuzing.
    
    Javob tili: ${language === 'uz' ? 'O\'zbek tili' : 'Rus tili'}.
    Format: Markdown (Sarlavhalar va ro'yxatlar bilan chiroyli formatlangan bo'lsin).
  `;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return res.text || "Xulosa generatsiya qilinmadi.";
  } catch (error) {
    console.error("Individual AI Analysis Error:", error);
    return language === 'uz' ? "Xatolik yuz berdi." : "Произошла ошибка.";
  }
};

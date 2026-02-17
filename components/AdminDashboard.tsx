
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SurveyResponse, Language } from '../types';
import { TRANSLATIONS, SURVEY_QUESTIONS, RESPONSE_LABELS } from '../constants';
import { analyzeBullyingData, analyzeIndividualResponse } from '../services/geminiService';

interface Props {
  data: SurveyResponse[];
  lang: Language;
  onClear: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ data, lang, onClear, onRefresh, isLoading, onLogout }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [individualAiResult, setIndividualAiResult] = useState<string | null>(null);
  const [loadingIndividualAi, setLoadingIndividualAi] = useState(false);
  
  const t = TRANSLATIONS[lang];

  // Word faylga eksport qilish funksiyasi
  const exportToWord = (content: string, filename: string) => {
    // Markdown formatini sodda HTMLga o'tkazish (Word yaxshi o'qishi uchun)
    const formattedContent = content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><style>body{font-family: 'Times New Roman', serif; line-height: 1.6;}</style></head>
      <body>
        <h1 style="text-align:center; color: #2563eb;">${t.title}</h1>
        <h3 style="text-align:center;">AI Tahlil va Tavsiyalar Xulosasi</h3>
        <hr/>
        <div>${formattedContent}</div>
        <p style="margin-top: 50px; font-size: 10pt; color: gray;">Sana: ${new Date().toLocaleString()}</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Ulashish funksiyasi
  const shareContent = async (text: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
        });
      } catch (err) {
        console.error("Ulashishda xato:", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert(t.copied);
    }
  };

  const getAverageScore = (answers: Record<string, number>) => {
    const values = Object.values(answers) as number[];
    return values.reduce((a, b) => a + b, 0) / (values.length || 1);
  };

  const sortedParticipants = useMemo(() => {
    return [...data].sort((a, b) => {
      const scoreA = getAverageScore(a.answers);
      const scoreB = getAverageScore(b.answers);
      return scoreB - scoreA;
    });
  }, [data]);

  const statsByClass = useMemo(() => {
    const map: Record<string, { name: string; score: number; count: number }> = {};
    data.forEach(r => {
      const key = `${r.user.classNumber}-${r.user.classLetter}`;
      if (!map[key]) map[key] = { name: key, score: 0, count: 0 };
      const avg = getAverageScore(r.answers);
      map[key].score += avg;
      map[key].count += 1;
    });
    return Object.values(map).map(v => ({
      name: v.name,
      averageRisk: Number((v.score / v.count).toFixed(2))
    })).sort((a, b) => b.averageRisk - a.averageRisk);
  }, [data]);

  const statsByAge = useMemo(() => {
    const map: Record<number, number> = {};
    data.forEach(r => {
      map[r.user.birthYear] = (map[r.user.birthYear] || 0) + 1;
    });
    return Object.entries(map).map(([year, count]) => ({
      year: year,
      talabalar: count
    })).sort((a, b) => Number(a.year) - Number(b.year));
  }, [data]);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    try {
      const result = await analyzeBullyingData(data, lang);
      setAiAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleIndividualAi = async () => {
    if (!selectedResponse) return;
    setLoadingIndividualAi(true);
    setIndividualAiResult(null);
    try {
      const result = await analyzeIndividualResponse(selectedResponse, lang);
      setIndividualAiResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIndividualAi(false);
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 2.5) return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-tighter">{t.highRisk}</span>;
    if (score >= 1.5) return <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-tighter">{t.mediumRisk}</span>;
    return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-tighter">{t.lowRisk}</span>;
  };

  const closeModal = () => {
    setSelectedResponse(null);
    setIndividualAiResult(null);
    setLoadingIndividualAi(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-10 pb-32 fade-in">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center glass-morphism p-10 rounded-[2.5rem] shadow-xl border border-white/50 gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 leading-tight">{t.adminPanel}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-3 h-3 bg-blue-500 rounded-full ${isLoading ? 'animate-ping' : ''}`}></span>
            <p className="text-blue-600 font-black text-sm uppercase tracking-widest">{t.totalSurveys}: {data.length}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 w-full xl:w-auto">
          <button onClick={onRefresh} className="px-6 py-4 bg-blue-100 text-blue-600 rounded-2xl font-bold hover:bg-blue-200 transition">🔄</button>
          <button onClick={onLogout} className="px-6 py-4 bg-white/50 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition">{t.back}</button>
          <button onClick={onClear} className="px-8 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-200">{t.deleteData}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-morphism p-8 rounded-[2.5rem] shadow-lg border border-white/50">
          <h3 className="text-lg font-black mb-6 text-gray-800 border-l-4 border-blue-500 pl-4 uppercase tracking-tighter">{t.bullyingRisk} (Sinflar)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByClass}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="averageRisk" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-morphism p-8 rounded-[2.5rem] shadow-lg border border-white/50">
          <h3 className="text-lg font-black mb-6 text-gray-800 border-l-4 border-emerald-500 pl-4 uppercase tracking-tighter">O'quvchilar yoshi</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsByAge}>
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip />
                <Area type="monotone" dataKey="talabalar" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-morphism rounded-[2.5rem] shadow-xl border border-white/50 overflow-hidden">
        <div className="p-10 border-b flex justify-between items-center bg-white/30">
          <h3 className="text-2xl font-black text-gray-900">{t.participants}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">{t.firstName} {t.lastName}</th>
                <th className="px-10 py-6">{t.schoolNumber}</th>
                <th className="px-10 py-6">{t.classNumber}-{t.classLetter}</th>
                <th className="px-10 py-6 text-center">{t.riskLevel}</th>
                <th className="px-10 py-6 text-right">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedParticipants.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="font-bold text-gray-900">{r.user.firstName} {r.user.lastName}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{r.user.birthYear}-yil</div>
                  </td>
                  <td className="px-10 py-6 text-gray-600">{r.user.schoolNumber}-maktab</td>
                  <td className="px-10 py-6 text-gray-600">{r.user.classNumber}-{r.user.classLetter}</td>
                  <td className="px-10 py-6 text-center">{getRiskBadge(getAverageScore(r.answers))}</td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => setSelectedResponse(r)}
                      className="px-6 py-2 bg-white border border-gray-200 text-blue-600 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      {t.viewDetails}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-morphism p-10 rounded-[2.5rem] shadow-xl border border-white/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <h3 className="text-3xl font-black text-gray-900 flex items-center gap-4">
            <span className="p-3 bg-indigo-100 rounded-2xl text-2xl">🤖</span> {t.aiAnalysis}
          </h3>
          <div className="flex gap-3">
            <button
              onClick={handleAiAnalysis}
              disabled={loadingAi}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loadingAi ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "✨"}
              {t.analyzeWithAI}
            </button>
            {aiAnalysis && (
              <>
                <button 
                  onClick={() => exportToWord(aiAnalysis, "Umumiy_AI_Tahlil")}
                  className="px-6 py-4 bg-blue-100 text-blue-600 rounded-2xl font-bold hover:bg-blue-200 transition"
                  title="Wordda yuklash"
                >
                  📄
                </button>
                <button 
                  onClick={() => shareContent(aiAnalysis, "Umumiy AI Tahlil Xulosasi")}
                  className="px-6 py-4 bg-emerald-100 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-200 transition"
                  title="Ulashish"
                >
                  📤
                </button>
              </>
            )}
          </div>
        </div>
        {aiAnalysis && (
          <div className="prose max-w-none bg-white/40 p-10 rounded-[2rem] border border-white/60 whitespace-pre-wrap text-gray-800 font-medium fade-in shadow-inner">
            {aiAnalysis}
          </div>
        )}
      </div>

      {selectedResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/20">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-3xl font-black text-gray-900">{t.detailsTitle}</h3>
                <p className="text-blue-600 font-bold mt-1 uppercase tracking-widest text-xs">{selectedResponse.user.firstName} {selectedResponse.user.lastName}</p>
              </div>
              <button onClick={closeModal} className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all font-black">✕</button>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6 bg-blue-50/50 p-8 rounded-3xl border border-blue-100">
                <div className="space-y-1">
                  <span className="font-black text-gray-400 uppercase text-[10px] block tracking-widest">Maktab</span> 
                  <span className="text-lg font-black text-blue-900">{selectedResponse.user.schoolNumber}-maktab</span>
                </div>
                <div className="space-y-1">
                  <span className="font-black text-gray-400 uppercase text-[10px] block tracking-widest">Sinf</span> 
                  <span className="text-lg font-black text-blue-900">{selectedResponse.user.classNumber}-{selectedResponse.user.classLetter}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleIndividualAi}
                    disabled={loadingIndividualAi}
                    className="flex-grow py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loadingIndividualAi ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "✨"}
                    Individual AI Tahlil
                  </button>
                  {individualAiResult && (
                    <>
                      <button 
                        onClick={() => exportToWord(individualAiResult, `${selectedResponse.user.firstName}_Tahlil`)}
                        className="px-6 py-5 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition border border-blue-100"
                      >
                        📄
                      </button>
                      <button 
                        onClick={() => shareContent(individualAiResult, `${selectedResponse.user.firstName} uchun tahlil xulosasi`)}
                        className="px-6 py-5 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-100 transition border border-emerald-100"
                      >
                        📤
                      </button>
                    </>
                  )}
                </div>
                
                {individualAiResult && (
                  <div className="p-8 bg-indigo-50/50 border-2 border-indigo-100 rounded-[2rem] text-sm text-gray-800 leading-relaxed fade-in whitespace-pre-wrap shadow-inner">
                    <h4 className="font-black text-indigo-900 mb-4 uppercase tracking-tighter flex items-center gap-2 text-base">
                      <span>🩺</span> Ekspert xulosasi va metodikalar
                    </h4>
                    {individualAiResult}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs ml-1">Javoblar tafsiloti</h4>
                {SURVEY_QUESTIONS.map((q) => (
                  <div key={q.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-sm font-bold text-gray-600 mb-4">{q.text[lang]}</p>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${selectedResponse.answers[q.id] >= 3 ? 'bg-red-500' : 'bg-blue-600'}`}>
                        {selectedResponse.answers[q.id]}
                      </div>
                      <span className="font-black text-gray-900 uppercase text-xs tracking-tighter">
                        {RESPONSE_LABELS[lang][selectedResponse.answers[q.id]]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-10 border-t bg-gray-50/50">
              <button onClick={closeModal} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all">
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

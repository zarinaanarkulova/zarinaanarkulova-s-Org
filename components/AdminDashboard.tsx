
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

  const exportToWord = (content: string, filename: string, titleSuffix: string = "") => {
    // Markdown formatini sodda HTMLga o'tkazish
    const formattedContent = content
      .replace(/^# (.*$)/gim, '<h1 style="color: #1e40af; font-family: Arial; text-align:center;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #1e40af; margin-top: 20px; border-bottom: 1px solid #eee;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="color: #1e3a8a; margin-top: 15px;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/- (.*)/g, '<li style="margin-left: 20px;">$1</li>');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
          .footer { margin-top: 40px; font-size: 9pt; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin:0; font-size: 18pt;">${t.title}</h1>
          <p style="font-weight: bold; color: #2563eb; margin: 5px 0;">MONITORING VA TAHLIL TIZIMI</p>
        </div>
        <h2 style="text-align: center;">${titleSuffix || "AI Tahlil Natijalari"}</h2>
        <div class="content">${formattedContent}</div>
        <div class="footer">
          <p>Yaratilgan vaqt: ${new Date().toLocaleString('uz-UZ')}</p>
          <p>© Guliston Davlat Pedagogika Instituti</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().getTime()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareContent = async (text: string, title: string) => {
    const cleanText = text.replace(/[#*]/g, '');
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: cleanText,
        });
      } catch (err) {
        console.log("Sharing cancelled or failed");
      }
    } else {
      await navigator.clipboard.writeText(cleanText);
      alert(t.copied);
    }
  };

  const getAverageScore = (answers: Record<string, number>) => {
    const values = Object.values(answers) as number[];
    return values.reduce((a, b) => a + b, 0) / (values.length || 1);
  };

  const sortedParticipants = useMemo(() => {
    return [...data].sort((a, b) => getAverageScore(b.answers) - getAverageScore(a.answers));
  }, [data]);

  const statsByClass = useMemo(() => {
    const map: Record<string, { name: string; score: number; count: number }> = {};
    data.forEach(r => {
      const key = `${r.user.classNumber}-${r.user.classLetter}`;
      if (!map[key]) map[key] = { name: key, score: 0, count: 0 };
      map[key].score += getAverageScore(r.answers);
      map[key].count += 1;
    });
    return Object.values(map).map(v => ({
      name: v.name,
      averageRisk: Number((v.score / v.count).toFixed(2))
    })).sort((a, b) => b.averageRisk - a.averageRisk);
  }, [data]);

  const statsByAge = useMemo(() => {
    const map: Record<number, number> = {};
    data.forEach(r => { map[r.user.birthYear] = (map[r.user.birthYear] || 0) + 1; });
    return Object.entries(map).map(([year, count]) => ({ year, talabalar: count })).sort((a, b) => Number(a.year) - Number(b.year));
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
    if (score >= 2.5) return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase">{t.highRisk}</span>;
    if (score >= 1.5) return <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase">{t.mediumRisk}</span>;
    return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase">{t.lowRisk}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-10 pb-32 fade-in">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center glass-morphism p-10 rounded-[2.5rem] shadow-xl border border-white/50 gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 leading-tight">{t.adminPanel}</h2>
          <p className="text-blue-600 font-black text-sm uppercase tracking-widest mt-2">
            {t.totalSurveys}: {data.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={onRefresh} className="px-6 py-4 bg-blue-100 text-blue-600 rounded-2xl font-bold hover:bg-blue-200 transition">🔄</button>
          <button onClick={onLogout} className="px-6 py-4 bg-white/50 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition">{t.back}</button>
          <button onClick={onClear} className="px-8 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition shadow-lg">{t.deleteData}</button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-morphism p-8 rounded-[2.5rem] shadow-lg border border-white/50">
          <h3 className="text-lg font-black mb-6 text-gray-800 border-l-4 border-blue-500 pl-4 uppercase tracking-tighter">{t.bullyingRisk} (Sinflar)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByClass}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="averageRisk" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-morphism p-8 rounded-[2.5rem] shadow-lg border border-white/50">
          <h3 className="text-lg font-black mb-6 text-gray-800 border-l-4 border-emerald-500 pl-4 uppercase tracking-tighter">O'quvchilar yoshi</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsByAge}>
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="talabalar" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Participants Table */}
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
                <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-10 py-6 font-bold">{r.user.firstName} {r.user.lastName}</td>
                  <td className="px-10 py-6 text-gray-600">{r.user.schoolNumber}-maktab</td>
                  <td className="px-10 py-6 text-gray-600">{r.user.classNumber}-{r.user.classLetter}</td>
                  <td className="px-10 py-6 text-center">{getRiskBadge(getAverageScore(r.answers))}</td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => setSelectedResponse(r)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition">
                      {t.viewDetails}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="glass-morphism p-10 rounded-[2.5rem] shadow-xl border border-white/50">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <h3 className="text-3xl font-black text-gray-900 flex items-center gap-4">
            <span className="p-3 bg-indigo-100 rounded-2xl text-2xl">🤖</span> {t.aiAnalysis}
          </h3>
          <div className="flex gap-3">
            <button
              onClick={handleAiAnalysis}
              disabled={loadingAi}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition flex items-center gap-3"
            >
              {loadingAi ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "✨"}
              {t.analyzeWithAI}
            </button>
            {aiAnalysis && (
              <>
                <button onClick={() => exportToWord(aiAnalysis, "Umumiy_Tahlil", "Maktab Monitoringi Xulosasi")} className="px-6 py-4 bg-blue-100 text-blue-600 rounded-2xl font-bold hover:bg-blue-200">📄</button>
                <button onClick={() => shareContent(aiAnalysis, "Monitoring AI Xulosasi")} className="px-6 py-4 bg-emerald-100 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-200">📤</button>
              </>
            )}
          </div>
        </div>
        {aiAnalysis && (
          <div className="prose max-w-none bg-white/40 p-10 rounded-[2rem] border border-white/60 whitespace-pre-wrap text-gray-800 font-medium fade-in shadow-inner overflow-y-auto max-h-[500px] custom-scrollbar">
            {aiAnalysis}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-3xl font-black text-gray-900">{selectedResponse.user.firstName} {selectedResponse.user.lastName}</h3>
              <button onClick={() => setSelectedResponse(null)} className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-red-50 rounded-2xl transition font-black">✕</button>
            </div>
            <div className="p-10 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-6 rounded-3xl">
                <div><p className="text-[10px] font-black text-gray-400 uppercase">Maktab</p><p className="font-black text-blue-900">{selectedResponse.user.schoolNumber}</p></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase">Sinf</p><p className="font-black text-blue-900">{selectedResponse.user.classNumber}-{selectedResponse.user.classLetter}</p></div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={handleIndividualAi} disabled={loadingIndividualAi} className="flex-grow py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">
                    {loadingIndividualAi ? "Yuklanmoqda..." : "✨ Individual AI Tahlil"}
                  </button>
                  {individualAiResult && (
                    <>
                      <button onClick={() => exportToWord(individualAiResult, `${selectedResponse.user.firstName}_Tahlil`, `${selectedResponse.user.firstName} uchun Individual Xulosa`)} className="px-6 py-5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">📄</button>
                      <button onClick={() => shareContent(individualAiResult, "Individual AI Xulosa")} className="px-6 py-5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">📤</button>
                    </>
                  )}
                </div>
                {individualAiResult && <div className="p-8 bg-indigo-50/50 rounded-[2rem] text-sm whitespace-pre-wrap leading-relaxed shadow-inner">{individualAiResult}</div>}
              </div>
              <div className="space-y-6">
                <h4 className="font-black text-gray-400 uppercase text-xs tracking-widest">Javoblar tafsiloti</h4>
                {SURVEY_QUESTIONS.map(q => (
                  <div key={q.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-sm font-bold text-gray-600 mb-4">{q.text[lang]}</p>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${selectedResponse.answers[q.id] >= 3 ? 'bg-red-500' : 'bg-blue-600'}`}>{selectedResponse.answers[q.id]}</div>
                      <span className="font-black text-gray-900 uppercase text-xs">{RESPONSE_LABELS[lang][selectedResponse.answers[q.id]]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-10 border-t bg-gray-50/50"><button onClick={() => setSelectedResponse(null)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black">{t.close}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

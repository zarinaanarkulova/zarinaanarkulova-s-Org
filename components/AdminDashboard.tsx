
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
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

  // Helper for colors based on risk score
  const getRiskColor = (score: number) => {
    if (score >= 2.5) return '#ef4444'; // Red
    if (score >= 1.5) return '#f59e0b'; // Amber
    return '#10b981'; // Emerald
  };

  const exportToWord = (content: string, filename: string, titleSuffix: string = "") => {
    // Convert markdown/text to simple HTML for Word
    const formattedContent = content
      .replace(/^# (.*$)/gim, '<h1 style="color: #000; font-family: Arial; text-align:center;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #000; margin-top: 20px; border-bottom: 2px solid #000;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="color: #000; margin-top: 15px;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/- (.*)/g, '<li style="margin-left: 20px; color: #000;">$1</li>');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #000; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .footer { margin-top: 40px; font-size: 9pt; color: #333; border-top: 1px solid #ccc; padding-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin:0; font-size: 18pt; color: #000;">${t.title}</h1>
          <p style="font-weight: bold; color: #000; margin: 5px 0;">STATISTIK HISOBOT</p>
        </div>
        <h2 style="text-align: center; color: #000;">${titleSuffix || "Monitoring Natijalari"}</h2>
        <div class="content">${formattedContent}</div>
        <div class="footer">
          <p>Yaratilgan vaqt: ${new Date().toLocaleString('uz-UZ')}</p>
          <p>© Guliston Davlat Pedagogika Instituti - Anarkulova Zarina Axmad qizi</p>
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

  const getAverageScore = (answers: Record<string, number>) => {
    const values = Object.values(answers) as number[];
    return values.reduce((a, b) => a + b, 0) / (values.length || 1);
  };

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

  const handleFullStatsExport = () => {
    let report = `## Umumiy Statistika\n`;
    report += `- Jami ishtirokchilar: ${data.length}\n`;
    report += `- Eng yuqori xavfli sinflar: ${statsByClass.slice(0, 3).map(c => `${c.name} (${c.averageRisk})`).join(', ')}\n\n`;
    
    report += `### Sinflar bo'yicha tahlil\n`;
    statsByClass.forEach(c => {
      report += `- ${c.name} sinfi: O'rtacha xavf darajasi ${c.averageRisk}\n`;
    });

    report += `\n### Yuqori xavf guruhidagi o'quvchilar\n`;
    const highRisk = data.filter(r => getAverageScore(r.answers) >= 2.5);
    if (highRisk.length > 0) {
      highRisk.forEach(r => {
        report += `- ${r.user.firstName} ${r.user.lastName} (${r.user.classNumber}-${r.user.classLetter}): ${getAverageScore(r.answers).toFixed(2)}\n`;
      });
    } else {
      report += `- Yuqori xavfli o'quvchilar aniqlanmadi.\n`;
    }

    exportToWord(report, "Umumiy_Statistika_Hisoboti", "Monitoring va Tahlil Hisoboti");
  };

  const shareDashboardStats = async () => {
    const highRiskCount = data.filter(r => getAverageScore(r.answers) >= 2.5).length;
    const summary = `${t.title}\n${t.totalSurveys}: ${data.length}\nYuqori xavf: ${highRiskCount} nafar\nEng xavfli sinf: ${statsByClass[0]?.name || 'N/A'}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Monitoring Statistikasi', text: summary });
      } catch (e) { console.log('Share error'); }
    } else {
      await navigator.clipboard.writeText(summary);
      alert(t.copied);
    }
  };

  const sortedParticipants = useMemo(() => {
    return [...data].sort((a, b) => getAverageScore(b.answers) - getAverageScore(a.answers));
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
    if (score >= 2.5) return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase border border-red-200">{t.highRisk}</span>;
    if (score >= 1.5) return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase border border-amber-200">{t.mediumRisk}</span>;
    return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase border border-emerald-200">{t.lowRisk}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-10 pb-32 fade-in">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center glass-morphism p-10 rounded-[2.5rem] shadow-xl border border-white/50 gap-6">
        <div>
          <h2 className="text-4xl font-black text-black leading-tight">{t.adminPanel}</h2>
          <p className="text-blue-700 font-black text-sm uppercase tracking-widest mt-2">
            {t.totalSurveys}: {data.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={onRefresh} title="Yangilash" className="px-6 py-4 bg-blue-100 text-blue-700 rounded-2xl font-bold hover:bg-blue-200 transition">🔄</button>
          <button onClick={handleFullStatsExport} title="Wordda yuklash" className="px-6 py-4 bg-indigo-100 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-200 transition">📄</button>
          <button onClick={shareDashboardStats} title="Ulashish" className="px-6 py-4 bg-emerald-100 text-emerald-700 rounded-2xl font-bold hover:bg-emerald-200 transition">📤</button>
          <button onClick={onLogout} className="px-6 py-4 bg-white/50 border border-gray-300 rounded-2xl font-bold text-black hover:bg-white transition">{t.back}</button>
          <button onClick={onClear} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition shadow-lg">{t.deleteData}</button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-morphism p-8 rounded-[2.5rem] shadow-lg border border-white/50">
          <h3 className="text-lg font-black mb-6 text-black border-l-4 border-red-600 pl-4 uppercase tracking-tighter">{t.bullyingRisk} (Sinflar - Risk Rangi)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByClass}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#000', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#000', fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#000'}} 
                  itemStyle={{fontWeight: 'bold', color: '#000'}}
                />
                <Bar dataKey="averageRisk" radius={[8, 8, 0, 0]} barSize={40}>
                  {statsByClass.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRiskColor(entry.averageRisk)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-morphism p-8 rounded-[2.5rem] shadow-lg border border-white/50">
          <h3 className="text-lg font-black mb-6 text-black border-l-4 border-emerald-600 pl-4 uppercase tracking-tighter">O'quvchilar yoshi (Faollik)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsByAge}>
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#000', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#000', fontWeight: 'bold'}} />
                <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#000'}}
                />
                <Area type="monotone" dataKey="talabalar" stroke="#10b981" fill="#10b981" fillOpacity={0.4} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="glass-morphism rounded-[2.5rem] shadow-xl border border-white/50 overflow-hidden">
        <div className="p-10 border-b flex justify-between items-center bg-white/30">
          <h3 className="text-2xl font-black text-black">{t.participants}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100/50 text-black uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">{t.firstName} {t.lastName}</th>
                <th className="px-10 py-6">{t.schoolNumber}</th>
                <th className="px-10 py-6">{t.classNumber}-{t.classLetter}</th>
                <th className="px-10 py-6 text-center">{t.riskLevel}</th>
                <th className="px-10 py-6 text-right">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedParticipants.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50/80 transition-colors">
                  <td className="px-10 py-6 font-bold text-black">{r.user.firstName} {r.user.lastName}</td>
                  <td className="px-10 py-6 text-black font-medium">{r.user.schoolNumber}-maktab</td>
                  <td className="px-10 py-6 text-black font-medium">{r.user.classNumber}-{r.user.classLetter}</td>
                  <td className="px-10 py-6 text-center">{getRiskBadge(getAverageScore(r.answers))}</td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => setSelectedResponse(r)} className="px-6 py-2 bg-black text-white rounded-xl font-black text-xs hover:bg-gray-800 transition shadow-md">
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
          <h3 className="text-3xl font-black text-black flex items-center gap-4">
            <span className="p-3 bg-indigo-100 rounded-2xl text-2xl">🤖</span> {t.aiAnalysis}
          </h3>
          <div className="flex gap-3">
            <button
              onClick={handleAiAnalysis}
              disabled={loadingAi}
              className="px-10 py-4 bg-indigo-700 text-white rounded-2xl font-black hover:bg-indigo-800 transition flex items-center gap-3 shadow-lg"
            >
              {loadingAi ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "✨"}
              {t.analyzeWithAI}
            </button>
            {aiAnalysis && (
              <>
                <button onClick={() => exportToWord(aiAnalysis, "AI_Tahlili", "AI Monitoring Xulosasi")} className="px-6 py-4 bg-blue-100 text-blue-800 rounded-2xl font-bold hover:bg-blue-200 border border-blue-200">📄</button>
                <button onClick={() => shareContent(aiAnalysis, "Monitoring AI Xulosasi")} className="px-6 py-4 bg-emerald-100 text-emerald-800 rounded-2xl font-bold hover:bg-emerald-200 border border-emerald-200">📤</button>
              </>
            )}
          </div>
        </div>
        {aiAnalysis && (
          <div className="prose max-w-none bg-white p-10 rounded-[2rem] border border-gray-200 whitespace-pre-wrap text-black font-bold fade-in shadow-inner overflow-y-auto max-h-[600px] custom-scrollbar">
            {aiAnalysis}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col border border-gray-100">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-3xl font-black text-black">{selectedResponse.user.firstName} {selectedResponse.user.lastName}</h3>
              <button onClick={() => setSelectedResponse(null)} className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 rounded-2xl transition font-black text-black">✕</button>
            </div>
            <div className="p-10 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <div><p className="text-[10px] font-black text-gray-400 uppercase">Maktab</p><p className="font-black text-black">{selectedResponse.user.schoolNumber}</p></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase">Sinf</p><p className="font-black text-black">{selectedResponse.user.classNumber}-{selectedResponse.user.classLetter}</p></div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={handleIndividualAi} disabled={loadingIndividualAi} className="flex-grow py-5 bg-indigo-700 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-800 transition">
                    {loadingIndividualAi ? "Yuklanmoqda..." : "✨ Individual AI Tahlil"}
                  </button>
                  {individualAiResult && (
                    <>
                      <button onClick={() => exportToWord(individualAiResult, `${selectedResponse.user.firstName}_Tahlil`, `${selectedResponse.user.firstName} uchun Individual Xulosa`)} className="px-6 py-5 bg-blue-50 text-blue-800 rounded-2xl border border-blue-200">📄</button>
                      <button onClick={() => shareContent(individualAiResult, "Individual AI Xulosa")} className="px-6 py-5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200">📤</button>
                    </>
                  )}
                </div>
                {individualAiResult && <div className="p-8 bg-indigo-50/50 rounded-[2rem] text-sm whitespace-pre-wrap leading-relaxed shadow-inner border border-indigo-100 text-black font-bold">{individualAiResult}</div>}
              </div>
              <div className="space-y-6">
                <h4 className="font-black text-black uppercase text-xs tracking-widest border-b pb-2">Javoblar tafsiloti</h4>
                {SURVEY_QUESTIONS.map(q => (
                  <div key={q.id} className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <p className="text-sm font-bold text-black mb-4">{q.text[lang]}</p>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${selectedResponse.answers[q.id] >= 3 ? 'bg-red-600' : 'bg-black'}`}>{selectedResponse.answers[q.id]}</div>
                      <span className="font-black text-black uppercase text-xs">{RESPONSE_LABELS[lang][selectedResponse.answers[q.id]]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-10 border-t bg-gray-50"><button onClick={() => setSelectedResponse(null)} className="w-full py-5 bg-black text-white rounded-2xl font-black hover:bg-gray-900 transition shadow-lg">{t.close}</button></div>
          </div>
        </div>
      )}
    </div>
  );
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
      console.log("Sharing failed");
    }
  } else {
    await navigator.clipboard.writeText(cleanText);
    alert("Nusxalandi!");
  }
};

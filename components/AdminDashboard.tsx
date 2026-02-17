
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SurveyResponse, Language } from '../types';
import { TRANSLATIONS, SURVEY_QUESTIONS, RESPONSE_LABELS } from '../constants';
import { analyzeBullyingData } from '../services/geminiService';

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
  const t = TRANSLATIONS[lang];

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

  const handleExport = () => {
    const highRiskCount = sortedParticipants.filter(r => getAverageScore(r.answers) >= 2.5).length;
    const dateStr = new Date().toLocaleDateString();

    const tableRows = sortedParticipants.map(r => `
      <tr>
        <td style="border: 1px solid black; padding: 5px;">${r.user.firstName} ${r.user.lastName}</td>
        <td style="border: 1px solid black; padding: 5px;">${r.user.schoolNumber}</td>
        <td style="border: 1px solid black; padding: 5px;">${r.user.classNumber}-${r.user.classLetter}</td>
        <td style="border: 1px solid black; padding: 5px;">${new Date(r.timestamp).toLocaleDateString()}</td>
        <td style="border: 1px solid black; padding: 5px; text-align: center;">${getAverageScore(r.answers).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Bulling Monitoring Report</title>
        <style>
          body { font-family: 'Arial', sans-serif; }
          .header { text-align: center; color: #1e3a8a; }
          .stats { margin: 20px 0; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f3f4f6; border: 1px solid black; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GULISTON DAVLAT PEDAGOGIKA INSTITUTI</h1>
          <h2>Monitoring va tahlil tizimi hisoboti</h2>
        </div>
        <div class="stats">
          <p>Sana: ${dateStr}</p>
          <p>Jami ishtirokchilar: ${data.length}</p>
          <p>Yuqori xavf guruhidagi o'quvchilar soni: ${highRiskCount}</p>
        </div>
        <h3>Ishtirokchilar ro'yxati:</h3>
        <table>
          <thead>
            <tr>
              <th>F.I.SH.</th>
              <th>Maktab</th>
              <th>Sinf</th>
              <th>Sana</th>
              <th>Xavf koeffitsienti</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bulling_Hisobot_${dateStr}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    const highRiskCount = sortedParticipants.filter(r => getAverageScore(r.answers) >= 2.5).length;
    const shareText = `Monitoring Hisoboti (GulDPU):\nJami so'rovnomalar: ${data.length}\nYuqori xavf guruhi: ${highRiskCount} ta.\nSana: ${new Date().toLocaleDateString()}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bulling Monitoring Hisoboti',
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.error("Ulashishda xato:", err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert(t.copied);
    }
  };

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

  const getRiskBadge = (score: number) => {
    if (score >= 2.5) return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-tighter">{t.highRisk}</span>;
    if (score >= 1.5) return <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-tighter">{t.mediumRisk}</span>;
    return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-tighter">{t.lowRisk}</span>;
  };

  if (data.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center glass-morphism rounded-[3rem] shadow-2xl border border-white/50 fade-in">
        <div className={`text-7xl mb-6 ${isLoading ? 'animate-spin' : ''}`}>📉</div>
        <h2 className="text-3xl font-black mb-4 text-gray-800">{t.adminPanel}</h2>
        <p className="text-gray-500 text-lg mb-8">{isLoading ? 'Ma\'lumotlar yuklanmoqda...' : t.noData}</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button onClick={onRefresh} className="px-10 py-4 btn-primary text-white rounded-2xl font-black transition">
            Yangilash (Refresh)
          </button>
          <button onClick={onLogout} className="px-10 py-4 bg-gray-200 text-gray-700 rounded-2xl font-black transition hover:bg-gray-300">
            {t.back}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-10 pb-32 fade-in">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center glass-morphism p-10 rounded-[2.5rem] shadow-xl border border-white/50 gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 leading-tight">{t.adminPanel}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-3 h-3 bg-blue-500 rounded-full ${isLoading ? 'animate-ping' : ''}`}></span>
            <p className="text-blue-600 font-black text-sm uppercase tracking-widest">{t.totalSurveys}: {data.length}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 w-full xl:w-auto">
          <button onClick={onRefresh} className="px-6 py-4 bg-blue-100 text-blue-600 rounded-2xl font-bold hover:bg-blue-200 transition" title="Refresh">
             🔄
          </button>
          <button onClick={handleExport} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
             📄 <span className="hidden sm:inline">{t.exportData}</span>
          </button>
          <button onClick={handleShare} className="px-6 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
             📤 <span className="hidden sm:inline">{t.share}</span>
          </button>
          <button onClick={onLogout} className="px-6 py-4 bg-white/50 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition">
            {t.back}
          </button>
          <button onClick={onClear} className="col-span-2 sm:col-auto px-8 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-200">
            {t.deleteData}
          </button>
        </div>
      </div>

      {/* Statistika qismi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-morphism p-8 rounded-[2.5rem] shadow-lg border border-white/50">
          <h3 className="text-lg font-black mb-6 text-gray-800 border-l-4 border-blue-500 pl-4 uppercase tracking-tighter">{t.bullyingRisk} (Sinflar)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByClass}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="averageRisk" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-morphism p-8 rounded-[2.5rem] shadow-lg border border-white/50">
          <h3 className="text-lg font-black mb-6 text-gray-800 border-l-4 border-emerald-500 pl-4 uppercase tracking-tighter">O'quvchilar yoshi (Taqsimot)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsByAge}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip />
                <Area type="monotone" dataKey="talabalar" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorStudents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ishtirokchilar ro'yxati */}
      <div className="glass-morphism rounded-[2.5rem] shadow-xl border border-white/50 overflow-hidden">
        <div className="p-10 border-b border-white/50 flex justify-between items-center bg-white/30">
          <h3 className="text-2xl font-black text-gray-900">{t.participants}</h3>
          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-black uppercase">Kamayish tartibida</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">{t.firstName} {t.lastName}</th>
                <th className="px-10 py-6">{t.schoolNumber}</th>
                <th className="px-10 py-6">{t.classNumber}-{t.classLetter}</th>
                <th className="px-10 py-6">{t.submissionDate}</th>
                <th className="px-10 py-6 text-center">{t.riskLevel}</th>
                <th className="px-10 py-6 text-right">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedParticipants.map((r) => {
                const avgScore = getAverageScore(r.answers);
                const dateObj = new Date(r.timestamp);
                const formattedDate = dateObj.toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
                const formattedTime = dateObj.toLocaleTimeString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={r.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{r.user.firstName} {r.user.lastName}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{r.user.birthYear}-yil</div>
                    </td>
                    <td className="px-10 py-6 text-gray-600 font-medium">{r.user.schoolNumber}-maktab</td>
                    <td className="px-10 py-6 text-gray-600 font-medium">{r.user.classNumber}-{r.user.classLetter}</td>
                    <td className="px-10 py-6">
                      <div className="text-xs font-bold text-gray-700">{formattedDate}</div>
                      <div className="text-[10px] text-gray-400 font-black">{formattedTime}</div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getRiskBadge(avgScore)}
                        <span className="text-[10px] font-black text-gray-300">Score: {avgScore.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button 
                        onClick={() => setSelectedResponse(r)}
                        className="px-6 py-2 bg-white border border-gray-200 text-blue-600 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        {t.viewDetails}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Tahlili */}
      <div className="glass-morphism p-10 rounded-[2.5rem] shadow-xl border border-white/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <h3 className="text-3xl font-black text-gray-900 flex items-center gap-4">
            <span className="p-3 bg-indigo-100 rounded-2xl text-2xl">🤖</span> {t.aiAnalysis}
          </h3>
          <button
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-200"
          >
            {loadingAi ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "✨"}
            {t.analyzeWithAI}
          </button>
        </div>
        {aiAnalysis ? (
          <div className="prose max-w-none bg-white/40 p-10 rounded-[2rem] border border-white/60 whitespace-pre-wrap leading-relaxed text-gray-800 font-medium shadow-inner">
            {aiAnalysis}
          </div>
        ) : (
          <div className="text-center py-20 border-4 border-dashed border-gray-100 rounded-[2rem]">
            <p className="text-gray-400 font-black uppercase tracking-widest">Tizim tahlilga tayyor...</p>
          </div>
        )}
      </div>

      {/* Modal oyna qismi */}
      {selectedResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/20">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-3xl font-black text-gray-900">{t.detailsTitle}</h3>
                <p className="text-blue-600 font-bold mt-1 uppercase tracking-widest text-xs">{selectedResponse.user.firstName} {selectedResponse.user.lastName}</p>
              </div>
              <button onClick={() => setSelectedResponse(null)} className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all font-black">✕</button>
            </div>
            <div className="p-10 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6 text-sm bg-blue-50/50 p-8 rounded-3xl border border-blue-100">
                <div className="space-y-1">
                  <span className="font-black text-gray-400 uppercase text-[10px] block tracking-widest">{t.schoolNumber}</span> 
                  <span className="text-lg font-black text-blue-900">{selectedResponse.user.schoolNumber}-maktab</span>
                </div>
                <div className="space-y-1">
                  <span className="font-black text-gray-400 uppercase text-[10px] block tracking-widest">{t.classNumber}</span> 
                  <span className="text-lg font-black text-blue-900">{selectedResponse.user.classNumber}-{selectedResponse.user.classLetter} sinf</span>
                </div>
              </div>
              <div className="space-y-6">
                {SURVEY_QUESTIONS.map((q) => (
                  <div key={q.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-sm font-bold text-gray-600 mb-4 leading-relaxed">{q.text[lang]}</p>
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
              <button onClick={() => setSelectedResponse(null)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all">
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  
  const t = TRANSLATIONS[lang];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (text: string) => {
    const cleanText = text.replace(/[#*]/g, '');
    try {
      await navigator.clipboard.writeText(cleanText);
      alert(t.copied);
    } catch (err) {
      alert("Xatolik!");
    }
  };

  const shareContent = async (text: string, title: string) => {
    const cleanText = text.replace(/[#*]/g, '');
    if (navigator.share) {
      try {
        await navigator.share({ title, text: cleanText });
      } catch (err) { console.log("Share failed"); }
    } else {
      copyToClipboard(text);
    }
  };

  const exportToWord = (content: string, filename: string, titleSuffix: string = "") => {
    const formattedContent = content
      .replace(/^# (.*$)/gim, '<h1 style="color: #1e3a8a; font-family: Arial; text-align:center;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #1e3a8a; margin-top: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px;">$1</h2>')
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
          body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; padding: 40px; }
          .header { text-align: center; border-bottom: 3px double #1e3a8a; padding-bottom: 15px; margin-bottom: 30px; }
          .footer { margin-top: 50px; font-size: 10pt; color: #666; border-top: 1px solid #ddd; padding-top: 15px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin:0; font-size: 20pt; color: #1e3a8a;">${t.title}</h1>
          <p style="font-weight: bold; color: #3b82f6;">${t.subtitle}</p>
        </div>
        <h2 style="text-align: center; color: #1e3a8a;">${titleSuffix || "Monitoring Hisoboti"}</h2>
        <div class="content">${formattedContent}</div>
        <div class="footer">
          <p>Yaratilgan vaqt: ${new Date().toLocaleString()}</p>
          <p>© Guliston Davlat Pedagogika Instituti</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getRiskColor = (score: number) => {
    if (score >= 2.5) return '#ef4444'; 
    if (score >= 1.5) return '#f59e0b'; 
    return '#10b981'; 
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

  const groupedData = useMemo(() => {
    const schools: Record<string, Record<string, SurveyResponse[]>> = {};
    data.forEach(r => {
      const school = r.user.schoolNumber || 'Noma\'lum maktab';
      const className = `${r.user.classNumber}-${r.user.classLetter}`;
      if (!schools[school]) schools[school] = {};
      if (!schools[school][className]) schools[school][className] = [];
      schools[school][className].push(r);
    });
    return schools;
  }, [data]);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeBullyingData(data, lang);
      setAiAnalysis(result);
    } catch (e: any) {
      alert(`Xatolik: ${e.message}`);
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
    } catch (e: any) {
      alert(`Xatolik: ${e.message}`);
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
          <button 
            onClick={() => exportToWord(`## Monitoring Statistikasi\nJami so'rovnomalar: ${data.length}\n\nSinflar bo'yicha xavf tahlili tayyorlandi.`, "Monitoring_Umumiy", "Statistik Hisobot")}
            className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2"
          >
            📄 {t.exportData}
          </button>
          <button onClick={onRefresh} className="px-6 py-4 bg-blue-100 text-blue-700 rounded-2xl font-bold hover:bg-blue-200 transition">🔄</button>
          <button onClick={onLogout} className="px-6 py-4 bg-white/50 border border-gray-300 rounded-2xl font-bold text-black hover:bg-white transition">{t.back}</button>
          <button onClick={onClear} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition shadow-lg">{t.deleteData}</button>
        </div>
      </div>

      {/* Chart Section - Fixed Width/Height error by adding min-w-0 and fixed container height */}
      <div className="glass-morphism p-8 rounded-[2.5rem] shadow-lg border border-white/50">
        <h3 className="text-lg font-black mb-6 text-black border-l-4 border-red-600 pl-4 uppercase tracking-tighter">{t.bullyingRisk} (Sinflar)</h3>
        <div className="h-[400px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={statsByClass} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#000', fontWeight: 'bold', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#000', fontWeight: 'bold'}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#000'}} 
                itemStyle={{fontWeight: 'bold', color: '#000'}}
              />
              <Bar dataKey="averageRisk" radius={[8, 8, 0, 0]} barSize={50}>
                {statsByClass.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRiskColor(entry.averageRisk)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* View Switch */}
      <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner w-fit mx-auto">
        <button 
          onClick={() => setViewMode('list')}
          className={`px-8 py-3 rounded-xl font-bold text-xs transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t.listView}
        </button>
        <button 
          onClick={() => setViewMode('group')}
          className={`px-8 py-3 rounded-xl font-bold text-xs transition-all ${viewMode === 'group' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t.groupView}
        </button>
      </div>

      {/* Content Area */}
      {viewMode === 'list' ? (
        <div className="glass-morphism rounded-[2.5rem] shadow-xl border border-white/50 overflow-hidden fade-in">
          <div className="p-10 border-b flex justify-between items-center bg-white/30 text-2xl font-black text-black">{t.participants}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100/50 text-black uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-10 py-6">{t.firstName} {t.lastName}</th>
                  <th className="px-10 py-6">{t.schoolNumber}</th>
                  <th className="px-10 py-6">{t.classNumber}-{t.classLetter}</th>
                  <th className="px-10 py-6">{lang === 'uz' ? 'To\'ldirilgan sana' : 'Дата заполнения'}</th>
                  <th className="px-10 py-6 text-center">{t.riskLevel}</th>
                  <th className="px-10 py-6 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/80 transition-colors">
                    <td className="px-10 py-6 font-bold text-black">{r.user.firstName} {r.user.lastName}</td>
                    <td className="px-10 py-6 text-black font-medium">{r.user.schoolNumber}-maktab</td>
                    <td className="px-10 py-6 text-black font-medium">{r.user.classNumber}-{r.user.classLetter}</td>
                    <td className="px-10 py-6 text-black/60 text-[10px] font-bold">{formatDate(r.timestamp)}</td>
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
      ) : (
        <div className="space-y-6 fade-in">
          {Object.entries(groupedData).map(([school, classes]) => (
            <div key={school} className="glass-morphism rounded-[2.5rem] overflow-hidden border border-white/50 shadow-lg">
              <button 
                onClick={() => setExpandedSchool(expandedSchool === school ? null : school)}
                className="w-full p-8 flex justify-between items-center bg-white/40 hover:bg-white/60 transition"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-200">🏫</div>
                  <div className="text-left">
                    <h4 className="text-xl font-black text-black">{school}-maktab</h4>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{Object.keys(classes).length} {t.classes}</p>
                  </div>
                </div>
                <div className={`transition-transform duration-300 ${expandedSchool === school ? 'rotate-180' : ''}`}>▼</div>
              </button>
              {expandedSchool === school && (
                <div className="p-8 space-y-4 border-t border-white/40 bg-white/20">
                  {Object.entries(classes).map(([className, students]) => (
                    <div key={className} className="bg-white/60 rounded-3xl border border-white overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setExpandedClass(expandedClass === `${school}-${className}` ? null : `${school}-${className}`)}
                        className="w-full px-6 py-5 flex justify-between items-center hover:bg-white/80 transition"
                      >
                        <span className="text-sm font-black text-black">{className} sinf ({students.length} o'quvchi)</span>
                        <div className={`transition-transform duration-300 ${expandedClass === `${school}-${className}` ? 'rotate-180' : ''}`}>▼</div>
                      </button>
                      {expandedClass === `${school}-${className}` && (
                        <div className="px-6 pb-6 pt-2 divide-y divide-gray-100 fade-in">
                          {students.map(student => (
                            <div key={student.id} className="py-4 flex justify-between items-center">
                              <div className="flex flex-col">
                                <span className="font-bold text-black">{student.user.firstName} {student.user.lastName}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">{formatDate(student.timestamp)}</span>
                              </div>
                              <button 
                                onClick={() => setSelectedResponse(student)}
                                className="px-4 py-2 bg-gray-100 hover:bg-black hover:text-white transition rounded-xl text-[10px] font-black uppercase"
                              >
                                {t.viewDetails}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis Section */}
      <div className="glass-morphism p-10 rounded-[2.5rem] shadow-xl border border-white/50">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <h3 className="text-3xl font-black text-black flex items-center gap-4">
            <span className="p-3 bg-indigo-100 rounded-2xl text-2xl">🤖</span> {t.aiAnalysis}
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAiAnalysis}
              disabled={loadingAi}
              className="px-10 py-4 bg-indigo-700 text-white rounded-2xl font-black hover:bg-indigo-800 transition flex items-center gap-3 shadow-lg disabled:bg-indigo-300"
            >
              {loadingAi ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "✨"}
              {loadingAi ? t.loading : t.analyzeWithAI}
            </button>
            {aiAnalysis && (
              <div className="flex bg-white/50 border border-indigo-100 rounded-2xl p-1 gap-1">
                <button onClick={() => copyToClipboard(aiAnalysis)} className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-bold border border-indigo-50 shadow-sm">📋 Nusxa</button>
                <button onClick={() => exportToWord(aiAnalysis, "AI_Monitoring_Xulosasi", "AI Tahliliy Hisoboti")} className="px-6 py-3 bg-blue-100 text-blue-800 rounded-xl font-bold border border-blue-200 shadow-sm">📄 Word</button>
                <button onClick={() => shareContent(aiAnalysis, "AI Monitoring Xulosasi")} className="px-6 py-3 bg-emerald-100 text-emerald-800 rounded-xl font-bold border border-emerald-200 shadow-sm">📤 Ulashish</button>
              </div>
            )}
          </div>
        </div>
        {aiAnalysis && (
          <div className="prose max-w-none bg-white p-10 rounded-[2rem] border border-gray-200 whitespace-pre-wrap text-black font-bold fade-in shadow-inner overflow-y-auto max-h-[600px] custom-scrollbar leading-relaxed">
            {aiAnalysis}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col border border-gray-100">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50">
              <div className="flex flex-col">
                <h3 className="text-3xl font-black text-black">{selectedResponse.user.firstName} {selectedResponse.user.lastName}</h3>
                <span className="text-xs font-black text-blue-600 mt-1 uppercase tracking-widest">{t.submissionDate}: {formatDate(selectedResponse.timestamp)}</span>
              </div>
              <button onClick={() => setSelectedResponse(null)} className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 rounded-2xl transition font-black text-black">✕</button>
            </div>
            <div className="p-10 overflow-y-auto space-y-8 custom-scrollbar">
              <button onClick={handleIndividualAi} disabled={loadingIndividualAi} className="w-full py-5 bg-indigo-700 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-800 transition disabled:bg-indigo-300">
                {loadingIndividualAi ? "Tahlil qilinmoqda..." : "✨ Individual AI Tahlil"}
              </button>
              {individualAiResult && (
                <div className="space-y-3">
                  <div className="p-8 bg-indigo-50/50 rounded-[2rem] text-sm whitespace-pre-wrap leading-relaxed shadow-inner border border-indigo-100 text-black font-bold">
                    {individualAiResult}
                  </div>
                  <div className="flex bg-white border border-indigo-100 rounded-2xl p-1 gap-1">
                    <button onClick={() => copyToClipboard(individualAiResult)} className="flex-1 py-3 bg-white text-indigo-700 rounded-xl font-bold border border-indigo-50">📋 Nusxa</button>
                    <button onClick={() => exportToWord(individualAiResult, `${selectedResponse.user.firstName}_AI_Xulosa`, "Individual Tahlil")} className="flex-1 py-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">📄 Word</button>
                    <button onClick={() => shareContent(individualAiResult, "Individual AI Xulosa")} className="flex-1 py-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">📤 Ulashish</button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <h4 className="font-black text-black uppercase text-xs tracking-widest border-b pb-2">Javoblar ro'yxati</h4>
                {SURVEY_QUESTIONS.map(q => (
                  <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <p className="text-sm font-bold text-gray-800 leading-snug">{q.text[lang]}</p>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-lg font-black text-xs">{selectedResponse.answers[q.id]}</span>
                      <span className="text-[10px] font-black uppercase text-gray-500">{RESPONSE_LABELS[lang][selectedResponse.answers[q.id]]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-10 border-t bg-gray-50">
              <button onClick={() => setSelectedResponse(null)} className="w-full py-5 bg-black text-white rounded-2xl font-black hover:bg-gray-900 transition shadow-lg">{t.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

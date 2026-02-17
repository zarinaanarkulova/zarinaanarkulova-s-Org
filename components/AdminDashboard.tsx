
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { SurveyResponse, Language } from '../types';
import { TRANSLATIONS, SURVEY_QUESTIONS, RESPONSE_LABELS } from '../constants';
import { analyzeBullyingData } from '../services/geminiService';

interface Props {
  data: SurveyResponse[];
  lang: Language;
  onClear: () => void;
  onLogout: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const AdminDashboard: React.FC<Props> = ({ data, lang, onClear, onLogout }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const t = TRANSLATIONS[lang];

  // Statistika: Sinflar bo'yicha
  const statsByClass = useMemo(() => {
    const map: Record<string, { name: string; score: number; count: number }> = {};
    data.forEach(r => {
      const key = `${r.user.classNumber}-${r.user.classLetter}`;
      if (!map[key]) map[key] = { name: key, score: 0, count: 0 };
      const avg = Object.values(r.answers).reduce((a, b) => a + b, 0) / Object.values(r.answers).length;
      map[key].score += avg;
      map[key].count += 1;
    });
    return Object.values(map).map(v => ({
      name: v.name,
      averageRisk: Number((v.score / v.count).toFixed(2))
    })).sort((a, b) => b.averageRisk - a.averageRisk);
  }, [data]);

  // Statistika: Tug'ilgan yillar bo'yicha
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

  // Statistika: Maktablar bo'yicha
  const statsBySchool = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => {
      map[r.user.schoolNumber] = (map[r.user.schoolNumber] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: `${name}-maktab`, value }));
  }, [data]);

  const handleAiAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeBullyingData(data, lang);
      setAiAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-3xl shadow-2xl border border-gray-100">
        <div className="text-6xl mb-6">📊</div>
        <h2 className="text-3xl font-bold mb-4 text-gray-800">{t.adminPanel}</h2>
        <p className="text-gray-500 text-lg mb-8">{t.noData}</p>
        <button onClick={onLogout} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-32 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 leading-none">{t.adminPanel}</h2>
          <p className="text-blue-600 font-semibold mt-2">{t.totalSurveys}: {data.length}</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={onLogout} className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition">
            {t.back}
          </button>
          <button onClick={() => { if(window.confirm(t.confirmDelete)) onClear(); }} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-200">
            {t.deleteData}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-8 text-gray-800 border-l-4 border-blue-500 pl-4">{t.bullyingRisk} (Sinflar bo'yicha)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByClass}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Bar dataKey="averageRisk" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-8 text-gray-800 border-l-4 border-emerald-500 pl-4">Ishtirokchilar yoshi</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsByAge}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="talabalar" stroke="#10b981" fillOpacity={1} fill="url(#colorStudents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b">
          <h3 className="text-xl font-bold text-gray-800">{t.participants}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-8 py-4">{t.firstName}</th>
                <th className="px-8 py-4">{t.lastName}</th>
                <th className="px-8 py-4">{t.schoolNumber}</th>
                <th className="px-8 py-4">{t.classNumber}-{t.classLetter}</th>
                <th className="px-8 py-4 text-center">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50/30 transition">
                  <td className="px-8 py-4 font-medium text-gray-800">{r.user.firstName}</td>
                  <td className="px-8 py-4 text-gray-600">{r.user.lastName}</td>
                  <td className="px-8 py-4 text-gray-600">{r.user.schoolNumber}</td>
                  <td className="px-8 py-4 text-gray-600">{r.user.classNumber}-{r.user.classLetter}</td>
                  <td className="px-8 py-4 text-center">
                    <button 
                      onClick={() => setSelectedResponse(r)}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-600 hover:text-white transition"
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

      {/* AI Analysis */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <span className="p-2 bg-indigo-100 rounded-lg">✨</span> {t.aiAnalysis}
          </h3>
          <button
            onClick={handleAiAnalysis}
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
            {t.analyzeWithAI}
          </button>
        </div>
        {aiAnalysis ? (
          <div className="prose max-w-none bg-indigo-50/50 p-8 rounded-2xl border border-indigo-100 whitespace-pre-wrap leading-relaxed text-gray-800">
            {aiAnalysis}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
            <p className="text-gray-400">Tahlil uchun tugmani bosing</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-2xl font-black text-gray-900">{t.detailsTitle}</h3>
                <p className="text-gray-500">{selectedResponse.user.firstName} {selectedResponse.user.lastName}</p>
              </div>
              <button onClick={() => setSelectedResponse(null)} className="p-2 hover:bg-gray-200 rounded-full transition">✕</button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 text-sm bg-blue-50 p-6 rounded-2xl">
                <div><span className="font-bold text-gray-500 uppercase text-xs block">{t.schoolNumber}</span> {selectedResponse.user.schoolNumber}-maktab</div>
                <div><span className="font-bold text-gray-500 uppercase text-xs block">{t.classNumber}</span> {selectedResponse.user.classNumber}-{selectedResponse.user.classLetter} sinf</div>
                <div><span className="font-bold text-gray-500 uppercase text-xs block">{t.birthYear}</span> {selectedResponse.user.birthYear}-yil</div>
              </div>
              <div className="space-y-4">
                {SURVEY_QUESTIONS.map((q) => (
                  <div key={q.id} className="p-4 border border-gray-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">{q.text[lang]}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                        {selectedResponse.answers[q.id]}
                      </div>
                      <span className="font-bold text-blue-900">
                        {RESPONSE_LABELS[lang][selectedResponse.answers[q.id]]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 border-t">
              <button onClick={() => setSelectedResponse(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold">{t.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

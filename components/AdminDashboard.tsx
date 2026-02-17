import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { SurveyResponse, Language } from '../types';
import { TRANSLATIONS } from '../constants';
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
        <button onClick={onLogout} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition transform hover:scale-105">
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-32 fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 leading-none">{t.adminPanel}</h2>
          <p className="text-blue-600 font-semibold mt-2">{t.totalSurveys}: {data.length}</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={onLogout} 
            className="flex-1 md:flex-none px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            Chiqish
          </button>
          <button 
            onClick={() => { if(window.confirm(t.confirmDelete)) onClear(); }} 
            className="flex-1 md:flex-none px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-200"
          >
            {t.deleteData}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Class Risk Bar Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-8 text-gray-800 border-l-4 border-blue-500 pl-4">{t.bullyingRisk} (Sinflar)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByClass} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="averageRisk" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Distribution Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-8 text-gray-800 border-l-4 border-emerald-500 pl-4">Yoshi bo'yicha qamrov</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsByAge}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="talabalar" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Schools Pie Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-8 text-gray-800 border-l-4 border-amber-500 pl-4">Maktablar ulushi</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsBySchool}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statsBySchool.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-indigo-100 rounded-lg">✨</span> {t.aiAnalysis}
            </h3>
            <button
              onClick={handleAiAnalysis}
              disabled={loading}
              className={`w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t.loading}</span>
                </div>
              ) : t.analyzeWithAI}
            </button>
          </div>

          <div className="relative">
            {aiAnalysis ? (
              <div className="prose max-w-none bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100 whitespace-pre-wrap leading-relaxed text-gray-800 shadow-inner">
                {aiAnalysis}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-2xl">
                <p className="text-gray-400 italic">Ma'lumotlarni tahlil qilish uchun AI tugmasini bosing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
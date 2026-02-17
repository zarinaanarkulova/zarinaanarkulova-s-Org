
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { SurveyResponse, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { analyzeBullyingData } from '../services/geminiService';

interface Props {
  data: SurveyResponse[];
  lang: Language;
  onClear: () => void;
  onLogout: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AdminDashboard: React.FC<Props> = ({ data, lang, onClear, onLogout }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = TRANSLATIONS[lang];

  const statsByClass = useMemo(() => {
    const map: Record<string, { name: string; score: number; count: number }> = {};
    data.forEach(r => {
      const key = `${r.user.classNumber}${r.user.classLetter}`;
      if (!map[key]) map[key] = { name: key, score: 0, count: 0 };
      const avg = Object.values(r.answers).reduce((a, b) => a + b, 0) / Object.values(r.answers).length;
      map[key].score += avg;
      map[key].count += 1;
    });
    return Object.values(map).map(v => ({
      name: v.name,
      averageRisk: Number((v.score / v.count).toFixed(2))
    }));
  }, [data]);

  const statsBySchool = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => {
      map[r.user.schoolNumber] = (map[r.user.schoolNumber] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: `${name}-maktab`, value }));
  }, [data]);

  const handleAiAnalysis = async () => {
    setLoading(true);
    const result = await analyzeBullyingData(data, lang);
    setAiAnalysis(result);
    setLoading(false);
  };

  if (data.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{t.adminPanel}</h2>
        <p className="text-gray-500">{t.noData}</p>
        <button onClick={onLogout} className="mt-4 text-blue-600 underline">{t.back}</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t.adminPanel}</h2>
          <p className="text-gray-500">{t.totalSurveys}: {data.length}</p>
        </div>
        <div className="space-x-4">
          <button 
            onClick={onLogout} 
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Chiqish
          </button>
          <button 
            onClick={() => { if(window.confirm(t.confirmDelete)) onClear(); }} 
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            {t.deleteData}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6">{t.bullyingRisk} (Sinflar bo'yicha)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByClass}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageRisk" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Maktablar qamrovi</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsBySchool}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
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
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">✨</span> {t.aiAnalysis}
          </h3>
          <button
            onClick={handleAiAnalysis}
            disabled={loading}
            className={`px-6 py-2 bg-indigo-600 text-white rounded-full font-medium shadow-md hover:bg-indigo-700 transition flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? t.loading : t.analyzeWithAI}
          </button>
        </div>

        {aiAnalysis ? (
          <div className="prose max-w-none bg-indigo-50 p-6 rounded-xl border border-indigo-100 whitespace-pre-wrap leading-relaxed text-gray-700">
            {aiAnalysis}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 italic">
            AI tahlili uchun yuqoridagi tugmani bosing
          </div>
        )}
      </div>
    </div>
  );
};

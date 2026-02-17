
import React, { useState, useEffect } from 'react';
import { View, Language, UserRegistration, SurveyResponse } from './types';
import { TRANSLATIONS, ADMIN_INFO, SURVEY_QUESTIONS, ADMIN_PASSWORD } from './constants';
import { LanguageSelector } from './components/LanguageSelector';
import { AdminDashboard } from './components/AdminDashboard';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Home);
  const [lang, setLang] = useState<Language>('uz');
  const [userData, setUserData] = useState<UserRegistration | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, number>>({});
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = TRANSLATIONS[lang];

  const fetchResponses = async () => {
    setIsLoading(true);
    try {
      const { data, error: sbError } = await supabase
        .from('bullying_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) {
        console.error('Supabase xatosi:', sbError);
        setError(`Ma'lumotlar bazasi bilan aloqa xatosi: ${sbError.message}`);
      } else if (data) {
        const mapped: SurveyResponse[] = data.map(row => ({
          id: row.id,
          timestamp: new Date(row.created_at).getTime(),
          user: {
            firstName: row.first_name,
            lastName: row.last_name,
            birthYear: row.birth_year,
            schoolNumber: row.school_number,
            classNumber: row.class_number,
            classLetter: row.class_letter,
          } as UserRegistration,
          answers: row.answers,
        }));
        setResponses(mapped);
        setError('');
      }
    } catch (err: any) {
      console.error('Kutilmagan xato:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: UserRegistration = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      birthYear: parseInt(formData.get('birthYear') as string),
      schoolNumber: formData.get('schoolNumber') as string,
      classNumber: formData.get('classNumber') as string,
      classLetter: formData.get('classLetter') as string,
    };
    setUserData(data);
    setView(View.Survey);
  };

  const handleSurveySubmit = async () => {
    if (!userData) return;
    
    const answeredCount = Object.keys(currentAnswers).length;
    if (answeredCount < SURVEY_QUESTIONS.length) {
      alert(lang === 'uz' ? `Iltimos, barcha savollarga javob bering!` : `Пожалуйста, ответьте на все вопросы!`);
      return;
    }

    setIsLoading(true);
    try {
      const { error: sbError } = await supabase
        .from('bullying_responses')
        .insert([{
          first_name: userData.firstName,
          last_name: userData.lastName,
          birth_year: userData.birthYear,
          school_number: userData.schoolNumber,
          class_number: userData.classNumber,
          class_letter: userData.classLetter,
          answers: currentAnswers
        }]);

      if (sbError) {
        console.error('Yuborishda xatolik:', sbError);
        alert(`Ma'lumot saqlanmadi: ${sbError.message}`);
      } else {
        alert(t.thankYou);
        await fetchResponses();
        setView(View.Home);
        setUserData(null);
        setCurrentAnswers({});
      }
    } catch (err: any) {
      alert(`Xatolik yuz berdi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setView(View.AdminDashboard);
      setError('');
      fetchResponses();
    } else {
      setError(t.wrongPassword);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <header className="bg-white/95 border-b border-blue-100 py-6 px-4 text-center sticky top-0 z-50 shadow-sm glass-morphism">
        <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight uppercase mb-1">
          {t.title}
        </h1>
        <p className="text-blue-600 font-bold text-xs tracking-widest uppercase opacity-80">{t.subtitle}</p>
      </header>

      {error && (
        <div className="bg-red-500 text-white text-center py-2 font-bold text-xs animate-pulse">
          {error}
        </div>
      )}

      <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
        {view === View.Home && (
          <div className="max-w-md w-full glass-morphism rounded-[2rem] shadow-2xl p-10 text-center space-y-8 border border-white/50 fade-in">
            <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
              <span className="text-4xl">🎓</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">Xush kelibsiz!</h2>
              <p className="text-gray-500 text-sm">Maktabda xavfsiz muhit yaratishga yordam bering</p>
            </div>
            <LanguageSelector current={lang} onSelect={setLang} />
            <div className="space-y-4 pt-4">
              <button
                onClick={() => setView(View.Register)}
                className="w-full btn-primary text-white py-4 rounded-xl font-bold text-lg"
              >
                {t.startSurvey}
              </button>
              <button
                onClick={() => setView(View.AdminLogin)}
                className="w-full text-blue-600 font-bold py-2 hover:bg-white/40 rounded-lg transition text-sm"
              >
                {t.adminLogin}
              </button>
            </div>
          </div>
        )}

        {view === View.Register && (
          <div className="max-w-2xl w-full glass-morphism rounded-[2rem] shadow-2xl p-8 md:p-12 fade-in border border-white/50">
            <h2 className="text-2xl font-black mb-8 text-gray-900 flex items-center gap-3">
              <span className="text-blue-500">📝</span> {t.registerTitle}
            </h2>
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: t.firstName, name: 'firstName', type: 'text' },
                { label: t.lastName, name: 'lastName', type: 'text' },
                { label: t.birthYear, name: 'birthYear', type: 'number', placeholder: '2010' },
                { label: t.schoolNumber, name: 'schoolNumber', type: 'text' },
                { label: t.classNumber, name: 'classNumber', type: 'text' },
                { label: t.classLetter, name: 'classLetter', type: 'text', placeholder: 'A, B...' }
              ].map((input) => (
                <div key={input.name} className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{input.label}</label>
                  <input 
                    required 
                    type={input.type}
                    name={input.name} 
                    placeholder={input.placeholder}
                    autoComplete="off"
                    className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition text-black font-extrabold shadow-sm" 
                  />
                </div>
              ))}
              <div className="md:col-span-2 pt-6 flex gap-4">
                <button type="button" onClick={() => setView(View.Home)} className="flex-1 py-4 border border-gray-300 rounded-xl font-bold text-gray-500 hover:bg-white/40 transition">{t.back}</button>
                <button type="submit" className="flex-[2] btn-primary text-white py-4 rounded-xl font-bold shadow-lg">{t.next}</button>
              </div>
            </form>
          </div>
        )}

        {view === View.Survey && (
          <div className="max-w-3xl w-full glass-morphism rounded-[2rem] shadow-2xl p-8 md:p-10 fade-in border border-white/50">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                <span>Savollar</span>
                <span>{Math.round((Object.keys(currentAnswers).length / SURVEY_QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-white/40 rounded-full overflow-hidden border border-white/40">
                <div 
                  className="h-full bg-blue-500 transition-all duration-700 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${(Object.keys(currentAnswers).length / SURVEY_QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-10 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
              {SURVEY_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="pb-8 border-b border-gray-200/40 last:border-0">
                  <p className="text-base font-bold text-gray-800 mb-5 leading-snug">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs mr-3 font-black">{idx + 1}</span>
                    {q.text[lang]}
                  </p>
                  <div className="flex justify-between items-center gap-2">
                    {[0, 1, 2, 3, 4].map((score) => (
                      <button
                        key={score}
                        onClick={() => setCurrentAnswers(prev => ({ ...prev, [q.id]: score }))}
                        className={`flex-1 py-4 rounded-xl border-2 font-black text-sm transition-all ${
                          currentAnswers[q.id] === score 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105' 
                          : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:text-blue-400 shadow-sm'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4">
              <button onClick={() => setView(View.Register)} className="flex-1 border border-gray-300 py-4 rounded-xl font-bold text-gray-500 hover:bg-white/40 transition">{t.back}</button>
              <button 
                onClick={handleSurveySubmit} 
                className={`flex-[2] py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-3 ${
                  isLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600 active:scale-95'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     {t.loading}
                   </>
                ) : t.submit}
              </button>
            </div>
          </div>
        )}

        {view === View.AdminLogin && (
          <div className="max-w-md w-full glass-morphism rounded-[2rem] shadow-2xl p-10 fade-in border border-white/50">
            <h2 className="text-2xl font-black mb-8 text-gray-900 border-b border-gray-100 pb-4">{t.adminLogin}</h2>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t.password}</label>
                <input 
                  type="password" 
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full bg-white border-2 border-blue-50 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 outline-none transition text-black font-extrabold"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setView(View.Home)} className="flex-1 border border-gray-300 py-4 rounded-xl font-bold text-gray-500 hover:bg-white/40 transition">{t.back}</button>
                <button type="submit" className="flex-1 bg-gray-800 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg">{t.next}</button>
              </div>
            </form>
          </div>
        )}

        {view === View.AdminDashboard && (
          <AdminDashboard 
            data={responses} 
            lang={lang} 
            onClear={() => { fetchResponses(); }} 
            onRefresh={fetchResponses}
            isLoading={isLoading}
            onLogout={() => { setView(View.Home); setAdminPass(''); }} 
          />
        )}
      </main>

      <footer className="bg-white/90 backdrop-blur-md border-t border-blue-50 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="font-bold text-gray-800 text-sm">Admin: {ADMIN_INFO.name}</p>
            <p className="text-blue-500 font-medium text-xs">{ADMIN_INFO.email}</p>
          </div>
          <p className="text-gray-500 font-bold text-[10px] tracking-widest uppercase opacity-60">
            &copy; {new Date().getFullYear()} Guliston Davlat Pedagogika Instituti
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;

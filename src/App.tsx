
import React, { useState, useEffect } from 'react';
import { View, Language, UserRegistration, SurveyResponse } from './types';
import { TRANSLATIONS, ADMIN_INFO, SURVEY_QUESTIONS, ADMIN_PASSWORD, RESPONSE_LABELS } from './constants';
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
        throw sbError;
      } 
      
      if (data) {
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
          answers: row.answers || {},
        }));
        setResponses(mapped);
        setError('');
      } else {
        setResponses([]);
      }
    } catch (err: any) {
      console.error('Bazadan yuklashda xato:', err);
      setError(`Ma'lumotlar bazasi xatosi: ${err.message || 'Noma\'lum xatolik'}`);
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

      if (sbError) throw sbError;

      alert(t.thankYou);
      await fetchResponses();
      setView(View.Home);
      setUserData(null);
      setCurrentAnswers({});
    } catch (err: any) {
      console.error('Yuborishda xato:', err);
      alert(`Ma'lumot saqlanmadi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm(t.confirmDelete)) return;
    
    setIsLoading(true);
    try {
      // Barcha qatorlarni o'chirish uchun filtrsiz delete ishlatiladi (faqat test yoki admin uchun)
      const { error: sbError } = await supabase
        .from('bullying_responses')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); 

      if (sbError) throw sbError;
      
      alert(lang === 'uz' ? "Barcha ma'lumotlar o'chirildi" : "Все данные удалены");
      await fetchResponses();
    } catch (err: any) {
      console.error('O\'chirishda xato:', err);
      alert(`O'chirishda xatolik yuz berdi: ${err.message}`);
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
      <header className="bg-white/80 backdrop-blur-md border-b-4 border-blue-600 py-8 px-4 text-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-3xl">🏫</span>
          <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 tracking-tight uppercase">
            {t.title}
          </h1>
        </div>
        <p className="text-blue-700 font-bold text-[10px] tracking-[0.3em] uppercase opacity-90">{t.subtitle}</p>
      </header>

      {error && (
        <div className="bg-red-500 text-white text-center py-2 font-bold text-xs animate-pulse sticky top-[100px] z-[60]">
          {error}
        </div>
      )}

      <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
        {view === View.Home && (
          <div className="max-w-md w-full glass-card rounded-[2.5rem] p-12 text-center space-y-10 fade-in border-t-8 border-blue-600">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl border-2 border-blue-100 rotate-3 hover:rotate-0 transition-transform duration-500">
              <span className="text-5xl">📚</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-display font-bold text-slate-900">Xush kelibsiz!</h2>
              <p className="text-slate-600 text-sm font-bold leading-relaxed">
                Guliston Davlat Pedagogika Instituti qoshidagi bulling monitoring tizimi. 
                Sizning xavfsizligingiz - bizning ustuvor vazifamiz.
              </p>
            </div>
            <LanguageSelector current={lang} onSelect={setLang} />
            <div className="space-y-4 pt-6">
              <button
                onClick={() => setView(View.Register)}
                className="w-full btn-primary"
              >
                {t.startSurvey}
              </button>
              <button
                onClick={() => setView(View.AdminLogin)}
                className="w-full text-slate-400 font-bold py-2 hover:text-slate-900 transition-colors text-xs uppercase tracking-widest"
              >
                {t.adminLogin}
              </button>
            </div>
          </div>
        )}

        {view === View.Register && (
          <div className="max-w-2xl w-full glass-card rounded-[2.5rem] p-10 md:p-16 fade-in">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-black text-slate-900 mb-2">
                {t.registerTitle}
              </h2>
              <p className="text-slate-500 text-sm">Iltimos, ma'lumotlaringizni kiriting</p>
            </div>
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: t.firstName, name: 'firstName', type: 'text' },
                { label: t.lastName, name: 'lastName', type: 'text' },
                { label: t.birthYear, name: 'birthYear', type: 'number', placeholder: '2010' },
                { label: t.schoolNumber, name: 'schoolNumber', type: 'text' },
                { label: t.classNumber, name: 'classNumber', type: 'text' },
                { label: t.classLetter, name: 'classLetter', type: 'text', placeholder: 'A, B...' }
              ].map((input) => (
                <div key={input.name} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center">{input.label}</label>
                  <input 
                    required 
                    type={input.type}
                    name={input.name} 
                    placeholder={input.placeholder}
                    autoComplete="off"
                    className="input-field" 
                  />
                </div>
              ))}
              <div className="md:col-span-2 pt-10 flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={() => setView(View.Home)} className="flex-1 py-4 px-8 rounded-2xl font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase text-xs tracking-widest">{t.back}</button>
                <button type="submit" className="flex-[2] btn-primary">{t.next}</button>
              </div>
            </form>
          </div>
        )}

        {view === View.Survey && (
          <div className="max-w-3xl w-full glass-card rounded-[2.5rem] p-8 md:p-12 fade-in">
            <div className="mb-12 text-center">
              <div className="flex justify-between items-center mb-4 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                <span>Savollar</span>
                <span>{Math.round((Object.keys(currentAnswers).length / SURVEY_QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-700 shadow-lg shadow-blue-600/20" 
                  style={{ width: `${(Object.keys(currentAnswers).length / SURVEY_QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-12 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
              {SURVEY_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="pb-10 border-b border-slate-100 last:border-0 text-center">
                  <p className="text-lg font-bold text-slate-800 mb-8 leading-relaxed">
                    {q.text[lang]}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {RESPONSE_LABELS[lang].map((label, score) => (
                      <button
                        key={score}
                        onClick={() => setCurrentAnswers(prev => ({ ...prev, [q.id]: score }))}
                        className={`py-5 px-3 rounded-2xl border-2 font-bold text-xs transition-all duration-200 ${
                          currentAnswers[q.id] === score 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20 scale-105' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <button onClick={() => setView(View.Register)} className="flex-1 py-4 px-8 rounded-2xl font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase text-xs tracking-widest">{t.back}</button>
              <button 
                onClick={handleSurveySubmit} 
                className={`flex-[2] btn-primary flex items-center justify-center gap-3 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
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
            onClear={handleClearData} 
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

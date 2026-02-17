
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
    try {
      const { data, error } = await supabase
        .from('bullying_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

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
          answers: row.answers,
        }));
        setResponses(mapped);
      }
    } catch (err: any) {
      console.error('Data fetch error:', err);
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
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('bullying_responses')
        .insert([{
          first_name: userData.firstName,
          lastName: userData.lastName, // Ensure your DB columns match!
          last_name: userData.lastName,
          birth_year: userData.birthYear,
          school_number: userData.schoolNumber,
          class_number: userData.classNumber,
          class_letter: userData.classLetter,
          answers: currentAnswers
        }])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        alert(`Xatolik: ${error.message}\nKodi: ${error.code}`);
      } else {
        alert(t.thankYou);
        await fetchResponses();
        setView(View.Home);
        setUserData(null);
        setCurrentAnswers({});
      }
    } catch (err: any) {
      alert(`Kutilmagan xato: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setView(View.AdminDashboard);
      setError('');
    } else {
      setError(t.wrongPassword);
    }
  };

  const clearData = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from('bullying_responses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      alert('Ma\'mulotlarni o\'chirishda xatolik: ' + error.message);
    } else {
      setResponses([]);
      alert('Barcha ma\'lumotlar o\'chirildi');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b py-8 px-4 text-center sticky top-0 z-50 glass-morphism">
        <h1 className="text-xl md:text-3xl font-black text-blue-900 tracking-tighter uppercase mb-2">
          {t.title}
        </h1>
        <div className="h-1 w-24 bg-blue-600 mx-auto mb-3 rounded-full"></div>
        <p className="text-gray-500 font-bold text-sm tracking-widest">{t.subtitle}</p>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
        {view === View.Home && (
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center space-y-8 border border-gray-100 fade-in">
            <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl rotate-3">
              <span className="text-4xl text-white">📊</span>
            </div>
            <LanguageSelector current={lang} onSelect={setLang} />
            <div className="space-y-4 pt-4">
              <button
                onClick={() => setView(View.Register)}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 transition shadow-xl shadow-blue-100"
              >
                {t.startSurvey}
              </button>
              <button
                onClick={() => setView(View.AdminLogin)}
                className="w-full text-blue-600 font-bold py-3 hover:bg-blue-50 rounded-xl transition"
              >
                {t.adminLogin}
              </button>
            </div>
          </div>
        )}

        {view === View.Register && (
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 fade-in border border-gray-100">
            <h2 className="text-3xl font-black mb-8 text-gray-900 border-b pb-4">{t.registerTitle}</h2>
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.firstName}</label>
                <input required name="firstName" className="w-full border-2 border-gray-100 rounded-xl p-4 focus:border-blue-500 outline-none transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.lastName}</label>
                <input required name="lastName" className="w-full border-2 border-gray-100 rounded-xl p-4 focus:border-blue-500 outline-none transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.birthYear}</label>
                <input required type="number" name="birthYear" placeholder="2010" className="w-full border-2 border-gray-100 rounded-xl p-4 focus:border-blue-500 outline-none transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.schoolNumber}</label>
                <input required name="schoolNumber" className="w-full border-2 border-gray-100 rounded-xl p-4 focus:border-blue-500 outline-none transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.classNumber}</label>
                <input required name="classNumber" className="w-full border-2 border-gray-100 rounded-xl p-4 focus:border-blue-500 outline-none transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.classLetter}</label>
                <input required name="classLetter" placeholder="A, B, C..." className="w-full border-2 border-gray-100 rounded-xl p-4 focus:border-blue-500 outline-none transition uppercase" />
              </div>
              <div className="md:col-span-2 pt-8 flex gap-6">
                <button type="button" onClick={() => setView(View.Home)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-500">{t.back}</button>
                <button type="submit" className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100">{t.next}</button>
              </div>
            </form>
          </div>
        )}

        {view === View.Survey && (
          <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-10 fade-in border border-gray-100">
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3 text-xs font-black text-blue-600 uppercase tracking-widest">
                <span>Progress</span>
                <span>{Math.round((Object.keys(currentAnswers).length / SURVEY_QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                  style={{ width: `${(Object.keys(currentAnswers).length / SURVEY_QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-12 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {SURVEY_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="pb-12 border-b border-gray-50 last:border-0">
                  <p className="text-lg font-bold text-gray-800 mb-6 leading-relaxed">
                    <span className="text-blue-500 mr-2">{idx + 1}.</span>
                    {q.text[lang]}
                  </p>
                  <div className="grid grid-cols-5 gap-3">
                    {[0, 1, 2, 3, 4].map((score) => (
                      <button
                        key={score}
                        onClick={() => setCurrentAnswers(prev => ({ ...prev, [q.id]: score }))}
                        className={`py-4 rounded-2xl border-2 font-black transition-all ${
                          currentAnswers[q.id] === score 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg -translate-y-1' 
                          : 'border-gray-100 text-gray-300 hover:border-blue-200 hover:text-blue-500'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    <span>{lang === 'uz' ? 'Hech qachon' : 'Никогда'}</span>
                    <span>{lang === 'uz' ? 'Har doim' : 'Всегда'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex gap-6">
              <button onClick={() => setView(View.Register)} className="flex-1 border-2 py-4 rounded-2xl font-bold text-gray-500">{t.back}</button>
              <button 
                onClick={handleSurveySubmit} 
                disabled={Object.keys(currentAnswers).length < SURVEY_QUESTIONS.length || isLoading}
                className={`flex-[2] py-4 rounded-2xl font-black text-white transition-all ${
                  (Object.keys(currentAnswers).length < SURVEY_QUESTIONS.length || isLoading)
                  ? 'bg-gray-200 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100'
                }`}
              >
                {isLoading ? t.loading : t.submit}
              </button>
            </div>
          </div>
        )}

        {view === View.AdminLogin && (
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 fade-in border border-gray-100">
            <h2 className="text-3xl font-black mb-8 text-gray-900 border-b pb-4">{t.adminLogin}</h2>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.password}</label>
                <input 
                  type="password" 
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl p-4 focus:border-blue-500 outline-none transition"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-xl">{error}</p>}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setView(View.Home)} className="flex-1 border-2 py-4 rounded-2xl font-bold text-gray-500">{t.back}</button>
                <button type="submit" className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition">{t.next}</button>
              </div>
            </form>
          </div>
        )}

        {view === View.AdminDashboard && (
          <AdminDashboard 
            data={responses} 
            lang={lang} 
            onClear={clearData} 
            onLogout={() => { setView(View.Home); setAdminPass(''); }} 
          />
        )}
      </main>

      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="font-black text-gray-900 text-lg">Admin: {ADMIN_INFO.name}</p>
            <p className="text-blue-600 font-bold">{ADMIN_INFO.email}</p>
          </div>
          <div className="text-center md:text-right space-y-1">
            <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">
              &copy; {new Date().getFullYear()} Guliston Davlat Pedagogika Instituti
            </p>
            <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.2em]">Monitoring & Analysis</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

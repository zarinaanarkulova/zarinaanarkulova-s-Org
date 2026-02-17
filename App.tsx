
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
    const { data, error } = await supabase
      .from('bullying_responses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
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
        },
        answers: row.answers,
      }));
      setResponses(mapped);
    }
    setIsLoading(false);
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

    const { error } = await supabase
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

    if (error) {
      alert('Ma\'lumotni saqlashda xatolik yuz berdi: ' + error.message);
    } else {
      alert(t.thankYou);
      await fetchResponses(); // Refresh data
      setView(View.Home);
      setUserData(null);
      setCurrentAnswers({});
    }
    setIsLoading(false);
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
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      alert('Ma\'lumotlarni o\'chirishda xatolik: ' + error.message);
    } else {
      setResponses([]);
      setView(View.Home);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b shadow-sm py-6 px-4 text-center">
        <h1 className="text-xl md:text-3xl font-bold text-blue-900 tracking-tight uppercase">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">{t.subtitle}</p>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
        {view === View.Home && (
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 animate-fadeIn">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
              🛡️
            </div>
            <LanguageSelector current={lang} onSelect={setLang} />
            <button
              onClick={() => setView(View.Register)}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl active:scale-95"
            >
              {t.startSurvey}
            </button>
            <button
              onClick={() => setView(View.AdminLogin)}
              className="w-full text-blue-600 font-medium py-2 hover:underline"
            >
              {t.adminLogin}
            </button>
          </div>
        )}

        {view === View.Register && (
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 animate-slideIn">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t.registerTitle}</h2>
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.firstName}</label>
                <input required name="firstName" className="w-full border rounded-lg p-3 outline-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.lastName}</label>
                <input required name="lastName" className="w-full border rounded-lg p-3 outline-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.birthYear}</label>
                <input required type="number" name="birthYear" placeholder="2010" className="w-full border rounded-lg p-3 outline-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.schoolNumber}</label>
                <input required name="schoolNumber" className="w-full border rounded-lg p-3 outline-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.classNumber}</label>
                <input required name="classNumber" className="w-full border rounded-lg p-3 outline-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.classLetter}</label>
                <input required name="classLetter" placeholder="A, B, V..." className="w-full border rounded-lg p-3 outline-blue-500 uppercase" />
              </div>
              <div className="md:col-span-2 pt-4 flex gap-4">
                <button type="button" onClick={() => setView(View.Home)} className="flex-1 border py-3 rounded-lg font-bold">{t.back}</button>
                <button type="submit" className="flex-[2] bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">{t.next}</button>
              </div>
            </form>
          </div>
        )}

        {view === View.Survey && (
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300" 
                  style={{ width: `${(Object.keys(currentAnswers).length / SURVEY_QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-8 max-h-[60vh] overflow-y-auto px-2">
              {SURVEY_QUESTIONS.map((q) => (
                <div key={q.id} className="border-b pb-6">
                  <p className="text-lg font-medium text-gray-800 mb-4">{q.text[lang]}</p>
                  <div className="flex justify-between gap-2">
                    {[0, 1, 2, 3, 4].map((score) => (
                      <button
                        key={score}
                        onClick={() => setCurrentAnswers(prev => ({ ...prev, [q.id]: score }))}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                          currentAnswers[q.id] === score 
                          ? 'bg-blue-600 border-blue-600 text-white transform scale-110 shadow-md' 
                          : 'border-gray-200 hover:border-blue-300 text-gray-600'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
                    <span>{lang === 'uz' ? 'Aslo' : 'Никогда'}</span>
                    <span>{lang === 'uz' ? 'Har doim' : 'Всегда'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4">
              <button onClick={() => setView(View.Register)} className="flex-1 border py-3 rounded-lg font-bold">{t.back}</button>
              <button 
                onClick={handleSurveySubmit} 
                disabled={Object.keys(currentAnswers).length < SURVEY_QUESTIONS.length || isLoading}
                className={`flex-[2] py-3 rounded-lg font-bold text-white transition ${
                  (Object.keys(currentAnswers).length < SURVEY_QUESTIONS.length || isLoading)
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 shadow-md'
                }`}
              >
                {isLoading ? t.loading : t.submit}
              </button>
            </div>
          </div>
        )}

        {view === View.AdminLogin && (
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t.adminLogin}</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.password}</label>
                <input 
                  type="password" 
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full border rounded-lg p-3 outline-blue-500"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setView(View.Home)} className="flex-1 border py-3 rounded-lg font-bold">{t.back}</button>
                <button type="submit" className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-gray-900">{t.next}</button>
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

      <footer className="bg-gray-900 text-white p-6 mt-auto">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm md:text-base">
          <div className="text-center md:text-left">
            <p className="font-bold text-gray-300">Admin: {ADMIN_INFO.name}</p>
            <p className="text-gray-400">{ADMIN_INFO.email}</p>
          </div>
          <div className="text-gray-500">
            &copy; {new Date().getFullYear()} Bulling Monitoring System
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

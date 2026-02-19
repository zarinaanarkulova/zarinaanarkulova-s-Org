
import React from 'react';
import { Language } from '../types';

interface Props {
  current: Language;
  onSelect: (lang: Language) => void;
}

export const LanguageSelector: React.FC<Props> = ({ current, onSelect }) => {
  return (
    <div className="flex gap-3 justify-center items-center">
      <button
        onClick={() => onSelect('uz')}
        className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
          current === 'uz' 
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' 
          : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-100'
        }`}
      >
        O'zbekcha
      </button>
      <button
        onClick={() => onSelect('ru')}
        className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
          current === 'ru' 
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' 
          : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-100'
        }`}
      >
        Русский
      </button>
    </div>
  );
};

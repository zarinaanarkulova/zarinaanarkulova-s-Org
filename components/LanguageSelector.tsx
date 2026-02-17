
import React from 'react';
import { Language } from '../types';

interface Props {
  current: Language;
  onSelect: (lang: Language) => void;
}

export const LanguageSelector: React.FC<Props> = ({ current, onSelect }) => {
  return (
    <div className="flex gap-2 justify-center my-4">
      <button
        onClick={() => onSelect('uz')}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          current === 'uz' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        O'zbekcha
      </button>
      <button
        onClick={() => onSelect('ru')}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          current === 'ru' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        Русский
      </button>
    </div>
  );
};

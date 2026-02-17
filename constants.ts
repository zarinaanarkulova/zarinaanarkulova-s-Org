
import { Question } from './types';

export const ADMIN_PASSWORD = 'zarina1994';
export const ADMIN_INFO = {
  name: "Anarkulova Zarina Axmad qizi",
  email: "anarkulovazarina0@gmail.com"
};

export const SURVEY_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: {
      uz: 'Maktabda o\'zingizni xavfsiz his qilasizmi?',
      ru: 'Чувствуете ли вы себя в безопасности в школе?'
    }
  },
  {
    id: 'q2',
    text: {
      uz: 'Boshqa o\'quvchilar sizni tez-tez masxara qilishadimi?',
      ru: 'Часто ли другие ученики насмехаются над вами?'
    }
  },
  {
    id: 'q3',
    text: {
      uz: 'Sizga nisbatan jismoniy kuch ishlatilganmi?',
      ru: 'Применялась ли к вам физическая сила?'
    }
  },
  {
    id: 'q4',
    text: {
      uz: 'Ijtimoiy tarmoqlarda siz haqingizda yomon gaplar tarqatishganmi?',
      ru: 'Распространяли ли о вас плохие слухи в социальных сетях?'
    }
  },
  {
    id: 'q5',
    text: {
      uz: 'Sizni guruh o\'yinlaridan yoki tadbirlardan ataylab chetlatishadimi?',
      ru: 'Вас специально исключают из групповых игр или мероприятий?'
    }
  },
  {
    id: 'q6',
    text: {
      uz: 'Maktabga borishdan qo\'rqasizmi?',
      ru: 'Боитесь ли вы идти в школу?'
    }
  },
  {
    id: 'q7',
    text: {
      uz: 'Boshqalarning kamsitilishini ko\'rganmisiz?',
      ru: 'Видели ли вы, как унижают других?'
    }
  }
];

export const TRANSLATIONS = {
  uz: {
    title: 'GULISTON DAVLAT PEDAGOGIKA INSTITUTI',
    subtitle: 'Bullingni aniqlash va oldini olish tizimi',
    startSurvey: 'So\'rovnomani boshlash',
    adminLogin: 'Admin tizimiga kirish',
    registerTitle: 'Ro\'yxatdan o\'tish',
    firstName: 'Ism',
    lastName: 'Familiya',
    birthYear: 'Tug\'ilgan yil',
    schoolNumber: 'Maktab raqami',
    classNumber: 'Sinf raqami',
    classLetter: 'Sinf harfi',
    next: 'Keyingisi',
    submit: 'Yuborish',
    back: 'Orqaga',
    password: 'Parol',
    wrongPassword: 'Xato parol!',
    adminPanel: 'Admin Paneli',
    statistics: 'Statistika',
    aiAnalysis: 'AI Tahlili',
    noData: 'Ma\'lumotlar mavjud emas',
    totalSurveys: 'Jami so\'rovnomalar',
    bullyingRisk: 'Bulling xavfi darajasi',
    analyzeWithAI: 'AI bilan tahlil qilish',
    loading: 'Yuklanmoqda...',
    deleteData: 'Barcha ma\'lumotlarni o\'chirish',
    confirmDelete: 'Haqiqatdan ham o\'chirmoqchimisiz?',
    thankYou: 'Rahmat! Ma\'lumotlaringiz muvaffaqiyatli saqlandi.'
  },
  ru: {
    title: 'ГУЛИСТАНСКИЙ ГОСУДАРСТВЕННЫЙ ПЕДАГОГИЧЕСКИЙ ИНСТИТУТ',
    subtitle: 'Система выявления и предотвращения буллинга',
    startSurvey: 'Начать опрос',
    adminLogin: 'Вход для админа',
    registerTitle: 'Регистрация',
    firstName: 'Имя',
    lastName: 'Фамилия',
    birthYear: 'Год рождения',
    schoolNumber: 'Номер школы',
    classNumber: 'Номер класса',
    classLetter: 'Буква класса',
    next: 'Далее',
    submit: 'Отправить',
    back: 'Назад',
    password: 'Пароль',
    wrongPassword: 'Неверный пароль!',
    adminPanel: 'Панель администратора',
    statistics: 'Статистика',
    aiAnalysis: 'AI Анализ',
    noData: 'Нет данных',
    totalSurveys: 'Всего опросов',
    bullyingRisk: 'Уровень риска буллинга',
    analyzeWithAI: 'Анализировать через AI',
    loading: 'Загрузка...',
    deleteData: 'Удалить все данные',
    confirmDelete: 'Вы действительно хотите удалить всё?',
    thankYou: 'Спасибо! Ваши данные успешно сохранены.'
  }
};

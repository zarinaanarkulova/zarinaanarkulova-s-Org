
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
      uz: 'Maktab hududida o\'zingizni xavfsiz va xotirjam his qilasizmi?',
      ru: 'Чувствуете ли вы себя в безопасности и спокойно на территории школы?'
    }
  },
  {
    id: 'q2',
    text: {
      uz: 'Tengdoshlaringiz tomonidan kamsitish yoki nohaq munosabatga duch kelasizmi?',
      ru: 'Сталкиваетесь ли вы с дискриминацией или несправедливым отношением со стороны сверстников?'
    }
  },
  {
    id: 'q3',
    text: {
      uz: 'O\'zingizga yoqmagan bo\'lsa-da, guruh qoidalariga bo\'ysunishga majbur bo\'lasizmi?',
      ru: 'Приходится ли вам подчиняться правилам группы, даже если они вам не нравятся?'
    }
  },
  {
    id: 'q4',
    text: {
      uz: 'Sog\'lig\'ingiz uchun zararli bo\'lgan tutunli yoki bug\'li vositalardan foydalanishga qiziqasizmi?',
      ru: 'Интересуетесь ли вы использованием дымных или паровых средств, вредных для вашего здоровья?'
    }
  },
  {
    id: 'q5',
    text: {
      uz: 'Kayfiyatni sun\'iy tarzda o\'zgartiruvchi "maxsus" ichimliklarni tatib ko\'rish takliflari bo\'ladimi?',
      ru: 'Бывают ли предложения попробовать "особые" напитки, искусственно меняющие настроение?'
    }
  },
  {
    id: 'q6',
    text: {
      uz: 'Kattalar yoki tartib-qoidalarga qarshi chiqish orqali o\'zingizni ko\'rsatishni yoqtirasizmi?',
      ru: 'Нравится ли вам проявлять себя, идя против взрослых или установленных правил?'
    }
  },
  {
    id: 'q7',
    text: {
      uz: 'Sizni jamoat tadbirlaridan yoki guruh suhbatlaridan ataylab chetlatishadimi?',
      ru: 'Вас специально исключают из общественных мероприятий или групповых бесед?'
    }
  },
  {
    id: 'q8',
    text: {
      uz: 'Darslardan sababsiz qolish yoki intizomni buzish holatlari sizda kuzatiladimi?',
      ru: 'Наблюдаются ли у вас случаи прогулов уроков без причины или нарушения дисциплины?'
    }
  },
  {
    id: 'q9',
    text: {
      uz: 'Atrofingizdagilar sizni xavfli yoki tavakkalchilikka asoslangan ishlarga undashadimi?',
      ru: 'Побуждают ли окружающие вас к опасным или рискованным поступкам?'
    }
  },
  {
    id: 'q10',
    text: {
      uz: 'Internet tarmoqlarida sizga nisbatan bosim yoki haqoratlar bo\'ladimi?',
      ru: 'Бывают ли в отношении вас давление или оскорбления в интернет-сетях?'
    }
  }
];

export const RESPONSE_LABELS = {
  uz: ['Hech qachon', 'Kamdan-kam', 'Ba\'zida', 'Tez-tez', 'Har doim'],
  ru: ['Никогда', 'Редко', 'Иногда', 'Часто', 'Всегда']
};

export const TRANSLATIONS = {
  uz: {
    title: 'GULISTON DAVLAT PEDAGOGIKA INSTITUTI',
    subtitle: 'Monitoring va tahlil tizimi',
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
    participants: 'Ishtirokchilar',
    noData: 'Ma\'lumotlar mavjud emas',
    totalSurveys: 'Jami so\'rovnomalar',
    bullyingRisk: 'Xavf darajasi',
    analyzeWithAI: 'AI bilan tahlil qilish',
    loading: 'Yuklanmoqda...',
    deleteData: 'Ma\'lumotlarni o\'chirish',
    confirmDelete: 'Haqiqatdan ham barcha ma\'lumotlarni o\'chirmoqchimisiz?',
    thankYou: 'Rahmat! Ma\'lumotlaringiz muvaffaqiyatli saqlandi.',
    viewDetails: 'Ko\'rish',
    detailsTitle: 'Ishtirokchi javoblari',
    close: 'Yopish',
    riskLevel: 'Xavf darajasi',
    highRisk: 'Yuqori',
    mediumRisk: 'O\'rta',
    lowRisk: 'Past',
    date: 'Sana',
    activity: 'Kunlik faollik',
    submissionDate: 'Yuborilgan vaqt',
    exportData: 'Wordda yuklash (DOC)',
    share: 'Ulashish',
    copy: 'Nusxa ko\'chirish',
    copied: 'Nusxalandi!',
    listView: 'Ro\'yxat ko\'rinishi',
    groupView: 'Guruhlangan ko\'rinish',
    schools: 'Maktablar',
    classes: 'SinflarKesimi'
  },
  ru: {
    title: 'ГУЛИСТАНСКИЙ ГОСУДАРСТВЕННЫЙ ПЕДАГОГИЧЕСКИЙ ИНСТИТУТ',
    subtitle: 'Система мониторинга и анализа',
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
    participants: 'Участники',
    noData: 'Нет данных',
    totalSurveys: 'Всего опросов',
    bullyingRisk: 'Уровень риска',
    analyzeWithAI: 'Анализировать через AI',
    loading: 'Загрузка...',
    deleteData: 'Удалить данные',
    confirmDelete: 'Вы действительно хотите удалить все данные?',
    thankYou: 'Спасибо! Ваши данные успешно сохранены.',
    viewDetails: 'Смотреть',
    detailsTitle: 'Ответы участника',
    close: 'Закрыть',
    riskLevel: 'Уровень риска',
    highRisk: 'Высокий',
    mediumRisk: 'Средний',
    lowRisk: 'Низкий',
    date: 'Дата',
    activity: 'Дневная активность',
    submissionDate: 'Время отправки',
    exportData: 'Скачать в Word (DOC)',
    share: 'Поделиться',
    copy: 'Копировать',
    copied: 'Скопировано!',
    listView: 'Вид списка',
    groupView: 'Группировка',
    schools: 'Школы',
    classes: 'Классы'
  }
};

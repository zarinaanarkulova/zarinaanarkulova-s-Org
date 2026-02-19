
export type Language = 'uz' | 'ru';

export interface UserRegistration {
  firstName: string;
  lastName: string;
  birthYear: number;
  schoolNumber: string;
  classNumber: string;
  classLetter: string;
}

export interface SurveyResponse {
  id: string;
  timestamp: number;
  user: UserRegistration;
  answers: Record<string, number>; // 0 to 4 scale
}

export interface Question {
  id: string;
  text: {
    uz: string;
    ru: string;
  };
}

export enum View {
  Home = 'home',
  Register = 'register',
  Survey = 'survey',
  AdminLogin = 'admin_login',
  AdminDashboard = 'admin_dashboard'
}

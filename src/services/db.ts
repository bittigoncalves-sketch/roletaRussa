import { Question, Category, User, GameTurnResult } from '../types';

const STORAGE_KEYS = {
  QUESTIONS: 'roleta_db_questions_v2',
  CATEGORIES: 'roleta_db_categories_v1',
  USERS: 'roleta_db_users_v2',
  HISTORY: 'roleta_db_history_v2',
  CURRENT_USER: 'roleta_current_user_v2',
  ADMIN_AUTH: 'roleta_admin_auth_v1',
};

// Default Pre-seeded Categories
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_historia',
    name: 'História',
    color: '#E11D48', // Rose / Red
    textColor: '#FFFFFF',
    icon: 'Landmark',
    description: 'Fatos históricos, civilizações e datas marcantes',
    active: true,
  },
  {
    id: 'cat_ciencia',
    name: 'Ciência & Natureza',
    color: '#059669', // Emerald
    textColor: '#FFFFFF',
    icon: 'FlaskConical',
    description: 'Física, química, biologia, astronomia e o mundo natural',
    active: true,
  },
  {
    id: 'cat_geografia',
    name: 'Geografia',
    color: '#0284C7', // Sky Blue
    textColor: '#FFFFFF',
    icon: 'Globe',
    description: 'Países, capitais, relevo, oceanos e mapas',
    active: true,
  },
  {
    id: 'cat_tecnologia',
    name: 'Tecnologia',
    color: '#7C3AED', // Violet
    textColor: '#FFFFFF',
    icon: 'Monitor',
    description: 'Computação, redes, internet e tecnologia',
    active: true,
  },
  {
    id: 'cat_cultura',
    name: 'Cultura Pop',
    color: '#D97706', // Amber / Orange
    textColor: '#FFFFFF',
    icon: 'Film',
    description: 'Cinema, música, séries, games e quadrinhos',
    active: true,
  },
  {
    id: 'cat_lingua',
    name: 'Língua & Literatura',
    color: '#DB2777', // Pink
    textColor: '#FFFFFF',
    icon: 'BookOpen',
    description: 'Gramática, ortografia, autores e livros clássicos',
    active: true,
  },
  {
    id: 'cat_esportes',
    name: 'Esportes',
    color: '#16A34A', // Green
    textColor: '#FFFFFF',
    icon: 'Trophy',
    description: 'Futebol, Olimpíadas, recordes e regras esportivas',
    active: true,
  },
  {
    id: 'cat_especial',
    name: 'Desafio Especial',
    color: '#9333EA', // Purple Gold
    textColor: '#FFFFFF',
    icon: 'Award',
    description: 'Perguntas especiais de alto nível',
    active: true,
  },
];

// Empty default questions so user can add their own
export const DEFAULT_QUESTIONS: Question[] = [];

// Default Pre-seeded Users
export const DEFAULT_USERS: User[] = [
  {
    id: 'user_admin',
    name: 'Administrador Master',
    email: 'admin@roleta.com',
    role: 'admin',
    pin: 'admin123',
    avatarColor: '#E11D48',
    totalGamesPlayed: 0,
    totalCorrectAnswers: 0,
    totalScore: 0,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user_guest',
    name: 'Jogador Convidado',
    email: 'convidado@roleta.local',
    role: 'player',
    avatarColor: '#F59E0B',
    totalGamesPlayed: 0,
    totalCorrectAnswers: 0,
    totalScore: 0,
    createdAt: '2026-01-12T08:00:00Z',
  },
];

// Empty initial game history
export const DEFAULT_HISTORY: GameTurnResult[] = [];

/**
 * Text normalizer helper for comparing written answers:
 * Removes accents, lowers case, trims extra spaces and punctuation.
 */
export function normalizeAnswerText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // remove punctuation
    .trim()
    .replace(/\s+/g, ' ');
}

export function checkWrittenAnswer(playerInput: string, acceptedAnswers: string[]): boolean {
  if (!playerInput || !acceptedAnswers || acceptedAnswers.length === 0) return false;
  const normalizedInput = normalizeAnswerText(playerInput);
  if (!normalizedInput) return false;

  return acceptedAnswers.some(ans => {
    const normalizedTarget = normalizeAnswerText(ans);
    return normalizedInput === normalizedTarget ||
      (normalizedTarget.length > 4 && normalizedInput.includes(normalizedTarget)) ||
      (normalizedInput.length > 4 && normalizedTarget.includes(normalizedInput));
  });
}

class AppDatabase {
  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    // Remove legacy v1 keys containing pre-seeded questions and answers
    localStorage.removeItem('roleta_db_questions_v1');
    localStorage.removeItem('roleta_db_history_v1');
    localStorage.removeItem('roleta_db_users_v1');
    localStorage.removeItem('roleta_current_user_v1');

    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(DEFAULT_HISTORY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[1])); // Guest player
    }
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  public saveCategories(categories: Category[]) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  public addCategory(cat: Omit<Category, 'id'>): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      ...cat,
      id: 'cat_' + Date.now().toString(36),
    };
    categories.push(newCat);
    this.saveCategories(categories);
    return newCat;
  }

  public updateCategory(cat: Category) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === cat.id);
    if (index !== -1) {
      categories[index] = cat;
      this.saveCategories(categories);
    }
  }

  public deleteCategory(id: string) {
    const categories = this.getCategories().filter(c => c.id !== id);
    this.saveCategories(categories);
  }

  // --- QUESTIONS ---
  public getQuestions(): Question[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      return data ? JSON.parse(data) : DEFAULT_QUESTIONS;
    } catch {
      return DEFAULT_QUESTIONS;
    }
  }

  public saveQuestions(questions: Question[]) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  }

  public addQuestion(question: Omit<Question, 'id' | 'createdAt'>): Question {
    const questions = this.getQuestions();
    const newQ: Question = {
      ...question,
      id: 'q_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    questions.unshift(newQ);
    this.saveQuestions(questions);
    return newQ;
  }

  public updateQuestion(question: Question) {
    const questions = this.getQuestions();
    const index = questions.findIndex(q => q.id === question.id);
    if (index !== -1) {
      questions[index] = question;
      this.saveQuestions(questions);
    }
  }

  public deleteQuestion(id: string) {
    const questions = this.getQuestions().filter(q => q.id !== id);
    this.saveQuestions(questions);
  }

  public clearAllQuestions() {
    this.saveQuestions([]);
  }

  public resetQuestions() {
    this.saveQuestions([]);
    this.clearHistory();
    const resetUsers = this.getUsers().map(u => ({
      ...u,
      totalGamesPlayed: 0,
      totalCorrectAnswers: 0,
      totalScore: 0,
    }));
    this.saveUsers(resetUsers);
    const current = this.getCurrentUser();
    const updatedCurrent = resetUsers.find(u => u.id === current.id) || resetUsers[0];
    if (updatedCurrent) {
      this.setCurrentUser(updatedCurrent);
    }
  }

  // --- USERS ---
  public getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  }

  public saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  public addUser(user: Omit<User, 'id' | 'createdAt' | 'totalGamesPlayed' | 'totalCorrectAnswers' | 'totalScore'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: 'user_' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      totalGamesPlayed: 0,
      totalCorrectAnswers: 0,
      totalScore: 0,
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  public updateUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      this.saveUsers(users);
    }
  }

  public deleteUser(id: string) {
    const users = this.getUsers().filter(u => u.id !== id);
    this.saveUsers(users);
  }

  // --- CURRENT PLAYER & ADMIN AUTH ---
  public getCurrentUser(): User {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return DEFAULT_USERS[1]; // guest
  }

  public setCurrentUser(user: User) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  public isAdminAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  }

  public setAdminAuthenticated(val: boolean) {
    if (val) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  }

  // --- GAME HISTORY ---
  public getHistory(): GameTurnResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : DEFAULT_HISTORY;
    } catch {
      return DEFAULT_HISTORY;
    }
  }

  public recordGameResult(result: Omit<GameTurnResult, 'id' | 'timestamp'>): GameTurnResult {
    const history = this.getHistory();
    const newEntry: GameTurnResult = {
      ...result,
      id: 'hist_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };

    history.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

    // Update user stats
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === result.userId);
    if (userIndex !== -1) {
      const user = users[userIndex];
      user.totalGamesPlayed = (user.totalGamesPlayed || 0) + 1;
      if (result.hasAnswer !== false && result.isCorrect) {
        user.totalCorrectAnswers = (user.totalCorrectAnswers || 0) + 1;
        user.totalScore = (user.totalScore || 0) + (result.pointsAwarded || 0);
      }
      this.saveUsers(users);

      const currentUser = this.getCurrentUser();
      if (currentUser.id === user.id) {
        this.setCurrentUser(user);
      }
    }

    return newEntry;
  }

  public clearHistory() {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  }

  public exportDataJSON(): string {
    const bundle = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      categories: this.getCategories(),
      questions: this.getQuestions(),
      users: this.getUsers(),
      history: this.getHistory(),
    };
    return JSON.stringify(bundle, null, 2);
  }

  public importDataJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.questions)) {
        this.saveQuestions(data.questions);
      }
      if (Array.isArray(data.categories)) {
        this.saveCategories(data.categories);
      }
      if (Array.isArray(data.users)) {
        this.saveUsers(data.users);
      }
      if (Array.isArray(data.history)) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
      }
      return { success: true, message: 'Dados importados com sucesso!' };
    } catch (e: unknown) {
      return { success: false, message: 'Arquivo JSON inválido: ' + (e instanceof Error ? e.message : 'Erro desconhecido') };
    }
  }
}

export const db = new AppDatabase();

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Search,
  Filter,
  Users,
  History,
  FileQuestion,
  ShieldCheck,
} from 'lucide-react';
import { Question, User, GameTurnResult, QuestionType } from '../types';
import { db } from '../services/db';
import { sound } from '../utils/sound';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'questions' | 'users' | 'history';
  onDatabaseUpdated: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'questions',
  onDatabaseUpdated,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => db.isAdminAuthenticated());
  const [loginEmail, setLoginEmail] = useState<string>('admin@roleta.com');
  const [loginPin, setLoginPin] = useState<string>('admin123');
  const [loginError, setLoginError] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'questions' | 'users' | 'history'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Data states
  const [questions, setQuestions] = useState<Question[]>(() => db.getQuestions());
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [history, setHistory] = useState<GameTurnResult[]>(() => db.getHistory());

  // Question Form Modal State
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Question filters
  const [searchQuestion, setSearchQuestion] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // History filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyUserFilter, setHistoryUserFilter] = useState('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'correct' | 'wrong'>('all');

  // User Form Modal State
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Sync state with db when updated
  const refreshData = () => {
    setQuestions(db.getQuestions());
    setUsers(db.getUsers());
    setHistory(db.getHistory());
    onDatabaseUpdated();
  };

  useEffect(() => {
    if (isOpen) {
      setQuestions(db.getQuestions());
      setUsers(db.getUsers());
      setHistory(db.getHistory());
    }
  }, [isOpen]);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const allUsers = db.getUsers();
    const admin = allUsers.find(
      u => u.role === 'admin' && u.email.toLowerCase() === loginEmail.toLowerCase()
    );

    if (admin && (admin.pin === loginPin || loginPin === 'admin123')) {
      db.setAdminAuthenticated(true);
      setIsAuthenticated(true);
      setLoginError('');
      sound.playCorrect();
    } else {
      setLoginError('Credenciais incorretas. Use o botão de Acesso Rápido ou cadastre um admin.');
      sound.playWrong();
    }
  };

  const handleLogout = () => {
    db.setAdminAuthenticated(false);
    setIsAuthenticated(false);
    sound.playClick();
  };

  // --- QUESTION CRUD ---
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setIsQuestionFormOpen(true);
    sound.playClick();
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setIsQuestionFormOpen(true);
    sound.playClick();
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta pergunta do banco?')) {
      db.deleteQuestion(id);
      refreshData();
      sound.playClick();
    }
  };

  const handleToggleQuestionActive = (q: Question) => {
    db.updateQuestion({ ...q, active: !q.active });
    refreshData();
  };

  const handleClearAllQuestions = () => {
    if (confirm('Deseja eliminar TODAS as perguntas do banco de dados?')) {
      db.clearAllQuestions();
      refreshData();
      sound.playClick();
    }
  };

  // --- USER CRUD ---
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
    sound.playClick();
  };

  const handleEditUser = (u: User) => {
    setEditingUser(u);
    setIsUserFormOpen(true);
    sound.playClick();
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Deseja excluir este usuário?')) {
      db.deleteUser(id);
      refreshData();
      sound.playClick();
    }
  };

  // --- HISTORY ACTIONS ---
  const handleClearHistory = () => {
    if (confirm('Deseja realmente limpar todo o histórico de jogadas? Esta ação não pode ser desfeita.')) {
      db.clearHistory();
      refreshData();
      sound.playClick();
    }
  };

  const handleExportCSV = () => {
    const hist = db.getHistory();
    if (hist.length === 0) {
      alert('Nenhum resultado registrado ainda.');
      return;
    }

    const headers = [
      'Data/Hora',
      'Jogador',
      'Pergunta',
      'Tipo',
      'Dificuldade',
      'Resposta Jogador',
      'Gabarito',
      'Status',
    ];

    const rows = hist.map(item => [
      `"${new Date(item.timestamp).toLocaleString('pt-BR')}"`,
      `"${item.userName.replace(/"/g, '""')}"`,
      `"${item.questionTitle.replace(/"/g, '""')}"`,
      `"${item.questionType}"`,
      `"${item.difficulty || 'medium'}"`,
      `"${item.playerAnswer.replace(/"/g, '""')}"`,
      `"${item.correctAnswer.replace(/"/g, '""')}"`,
      item.hasAnswer === false ? 'Registrada' : item.isCorrect ? 'Sim' : 'Não',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historico_roleta_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sound.playClick();
  };

  // Export & Import full JSON
  const handleExportJSON = () => {
    const jsonStr = db.exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_banco_roleta_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    sound.playClick();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      const res = db.importDataJSON(content);
      alert(res.message);
      if (res.success) {
        refreshData();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchSearch =
        q.title.toLowerCase().includes(searchQuestion.toLowerCase()) ||
        q.explanation.toLowerCase().includes(searchQuestion.toLowerCase());

      const matchType = filterType === 'all' || q.type === filterType;

      return matchSearch && matchType;
    });
  }, [questions, searchQuestion, filterType]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const matchSearch =
        h.userName.toLowerCase().includes(historySearch.toLowerCase()) ||
        h.questionTitle.toLowerCase().includes(historySearch.toLowerCase());

      const matchUser = historyUserFilter === 'all' || h.userId === historyUserFilter;
      const matchStatus =
        historyStatusFilter === 'all' ||
        (historyStatusFilter === 'correct' && h.isCorrect) ||
        (historyStatusFilter === 'wrong' && !h.isCorrect);

      return matchSearch && matchUser && matchStatus;
    });
  }, [history, historySearch, historyUserFilter, historyStatusFilter]);

  // History stats
  const totalSpins = history.length;
  const totalCorrect = history.filter(h => h.isCorrect).length;
  const accuracyRate = totalSpins > 0 ? Math.round((totalCorrect / totalSpins) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Painel de Gestão & Banco de Dados
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                  {isAuthenticated ? 'Admin Conectado' : 'Acesso Restrito'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gerencie perguntas (múltipla escolha, escolha e escritas), usuários e histórico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Desconectar
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AUTH SCREEN (if not authenticated) */}
        {!isAuthenticated ? (
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Login no Banco de Dados</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Insira as credenciais de administrador para acessar o banco de perguntas, gerenciador de usuários e histórico.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-left">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    E-mail do Administrador
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="admin@roleta.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    PIN / Senha
                  </label>
                  <input
                    type="password"
                    value={loginPin}
                    onChange={e => setLoginPin(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="admin123"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition cursor-pointer shadow-md active:scale-98"
                >
                  Entrar no Banco de Dados
                </button>
              </form>

              {/* Quick Demo Access Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('admin@roleta.com');
                    setLoginPin('admin123');
                    db.setAdminAuthenticated(true);
                    setIsAuthenticated(true);
                    sound.playCorrect();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4 text-indigo-600" />
                  <span>Acesso Rápido Admin Demo (1 Clique)</span>
                </button>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Credencial padrão: admin@roleta.com / admin123
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 sm:px-6 gap-2 sm:gap-4 overflow-x-auto shrink-0">
              <button
                onClick={() => {
                  setActiveTab('questions');
                  sound.playClick();
                }}
                className={`py-3.5 px-3 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'questions'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileQuestion className="w-4 h-4" />
                <span>Banco de Perguntas</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
                  {questions.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('users');
                  sound.playClick();
                }}
                className={`py-3.5 px-3 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'users'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Gerenciar Usuários</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
                  {users.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('history');
                  sound.playClick();
                }}
                className={`py-3.5 px-3 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Histórico de Resultados</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
                  {history.length}
                </span>
              </button>
            </div>

            {/* TAB 1: QUESTIONS MANAGEMENT */}
            {activeTab === 'questions' && (
              <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 overflow-hidden">
                {/* Actions Bar & Filters */}
                <div className="space-y-3 mb-4 shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar por pergunta ou resposta..."
                        value={searchQuestion}
                        onChange={e => setSearchQuestion(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleOpenAddQuestion}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nova Pergunta</span>
                      </button>

                      <button
                        onClick={handleExportJSON}
                        title="Exportar backup completo JSON"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden md:inline">Exportar JSON</span>
                      </button>

                      <label
                        title="Importar backup JSON"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="hidden md:inline">Importar</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportJSON}
                          className="hidden"
                        />
                      </label>

                      {questions.length > 0 && (
                        <button
                          onClick={handleClearAllQuestions}
                          title="Excluir todas as perguntas"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden md:inline">Limpar Tudo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Filtrar Tipo:
                    </span>
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer ${
                        filterType === 'all'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Todos ({questions.length})
                    </button>
                    <button
                      onClick={() => setFilterType('multiple_choice')}
                      className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer ${
                        filterType === 'multiple_choice'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Múltipla Escolha ({questions.filter(q => q.type === 'multiple_choice').length})
                    </button>
                    <button
                      onClick={() => setFilterType('single_choice')}
                      className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer ${
                        filterType === 'single_choice'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Escolha / V-F ({questions.filter(q => q.type === 'single_choice').length})
                    </button>
                    <button
                      onClick={() => setFilterType('written')}
                      className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer ${
                        filterType === 'written'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Escritas ({questions.filter(q => q.type === 'written').length})
                    </button>
                    <button
                      onClick={() => setFilterType('open')}
                      className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer ${
                        filterType === 'open'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Sem Alternativas ({questions.filter(q => q.type === 'open').length})
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-300 rounded-2xl p-6">
                      <FileQuestion className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-700 font-semibold text-sm">
                        {questions.length === 0
                          ? 'Nenhuma pergunta cadastrada no banco ainda.'
                          : 'Nenhuma pergunta encontrada com os filtros selecionados'}
                      </p>
                      <button
                        onClick={handleOpenAddQuestion}
                        className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                      >
                        + Cadastrar Nova Pergunta
                      </button>
                    </div>
                  ) : (
                    filteredQuestions.map((q, idx) => {
                      return (
                        <div
                          key={q.id}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition bg-slate-50 hover:bg-slate-100/70 ${
                            q.active ? 'border-slate-200' : 'border-slate-200 opacity-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  #{idx + 1}
                                </span>

                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 text-slate-700">
                                  {q.type === 'multiple_choice' && 'Múltipla Escolha'}
                                  {q.type === 'single_choice' && 'Escolha Simples'}
                                  {q.type === 'written' && 'Escrita / Digitação'}
                                  {q.type === 'open' && 'Sem Alternativas'}
                                </span>
                              </div>

                              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                {q.title}
                              </h4>

                              {/* Answers summary */}
                              <div className="mt-2 text-xs text-slate-600">
                                {q.type === 'open' || (!q.options?.length && !q.acceptedAnswers?.length) ? (
                                  <span className="text-slate-400 italic">
                                    Pergunta sem alternativas / sem resposta definida
                                  </span>
                                ) : q.type === 'written' ? (
                                  <div className="flex items-center gap-1.5">
                                    <strong className="text-emerald-700">Respostas aceitas:</strong>
                                    <span>{(q.acceptedAnswers || []).join(' | ')}</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {q.options?.map(opt => (
                                      <span
                                        key={opt.id}
                                        className={`px-2 py-0.5 rounded text-[11px] ${
                                          opt.isCorrect
                                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold'
                                            : 'bg-white border border-slate-200 text-slate-600'
                                        }`}
                                      >
                                        {opt.text} {opt.isCorrect && '✓'}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {q.explanation && (
                                <p className="mt-2 text-[11px] text-slate-500 italic">
                                  Explicação: {q.explanation}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleToggleQuestionActive(q)}
                                title={q.active ? 'Desativar pergunta' : 'Ativar pergunta'}
                                className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                                  q.active
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-slate-100 border-slate-200 text-slate-500'
                                }`}
                              >
                                {q.active ? 'Ativa' : 'Inativa'}
                              </button>

                              <button
                                onClick={() => handleEditQuestion(q)}
                                title="Editar Pergunta"
                                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                title="Excluir Pergunta"
                                className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Usuários e Jogadores</h3>
                    <p className="text-xs text-slate-500">
                      Cadastre administradores com senha/PIN e perfis de jogadores.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddUser}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Usuário</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {users.map(u => {
                    const accuracy =
                      u.totalGamesPlayed > 0
                        ? Math.round((u.totalCorrectAnswers / u.totalGamesPlayed) * 100)
                        : 0;

                    return (
                      <div
                        key={u.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm"
                            style={{ backgroundColor: u.avatarColor || '#6366f1' }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                                {u.name}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  u.role === 'admin'
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {u.role === 'admin' ? 'Administrador' : 'Jogador'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>

                        {/* Performance stats */}
                        <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-600">
                          <div className="text-center">
                            <span className="block text-slate-400 text-[10px] uppercase font-bold">
                              Jogos
                            </span>
                            <span className="font-bold text-sm text-slate-900">{u.totalGamesPlayed}</span>
                          </div>
                          <div className="text-center">
                            <span className="block text-slate-400 text-[10px] uppercase font-bold">
                              Acertos
                            </span>
                            <span className="font-bold text-sm text-emerald-600">
                              {u.totalCorrectAnswers} ({accuracy}%)
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleEditUser(u)}
                              title="Editar usuário"
                              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {u.id !== 'user_admin' && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                title="Excluir usuário"
                                className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: HISTORY OF GAME RESULTS */}
            {activeTab === 'history' && (
              <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 overflow-hidden">
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 shrink-0">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Total de Giros
                    </span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{totalSpins}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Acertos Totais
                    </span>
                    <p className="text-xl font-black text-emerald-600 mt-0.5">{totalCorrect}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Taxa de Acertos
                    </span>
                    <p className="text-xl font-black text-emerald-600 mt-0.5">
                      {accuracyRate}%
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Perguntas no Banco
                    </span>
                    <p className="text-xl font-black text-indigo-600 mt-0.5">{questions.length}</p>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                    <div className="relative flex-1 min-w-[160px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filtrar por jogador ou pergunta..."
                        value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>

                    <select
                      value={historyStatusFilter}
                      onChange={e => setHistoryStatusFilter(e.target.value as 'all' | 'correct' | 'wrong')}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs focus:outline-none"
                    >
                      <option value="all">Todos Resultados</option>
                      <option value="correct">Apenas Acertos</option>
                      <option value="wrong">Apenas Erros</option>
                    </select>

                    <select
                      value={historyUserFilter}
                      onChange={e => setHistoryUserFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs focus:outline-none"
                    >
                      <option value="all">Todos Jogadores</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar CSV</span>
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  </div>
                </div>

                {/* History Table */}
                <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
                      Nenhuma rodada registrada com os filtros aplicados.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-700 border-collapse">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Data/Hora</th>
                          <th className="py-2.5 px-3">Jogador</th>
                          <th className="py-2.5 px-3">Pergunta</th>
                          <th className="py-2.5 px-3">Resposta vs Gabarito</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredHistory.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(item.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(item.timestamp).toLocaleDateString([], {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                              {item.userName}
                            </td>
                            <td className="py-2.5 px-3 max-w-[260px] truncate" title={item.questionTitle}>
                              {item.questionTitle}
                            </td>
                            <td className="py-2.5 px-3 max-w-[200px]">
                              <div className="truncate text-slate-800">
                                <strong>Resp:</strong> {item.playerAnswer}
                              </div>
                              {item.hasAnswer !== false && !item.isCorrect && item.correctAnswer && (
                                <div className="truncate text-slate-500 text-[10px]">
                                  <strong>Gab:</strong> {item.correctAnswer}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-right">
                              {item.hasAnswer === false ? (
                                <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                                  Registrada
                                </span>
                              ) : item.isCorrect ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                  <CheckCircle className="w-3.5 h-3.5" /> Acertou
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                                  <XCircle className="w-3.5 h-3.5" /> Errou
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add/Edit Question */}
        {isQuestionFormOpen && (
          <QuestionFormModal
            isOpen={isQuestionFormOpen}
            question={editingQuestion}
            onClose={() => setIsQuestionFormOpen(false)}
            onSave={saved => {
              if (editingQuestion) {
                db.updateQuestion(saved);
              } else {
                db.addQuestion(saved);
              }
              setIsQuestionFormOpen(false);
              refreshData();
              sound.playCorrect();
            }}
          />
        )}

        {/* Modal: Add/Edit User */}
        {isUserFormOpen && (
          <UserFormModal
            isOpen={isUserFormOpen}
            user={editingUser}
            onClose={() => setIsUserFormOpen(false)}
            onSave={savedUser => {
              if (editingUser) {
                db.updateUser(savedUser);
              } else {
                db.addUser(savedUser);
              }
              setIsUserFormOpen(false);
              refreshData();
              sound.playCorrect();
            }}
          />
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: QUESTION FORM MODAL ---
interface QuestionFormModalProps {
  isOpen: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (q: Question) => void;
}

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  question,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<QuestionType>(question?.type || 'multiple_choice');
  const [title, setTitle] = useState<string>(question?.title || '');
  const [description] = useState<string>(question?.description || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    question?.difficulty || 'medium'
  );
  const [explanation, setExplanation] = useState<string>(question?.explanation || '');

  // Multiple Choice Options (4 options)
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<
    Array<{ id: string; text: string; isCorrect: boolean }>
  >(() => {
    if (question?.type === 'multiple_choice' && question.options) {
      return question.options;
    }
    return [
      { id: 'opt1', text: '', isCorrect: true },
      { id: 'opt2', text: '', isCorrect: false },
      { id: 'opt3', text: '', isCorrect: false },
      { id: 'opt4', text: '', isCorrect: false },
    ];
  });

  // Single Choice Options (2 options: Verdadeiro/Falso or custom)
  const [singleChoiceOptions, setSingleChoiceOptions] = useState<
    Array<{ id: string; text: string; isCorrect: boolean }>
  >(() => {
    if (question?.type === 'single_choice' && question.options) {
      return question.options;
    }
    return [
      { id: 'opt_true', text: 'Verdadeiro', isCorrect: true },
      { id: 'opt_false', text: 'Falso', isCorrect: false },
    ];
  });

  // Written Accepted Answers (comma separated or multi-line)
  const [writtenAnswersText, setWrittenAnswersText] = useState<string>(() => {
    if (question?.type === 'written' && question.acceptedAnswers) {
      return question.acceptedAnswers.join(', ');
    }
    return '';
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe o enunciado da pergunta.');
      return;
    }

    let optionsToSave = undefined;
    let acceptedAnswersToSave = undefined;

    if (type === 'multiple_choice') {
      const filled = multipleChoiceOptions
        .map(o => ({ ...o, text: o.text.trim() }))
        .filter(o => o.text.length > 0);
      optionsToSave = filled.length > 0 ? filled : undefined;
    } else if (type === 'single_choice') {
      const filled = singleChoiceOptions
        .map(o => ({ ...o, text: o.text.trim() }))
        .filter(o => o.text.length > 0);
      optionsToSave = filled.length > 0 ? filled : undefined;
    } else if (type === 'written') {
      const parsed = writtenAnswersText
        .split(/[,;\n]/)
        .map(s => s.trim())
        .filter(Boolean);
      acceptedAnswersToSave = parsed.length > 0 ? parsed : undefined;
    }

    const questionData: Question = {
      id: question?.id || 'q_' + Date.now(),
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      difficulty,
      options: optionsToSave,
      acceptedAnswers: acceptedAnswersToSave,
      explanation: explanation.trim(),
      active: question ? question.active : true,
      createdAt: question?.createdAt || new Date().toISOString(),
    };

    onSave(questionData);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            {question ? 'Editar Pergunta' : 'Nova Pergunta no Banco'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Question Type Selector with Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Tipo de Pergunta
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('open')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  type === 'open'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Sem Alternativas
              </button>
              <button
                type="button"
                onClick={() => setType('multiple_choice')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  type === 'multiple_choice'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Múltipla Escolha
              </button>
              <button
                type="button"
                onClick={() => setType('single_choice')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  type === 'single_choice'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Escolha Simples
              </button>
              <button
                type="button"
                onClick={() => setType('written')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  type === 'written'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Escrita / Aberta
              </button>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Dificuldade (Opcional)
            </label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none"
            >
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>

          {/* Enunciado / Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Enunciado da Pergunta *
            </label>
            <textarea
              rows={2}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Em que ano o homem pisou na Lua pela primeira vez?"
              required
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Specific Inputs according to Question Type */}
          {type === 'open' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              Pergunta livre sem alternativas e sem resposta obrigatória. O jogador visualizará a pergunta e poderá fechar ao concluir.
            </div>
          )}

          {type === 'multiple_choice' && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Alternativas (Opcional)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setMultipleChoiceOptions(prev => prev.map(o => ({ ...o, isCorrect: false })))
                  }
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Sem resposta correta
                </button>
              </div>
              {multipleChoiceOptions.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_option"
                    checked={opt.isCorrect}
                    onChange={() => {
                      setMultipleChoiceOptions(prev =>
                        prev.map((o, i) => ({ ...o, isCorrect: i === idx }))
                      );
                    }}
                    className="w-4 h-4 text-emerald-600 cursor-pointer"
                  />
                  <span className="w-6 text-xs font-bold text-slate-500">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={e => {
                      const newText = e.target.value;
                      setMultipleChoiceOptions(prev =>
                        prev.map((o, i) => (i === idx ? { ...o, text: newText } : o))
                      );
                    }}
                    placeholder={`Alternativa ${['A', 'B', 'C', 'D'][idx]} (opcional)`}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {type === 'single_choice' && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Opções de Escolha Simples (Opcional)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setSingleChoiceOptions(prev => prev.map(o => ({ ...o, isCorrect: false })))
                  }
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Sem resposta correta
                </button>
              </div>
              {singleChoiceOptions.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="single_choice_correct"
                    checked={opt.isCorrect}
                    onChange={() => {
                      setSingleChoiceOptions(prev =>
                        prev.map((o, i) => ({ ...o, isCorrect: i === idx }))
                      );
                    }}
                    className="w-4 h-4 text-emerald-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={e => {
                      const val = e.target.value;
                      setSingleChoiceOptions(prev =>
                        prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                      );
                    }}
                    placeholder="Opção (opcional)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {type === 'written' && (
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Respostas Aceitas (Opcional — deixe vazio para pergunta sem resposta)
              </label>
              <textarea
                rows={2}
                value={writtenAnswersText}
                onChange={e => setWrittenAnswersText(e.target.value)}
                placeholder="Ex: Brasília, Distrito Federal (ou deixe em branco)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Se preenchido, o sistema tolera acentos e maiúsculas/minúsculas.
              </p>
            </div>
          )}

          {/* Explanation / Trivia */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Explicação da Resposta
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Explicação exibida após o jogador responder..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
            >
              Salvar Pergunta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: USER FORM MODAL ---
interface UserFormModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (u: User) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, user, onClose, onSave }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState<'admin' | 'player'>(user?.role || 'player');
  const [pin, setPin] = useState(user?.pin || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Preencha nome e e-mail.');
      return;
    }

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
    const avatarColor = user?.avatarColor || colors[Math.floor(Math.random() * colors.length)];

    onSave({
      id: user?.id || 'user_' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      role,
      pin: pin.trim() || undefined,
      avatarColor,
      totalGamesPlayed: user?.totalGamesPlayed || 0,
      totalCorrectAnswers: user?.totalCorrectAnswers || 0,
      totalScore: user?.totalScore || 0,
      createdAt: user?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-900">
        <h3 className="font-bold text-base text-slate-900 mb-4">
          {user ? 'Editar Usuário' : 'Novo Usuário / Jogador'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nome</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm"
              placeholder="Ex: Joana Ferreira"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm"
              placeholder="joana@exemplo.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Perfil</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'player')}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm"
            >
              <option value="player">Jogador Comum</option>
              <option value="admin">Administrador do Banco</option>
            </select>
          </div>

          {role === 'admin' && (
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                PIN / Senha de Acesso Admin
              </label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Ex: admin123"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
            >
              Salvar Usuário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

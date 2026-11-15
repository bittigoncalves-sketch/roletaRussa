/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
  History as HistoryIcon,
  Database,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { RouletteWheel, getSliceColor } from './components/RouletteWheel';
import { QuestionModal } from './components/QuestionModal';
import { AdminModal } from './components/AdminModal';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { RulesModal } from './components/RulesModal';
import { Question, User, GameTurnResult } from './types';
import { db } from './services/db';
import { sound } from './utils/sound';

export default function App() {
  // Database States
  const [questions, setQuestions] = useState<Question[]>(() => db.getQuestions());
  const [currentUser, setCurrentUser] = useState<User>(() => db.getCurrentUser());
  const [recentHistory, setRecentHistory] = useState<GameTurnResult[]>(() => db.getHistory().slice(0, 5));

  // Game Engine States
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);

  // Modals
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'questions' | 'users' | 'history'>('questions');
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  // Refresh DB data in React state
  const refreshFromDb = useCallback(() => {
    setQuestions(db.getQuestions());
    setCurrentUser(db.getCurrentUser());
    setRecentHistory(db.getHistory().slice(0, 5));
  }, []);

  // Handle spin starts
  const handleSpinStart = () => {
    setIsSpinning(true);
  };

  // Handle spin complete: open the landed question directly
  const handleSpinEnd = (landedQuestion: Question) => {
    setIsSpinning(false);
    setActiveQuestion(landedQuestion);
    setIsQuestionModalOpen(true);
  };

  // Handle question answered
  const handleAnswerSubmitted = (params: {
    question: Question;
    playerAnswer: string;
    isCorrect: boolean;
    hasAnswer: boolean;
  }) => {
    const newEntry = db.recordGameResult({
      userId: currentUser.id,
      userName: currentUser.name,
      questionId: params.question.id,
      questionTitle: params.question.title,
      questionType: params.question.type,
      difficulty: params.question.difficulty,
      playerAnswer: params.playerAnswer,
      correctAnswer:
        params.question.type === 'written'
          ? (params.question.acceptedAnswers || []).join(' / ')
          : params.question.options?.find(o => o.isCorrect)?.text || '',
      isCorrect: params.isCorrect,
      hasAnswer: params.hasAnswer,
    });

    setCurrentUser(db.getCurrentUser());
    setRecentHistory(prev => [newEntry, ...prev.slice(0, 4)]);
  };

  // Open Admin panel with specific tab
  const handleOpenAdmin = (tab: 'questions' | 'users' | 'history' = 'questions') => {
    setAdminInitialTab(tab);
    setIsAdminOpen(true);
  };

  // Clear all questions and history
  const handleResetDatabase = () => {
    if (confirm('Deseja eliminar todas as perguntas e o histórico de jogadas do banco?')) {
      db.resetQuestions();
      refreshFromDb();
      sound.playCorrect();
      alert('Todas as perguntas e histórico foram removidos!');
    }
  };

  const activeQuestions = questions.filter(q => q.active);

  const accuracy =
    currentUser.totalGamesPlayed > 0
      ? Math.round((currentUser.totalCorrectAnswers / currentUser.totalGamesPlayed) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Header with 3-Dots Menu */}
      <Header
        currentUser={currentUser}
        onOpenAdmin={handleOpenAdmin}
        onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onResetDatabase={handleResetDatabase}
      />

      {/* Main Content Area */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6">
        {/* Admin Quick Notification Bar (Highlighting 3-dots access) */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <MoreVertical className="w-4 h-4" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-slate-900">Menu de Gestão: </span>
              <span className="text-slate-600">
                Acesse os <strong className="text-slate-900">3 pontinhos no topo</strong> ou clique aqui para logar no{' '}
                <strong className="text-indigo-600">Banco de Perguntas e Respostas</strong> (múltipla escolha, escolha e escritas), gerenciar usuários e ver o histórico de jogadas.
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              handleOpenAdmin('questions');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Acessar Banco de Dados</span>
          </button>
        </div>

        {/* Centerpiece: Roulette Stage & Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center Column: The Roulette Wheel */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden">
            {/* Stage Spotlight Header */}
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                  Roleta de Perguntas
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {activeQuestions.length} perguntas ativas na roleta
              </span>
            </div>

            {/* The Precision Interactive Wheel */}
            <RouletteWheel
              questions={questions}
              isSpinning={isSpinning}
              onSpinStart={handleSpinStart}
              onSpinEnd={handleSpinEnd}
            />

            {/* Active Questions Chips */}
            <div className="w-full mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Perguntas na Roleta ({activeQuestions.length})
                </span>
                <button
                  onClick={() => handleOpenAdmin('questions')}
                  className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer"
                >
                  Gerenciar Perguntas &rarr;
                </button>
              </div>

              {activeQuestions.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Nenhuma pergunta ativa. Acesse o banco de perguntas para cadastrar ou ativar questões.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activeQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      title={q.title}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 max-w-[240px]"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getSliceColor(idx, activeQuestions.length) }}
                      />
                      <span className="font-bold text-slate-500 text-[10px] shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-slate-800 truncate">{q.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Player Profile & Recent Game History */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Player Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                  Jogador em Ação
                </span>
                <button
                  onClick={() => setIsUserSwitcherOpen(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer"
                >
                  Trocar Jogador
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-sm"
                  style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    {currentUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{currentUser.email}</span>
                    {currentUser.role === 'admin' && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Player stats grid (without points) */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Jogadas
                  </span>
                  <span className="text-base font-black text-slate-900">
                    {currentUser.totalGamesPlayed || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Acertos
                  </span>
                  <span className="text-base font-black text-emerald-600">
                    {currentUser.totalCorrectAnswers || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Taxa
                  </span>
                  <span className="text-base font-black text-indigo-600">
                    {accuracy}%
                  </span>
                </div>
              </div>
            </div>

            {/* Recent History Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-600">
                    Últimas Jogadas
                  </span>
                </div>
                <button
                  onClick={() => handleOpenAdmin('history')}
                  className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer"
                >
                  Ver Histórico &rarr;
                </button>
              </div>

              {recentHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl">
                  Gire a roleta para registrar suas primeiras rodadas no banco!
                </div>
              ) : (
                <div className="space-y-2">
                  {recentHistory.map(entry => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 truncate max-w-[170px]">
                          {entry.userName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {entry.hasAnswer === false ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                              Registrada
                            </span>
                          ) : entry.isCorrect ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Acertou
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" /> Errou
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 truncate">
                        <strong>Pergunta:</strong> {entry.questionTitle}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* QUESTION MODAL */}
      {activeQuestion && isQuestionModalOpen && (
        <QuestionModal
          isOpen={isQuestionModalOpen}
          question={activeQuestion}
          onAnswerSubmitted={handleAnswerSubmitted}
          onClose={() => setIsQuestionModalOpen(false)}
        />
      )}

      {/* ADMIN & QUESTIONS DATABASE MODAL */}
      <AdminModal
        isOpen={isAdminOpen}
        initialTab={adminInitialTab}
        onClose={() => setIsAdminOpen(false)}
        onDatabaseUpdated={refreshFromDb}
      />

      {/* USER SWITCHER MODAL */}
      <UserSwitcherModal
        isOpen={isUserSwitcherOpen}
        currentUser={currentUser}
        onSelectUser={u => {
          setCurrentUser(u);
        }}
        onClose={() => setIsUserSwitcherOpen(false)}
        onUserCreated={refreshFromDb}
      />

      {/* RULES MODAL */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        onOpenAdmin={() => {
          setIsRulesOpen(false);
          handleOpenAdmin('questions');
        }}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  AlertCircle,
  X,
} from 'lucide-react';
import { Question } from '../types';
import { sound } from '../utils/sound';
import { checkWrittenAnswer } from '../services/db';

interface QuestionModalProps {
  question: Question;
  isOpen: boolean;
  onAnswerSubmitted: (params: {
    question: Question;
    playerAnswer: string;
    isCorrect: boolean;
    hasAnswer: boolean;
  }) => void;
  onClose: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  isOpen,
  onAnswerSubmitted,
  onClose,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasOptions = Boolean(question.options && question.options.length > 0);
  const hasCorrectOption = Boolean(question.options?.some(o => o.isCorrect));
  const hasAcceptedAnswers = Boolean(question.acceptedAnswers && question.acceptedAnswers.length > 0);

  // Whether this question actually has a defined answer/gabarito
  const hasDefinedAnswer =
    (hasOptions && hasCorrectOption) || (question.type === 'written' && hasAcceptedAnswers);

  // Whether this is a question with no alternatives
  const isFreeQuestionWithoutAlternatives = !hasOptions;

  // Reset state when a new question arrives
  useEffect(() => {
    if (isOpen) {
      setSelectedOptionId(null);
      setWrittenAnswer('');
      setIsAnswered(false);
      setIsCorrect(false);

      if (question.type === 'written') {
        setTimeout(() => inputRef.current?.focus(), 250);
      }
    }
  }, [isOpen, question]);

  // Multiple Choice / Single Choice selection
  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOptionId(optionId);
    sound.playClick();

    const chosenOption = question.options?.find(o => o.id === optionId);
    const correct = hasCorrectOption ? Boolean(chosenOption?.isCorrect) : true;

    submitFinalAnswer(chosenOption?.text || '', correct, hasCorrectOption);
  };

  // Written submission
  const handleWrittenSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered) return;

    const trimmed = writtenAnswer.trim();
    if (!trimmed && hasAcceptedAnswers) return;

    const correct = hasAcceptedAnswers
      ? checkWrittenAnswer(trimmed, question.acceptedAnswers || [])
      : true;

    submitFinalAnswer(trimmed || '(Sem resposta digitada)', correct, hasAcceptedAnswers);
  };

  const submitFinalAnswer = (answerText: string, correct: boolean, hasAnswer: boolean) => {
    setIsAnswered(true);
    setIsCorrect(correct);

    if (hasAnswer) {
      if (correct) {
        sound.playCorrect();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#F59E0B', '#6366F1', '#EC4899'],
          });
        } catch {
          // Safe fallback
        }
      } else {
        sound.playWrong();
      }
    } else {
      sound.playClick();
    }

    onAnswerSubmitted({
      question,
      playerAnswer: answerText,
      isCorrect: correct,
      hasAnswer,
    });
  };

  const handleCloseAction = () => {
    sound.playClick();
    if (!isAnswered && isFreeQuestionWithoutAlternatives && !hasAcceptedAnswers) {
      onAnswerSubmitted({
        question,
        playerAnswer: writtenAnswer.trim() || '(Visualizada)',
        isCorrect: true,
        hasAnswer: false,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  let correctAnswerDisplay = '';
  if (question.type === 'written' && hasAcceptedAnswers) {
    correctAnswerDisplay = (question.acceptedAnswers || []).join(' / ');
  } else if (hasOptions && hasCorrectOption) {
    const correctOpt = question.options?.find(o => o.id === 'opt_correct' || o.isCorrect);
    correctAnswerDisplay = correctOpt?.text || '';
  }

  const typeLabel =
    question.type === 'open' || (!hasOptions && question.type !== 'written')
      ? 'Pergunta sem alternativas'
      : question.type === 'multiple_choice'
      ? 'Múltipla Escolha'
      : question.type === 'single_choice'
      ? 'Escolha Simples'
      : hasAcceptedAnswers
      ? 'Pergunta Escrita'
      : 'Pergunta Aberta';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-600 block">
              Pergunta Sorteada
            </span>
            <span className="text-[11px] text-slate-500">{typeLabel}</span>
          </div>

          <button
            onClick={handleCloseAction}
            title="Fechar"
            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-white">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {question.title}
            </h2>
            {question.description && (
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                {question.description}
              </p>
            )}
          </div>

          {/* Multiple Choice Options */}
          {question.type === 'multiple_choice' && hasOptions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {question.options!.map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                let btnStyle =
                  'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300';

                if (isAnswered) {
                  if (hasCorrectOption) {
                    if (opt.isCorrect) {
                      btnStyle =
                        'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20';
                    } else if (selectedOptionId === opt.id) {
                      btnStyle =
                        'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20';
                    } else {
                      btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                    }
                  } else if (selectedOptionId === opt.id) {
                    btnStyle = 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect(opt.id)}
                    disabled={isAnswered}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left font-medium transition cursor-pointer active:scale-[0.98] ${btnStyle}`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 text-slate-700">
                      {letter}
                    </span>
                    <span className="text-sm leading-tight flex-1">{opt.text}</span>
                    {isAnswered && hasCorrectOption && opt.isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswered && hasCorrectOption && selectedOptionId === opt.id && !opt.isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Single Choice Options */}
          {question.type === 'single_choice' && hasOptions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {question.options!.map(opt => {
                let btnStyle =
                  'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300';

                if (isAnswered) {
                  if (hasCorrectOption) {
                    if (opt.isCorrect) {
                      btnStyle =
                        'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20';
                    } else if (selectedOptionId === opt.id) {
                      btnStyle =
                        'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20';
                    } else {
                      btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                    }
                  } else if (selectedOptionId === opt.id) {
                    btnStyle = 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect(opt.id)}
                    disabled={isAnswered}
                    className={`flex items-center justify-center gap-3 py-4 px-5 rounded-2xl border text-center font-bold text-base transition cursor-pointer active:scale-[0.98] ${btnStyle}`}
                  >
                    <span>{opt.text}</span>
                    {isAnswered && hasCorrectOption && opt.isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    {isAnswered && hasCorrectOption && selectedOptionId === opt.id && !opt.isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Written Question */}
          {question.type === 'written' && (
            <form onSubmit={handleWrittenSubmit} className="space-y-3 pt-1">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={writtenAnswer}
                  onChange={e => setWrittenAnswer(e.target.value)}
                  disabled={isAnswered}
                  placeholder={
                    hasAcceptedAnswers
                      ? 'Digite sua resposta e pressione Enviar...'
                      : 'Digite uma resposta (opcional)...'
                  }
                  className={`w-full px-4 py-3.5 pr-28 rounded-2xl bg-white border text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:outline-none transition ${
                    isAnswered
                      ? hasAcceptedAnswers
                        ? isCorrect
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : 'border-rose-500 bg-rose-50 text-rose-900'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                />
                {!isAnswered && (
                  <button
                    type="submit"
                    disabled={hasAcceptedAnswers && !writtenAnswer.trim()}
                    className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Enviar</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {hasAcceptedAnswers && (
                <p className="text-[11px] text-slate-500">
                  Dica: O sistema tolera pequenas variações de acentuação e maiúsculas.
                </p>
              )}
            </form>
          )}

          {/* Explanation for open / no-answer question */}
          {!isAnswered && !hasOptions && !hasAcceptedAnswers && question.explanation && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Observação: </strong>
                {question.explanation}
              </div>
            </div>
          )}

          {/* Answer Display when answered */}
          {isAnswered && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {hasDefinedAnswer ? (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {isCorrect ? (
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-base">
                      {isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta!'}
                    </div>

                    {correctAnswerDisplay && (
                      <div className="mt-1 text-xs sm:text-sm">
                        <strong>Resposta: </strong> {correctAnswerDisplay}
                      </div>
                    )}

                    {question.explanation && (
                      <div className="mt-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">Explicação: </strong>
                          {question.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 text-slate-800 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-base">Resposta Registrada</div>
                    {question.explanation && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">Observação: </strong>
                          {question.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions: Close Button */}
        {(isAnswered || (!hasOptions && !hasAcceptedAnswers)) && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              onClick={handleCloseAction}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>Fechar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Question } from '../types';
import { sound } from '../utils/sound';
import { Dices } from 'lucide-react';

interface RouletteWheelProps {
  questions: Question[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (question: Question) => void;
  disabled?: boolean;
}

const SLICE_COLORS = [
  '#E11D48', // Rose
  '#0284C7', // Sky Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#16A34A', // Green
  '#2563EB', // Blue
];

export const getSliceColor = (index: number, total: number): string => {
  const colorIdx = index % SLICE_COLORS.length;
  if (total > 1 && index === total - 1 && colorIdx === 0) {
    return SLICE_COLORS[1];
  }
  return SLICE_COLORS[colorIdx];
};

function truncateLabel(text: string, maxLen: number): string {
  const clean = text.trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 1).trimEnd() + '…';
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  questions,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  disabled = false,
}) => {
  const activeQuestions = questions.filter(q => q.active);
  const numSegments = Math.max(activeQuestions.length, 1);
  const segmentAngle = 360 / numSegments;

  const [currentRotation, setCurrentRotation] = useState<number>(0);
  const [highlightedQuestion, setHighlightedQuestion] = useState<{
    question: Question;
    color: string;
    index: number;
  } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickAngleRef = useRef<number>(0);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Spin handler with realistic deceleration curve
  const handleSpin = useCallback(() => {
    if (isSpinning || disabled || activeQuestions.length === 0) return;

    onSpinStart();
    setHighlightedQuestion(null);
    sound.playSpinStart();

    const targetIndex = Math.floor(Math.random() * numSegments);
    const targetQuestion = activeQuestions[targetIndex];
    const targetColor = getSliceColor(targetIndex, numSegments);

    const segmentOffset = (Math.random() * 0.7 + 0.15) * segmentAngle;
    const targetAngleWithinTurn =
      (numSegments - targetIndex) * segmentAngle -
      segmentAngle / 2 +
      (segmentOffset - segmentAngle / 2);

    const extraTurns = (6 + Math.floor(Math.random() * 4)) * 360;
    const startAngle = currentRotation;
    const finalAngle =
      startAngle +
      extraTurns +
      ((targetAngleWithinTurn - (startAngle % 360) + 360) % 360);

    const spinDuration = 4800; // 4.8 seconds
    const startTime = performance.now();
    lastTickAngleRef.current = startAngle;

    const easeOutCubic = (t: number): number => {
      const p = 1 - t;
      return 1 - p * p * p * p;
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easedProgress = easeOutCubic(progress);

      const angleNow = startAngle + (finalAngle - startAngle) * easedProgress;
      setCurrentRotation(angleNow);

      const angleDiff = Math.abs(angleNow - lastTickAngleRef.current);
      if (angleDiff >= segmentAngle) {
        sound.playTick(650 - Math.min(progress * 250, 250));
        lastTickAngleRef.current = angleNow;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentRotation(finalAngle);
        setHighlightedQuestion({
          question: targetQuestion,
          color: targetColor,
          index: targetIndex,
        });
        sound.playStopChime();
        setTimeout(() => {
          onSpinEnd(targetQuestion);
        }, 600);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [
    isSpinning,
    disabled,
    activeQuestions,
    numSegments,
    segmentAngle,
    currentRotation,
    onSpinStart,
    onSpinEnd,
  ]);

  // Keyboard shortcut: Spacebar to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpinning && !disabled && activeQuestions.length > 0) {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
          return;
        }
        e.preventDefault();
        handleSpin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpin, isSpinning, disabled, activeQuestions.length]);

  // Generate SVG paths for segments
  const size = 460;
  const center = size / 2;
  const radius = center - 24;

  const createSegmentPath = (index: number) => {
    const startDeg = index * segmentAngle - 90 - segmentAngle / 2;
    const endDeg = startDeg + segmentAngle;

    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = segmentAngle > 180 ? 1 : 0;

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-lg mx-auto py-4">
      {/* Target indicator / Pointer at the top */}
      <div className="relative z-20 flex flex-col items-center -mb-7">
        <div className="relative">
          <div className="w-10 h-12 flex items-center justify-center drop-shadow-md">
            <svg viewBox="0 0 40 48" className="w-10 h-12 fill-amber-500 stroke-white stroke-2 filter drop-shadow">
              <path d="M 20 44 L 4 12 A 16 16 0 0 1 36 12 Z" />
            </svg>
            <div className="absolute top-2 w-3.5 h-3.5 rounded-full bg-white shadow-inner" />
          </div>
        </div>
      </div>

      {/* Main Wheel Assembly */}
      <div className="relative p-3 rounded-full bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-[0_14px_36px_rgba(15,23,42,0.14)] border-4 border-white">
        {/* Outer Ring */}
        <div className="relative rounded-full p-2.5 bg-slate-800 border-2 border-slate-300">
          {/* The Spinning SVG Disc */}
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-72 h-72 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] drop-shadow-md transition-transform"
            style={{
              transform: `rotate(${currentRotation}deg)`,
              willChange: 'transform',
            }}
          >
            {activeQuestions.length === 0 ? (
              <circle cx={center} cy={center} r={radius} fill="#E2E8F0" stroke="#ffffff" strokeWidth="2.5" />
            ) : activeQuestions.length === 1 ? (
              <g>
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill={getSliceColor(0, 1)}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <text
                  x={center}
                  y={center - radius * 0.55}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FFFFFF"
                  fontWeight="800"
                  fontSize="14"
                  fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
                  style={{
                    paintOrder: 'stroke',
                    stroke: '#000000',
                    strokeWidth: '2.5px',
                    strokeLinejoin: 'round',
                  }}
                >
                  1. {truncateLabel(activeQuestions[0].title, 24)}
                </text>
              </g>
            ) : (
              activeQuestions.map((question, index) => {
                const midAngleDeg = index * segmentAngle - 90;
                const normalizedDeg = ((midAngleDeg % 360) + 360) % 360;
                const isLeftHalf = normalizedDeg > 90 && normalizedDeg < 270;

                const sliceColor = getSliceColor(index, numSegments);
                const maxChars = numSegments <= 8 ? 22 : numSegments <= 14 ? 17 : numSegments <= 20 ? 13 : 0;
                const labelText =
                  maxChars > 0
                    ? `${index + 1}. ${truncateLabel(question.title, maxChars)}`
                    : `#${index + 1}`;
                const fontSize =
                  numSegments > 22 ? '10' : numSegments > 16 ? '9.5' : numSegments > 10 ? '10.5' : '12';

                return (
                  <g key={question.id}>
                    <path
                      d={createSegmentPath(index)}
                      fill={sliceColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />

                    <g
                      transform={`translate(${center}, ${center}) rotate(${
                        isLeftHalf ? midAngleDeg + 180 : midAngleDeg
                      })`}
                      className="pointer-events-none"
                    >
                      <text
                        x={isLeftHalf ? -(radius * 0.63) : radius * 0.63}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#FFFFFF"
                        fontWeight="800"
                        fontSize={fontSize}
                        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
                        style={{
                          paintOrder: 'stroke',
                          stroke: '#000000',
                          strokeWidth: '2.5px',
                          strokeLinejoin: 'round',
                        }}
                      >
                        {labelText}
                      </text>
                    </g>
                  </g>
                );
              })
            )}

            {/* Outer Rim Pegs / Pins */}
            {Array.from({ length: Math.max(numSegments * 2, 12) }).map((_, i, arr) => {
              const pegDeg = i * (360 / arr.length) - 90;
              const pegRad = (pegDeg * Math.PI) / 180;
              const pegDistance = radius + 11;
              const px = center + pegDistance * Math.cos(pegRad);
              const py = center + pegDistance * Math.sin(pegRad);

              return (
                <circle
                  key={i}
                  cx={px}
                  cy={py}
                  r="3.5"
                  fill="#FEF08A"
                  stroke="#854D0E"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>

          {/* Center Hub & GIRAR Button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={handleSpin}
              disabled={isSpinning || disabled || activeQuestions.length === 0}
              className={`pointer-events-auto group relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-[0_8px_20px_rgba(0,0,0,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)] border-4 ${
                isSpinning || activeQuestions.length === 0
                  ? 'bg-slate-700 border-slate-400 opacity-90 cursor-not-allowed'
                  : 'bg-gradient-to-b from-amber-400 via-amber-500 to-rose-600 border-white hover:scale-105'
              }`}
              title={
                activeQuestions.length === 0
                  ? 'Adicione perguntas no menu para girar'
                  : isSpinning
                  ? 'Girando a roleta...'
                  : 'Clique para Girar (ou pressione Barra de Espaço)'
              }
            >
              <div className="absolute inset-1 rounded-full border border-white/30 pointer-events-none" />

              {isSpinning ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-amber-300 rounded-full animate-spin mb-1" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-200">
                    Girando
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <Dices className="w-5 h-5 sm:w-6 sm:h-6 text-white mb-0.5 group-hover:rotate-45 transition-transform" />
                  <span className="text-sm sm:text-base font-black uppercase tracking-wider text-white drop-shadow">
                    GIRAR!
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Status / Feedback below the wheel */}
      <div className="mt-5 text-center px-4 min-h-[52px]">
        {activeQuestions.length === 0 ? (
          <div className="text-rose-600 text-xs sm:text-sm font-semibold">
            Nenhuma pergunta ativa no banco. Adicione perguntas pelo menu dos 3 pontinhos.
          </div>
        ) : highlightedQuestion ? (
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 shadow-sm max-w-md">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: highlightedQuestion.color }}
            />
            <span className="text-xs sm:text-sm font-bold truncate">
              Pergunta #{highlightedQuestion.index + 1}:{' '}
              <span className="text-indigo-600">{highlightedQuestion.question.title}</span>
            </span>
          </div>
        ) : (
          <div className="text-slate-500 text-xs sm:text-sm font-medium">
            {isSpinning ? (
              <span className="text-indigo-600 font-semibold animate-pulse">
                Girando a roleta...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Clique no botão central <strong className="text-slate-900">GIRAR</strong> ou aperte{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono">
                  Espaço
                </kbd>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

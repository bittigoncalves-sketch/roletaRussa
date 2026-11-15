import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Volume2,
  VolumeX,
  User as UserIcon,
  HelpCircle,
  Database,
  Users,
  History,
  RotateCcw,
  Target,
} from 'lucide-react';
import { User } from '../types';
import { sound } from '../utils/sound';

interface HeaderProps {
  currentUser: User;
  onOpenAdmin: (initialTab?: 'questions' | 'users' | 'history') => void;
  onOpenUserSwitcher: () => void;
  onOpenRules: () => void;
  onResetDatabase: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAdmin,
  onOpenUserSwitcher,
  onOpenRules,
  onResetDatabase,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    sound.playClick();
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 shadow-sm text-white">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                Roleta Quiz
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Gire a roleta e responda às perguntas
            </p>
          </div>
        </div>

        {/* Right Controls: Player Picker, Sound & 3-Dots Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Current Player Picker Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenUserSwitcher();
            }}
            title="Trocar Jogador Ativo"
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer text-xs sm:text-sm font-medium"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[80px] sm:max-w-[130px] truncate hidden xs:inline">
              {currentUser.name}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Ativar Sons' : 'Silenciar Sons'}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
            aria-label="Controle de Áudio"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-slate-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-600" />
            )}
          </button>

          {/* 3 Pontinhos Dropdown (Kebab Menu) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                sound.playClick();
                setMenuOpen(!menuOpen);
              }}
              title="Menu do Sistema e Banco de Dados"
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                menuOpen
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              aria-expanded={menuOpen}
              aria-label="Mais opções e Banco de Perguntas"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                {/* Header of dropdown */}
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Administração & Banco
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    Gestão completa do jogo
                  </p>
                </div>

                <div className="p-1 space-y-0.5">
                  {/* Option 1: Logar no Banco de Perguntas e Respostas */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      sound.playClick();
                      onOpenAdmin('questions');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold hover:bg-indigo-50 text-slate-800 transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">
                        Banco de Perguntas
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal truncate">
                        Adicionar/editar múltipla escolha, escolha ou escritas
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Gerenciar Usuários */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      sound.playClick();
                      onOpenAdmin('users');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Gerenciar Usuários</div>
                      <div className="text-[11px] text-slate-500 font-normal truncate">
                        Cadastrar administradores e jogadores
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Histórico de Resultados */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      sound.playClick();
                      onOpenAdmin('history');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition">
                      <History className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Histórico de Resultados</div>
                      <div className="text-[11px] text-slate-500 font-normal truncate">
                        Ver acertos e respostas obtidas
                      </div>
                    </div>
                  </button>

                  {/* Option 4: Trocar Jogador */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      sound.playClick();
                      onOpenUserSwitcher();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Trocar Jogador</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        Entrar com outro perfil ou convidado
                      </div>
                    </div>
                  </button>
                </div>

                <div className="border-t border-slate-100 my-1"></div>

                <div className="p-1 space-y-0.5">
                  {/* Rules */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      sound.playClick();
                      onOpenRules();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Como Jogar & Regras</span>
                  </button>

                  {/* Clear all questions */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      sound.playClick();
                      onResetDatabase();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    <span>Limpar Perguntas e Histórico</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

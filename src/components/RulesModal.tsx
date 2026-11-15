import React from 'react';
import { X, HelpCircle, Dices, CheckCircle2, MoreVertical, Database } from 'lucide-react';
import { sound } from '../utils/sound';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, onOpenAdmin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-900 max-h-[85vh]">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Como Jogar & Regras</h3>
              <p className="text-[11px] text-slate-500">Guia rápido do Roleta Quiz</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Dices className="w-4 h-4 text-indigo-600" />
              1. Gire a Roleta
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              Pressione o botão central <strong>GIRAR</strong> ou a <strong>Barra de Espaço</strong>. A roleta sorteia diretamente uma das perguntas ativas cadastradas no banco de dados.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Tipos de Perguntas do Banco
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
              <li>
                <strong className="text-slate-800">Múltipla Escolha / Escolha Simples:</strong> Opções para selecionar (quando cadastradas).
              </li>
              <li>
                <strong className="text-slate-800">Pergunta Escrita:</strong> Campo de texto para digitar a resposta.
              </li>
              <li>
                <strong className="text-slate-800">Pergunta Livre / Sem Resposta:</strong> Pergunta direta sem necessidade de alternativas ou gabarito prévio.
              </li>
            </ul>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
            <h4 className="font-bold text-indigo-900 flex items-center gap-2">
              <MoreVertical className="w-4 h-4 text-indigo-600" />
              3. Menu de 3 Pontinhos (Admin & Banco de Dados)
            </h4>
            <p className="text-indigo-800/80 leading-relaxed text-xs">
              Clique nos <strong>3 pontinhos</strong> no canto superior direito para logar no Banco de Perguntas e Respostas, gerenciar usuários, cadastrar novas perguntas e visualizar o histórico de todas as jogadas.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="mt-2 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Acessar Painel do Banco de Perguntas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

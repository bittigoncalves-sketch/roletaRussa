import React, { useState } from 'react';
import { X, Check, UserPlus, Users } from 'lucide-react';
import { User } from '../types';
import { db } from '../services/db';
import { sound } from '../utils/sound';

interface UserSwitcherModalProps {
  isOpen: boolean;
  currentUser: User;
  onSelectUser: (user: User) => void;
  onClose: () => void;
  onUserCreated: () => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({
  isOpen,
  currentUser,
  onSelectUser,
  onClose,
  onUserCreated,
}) => {
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  if (!isOpen) return null;

  const handleSelect = (user: User) => {
    sound.playClick();
    db.setCurrentUser(user);
    onSelectUser(user);
    onClose();
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const created = db.addUser({
      name: newPlayerName.trim(),
      email: `${newPlayerName.toLowerCase().replace(/\s+/g, '')}@quiz.local`,
      role: 'player',
      avatarColor,
    });

    setUsers(db.getUsers());
    db.setCurrentUser(created);
    onSelectUser(created);
    onUserCreated();
    setNewPlayerName('');
    setIsAddingNew(false);
    sound.playCorrect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Selecionar Jogador</h3>
              <p className="text-[11px] text-slate-500">Escolha quem está jogando agora</p>
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

        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
          {users.map(u => {
            const isSelected = u.id === currentUser.id;

            return (
              <button
                key={u.id}
                onClick={() => handleSelect(u)}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300 text-slate-900'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                    style={{ backgroundColor: u.avatarColor || '#6366f1' }}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{u.name}</span>
                      {u.role === 'admin' && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-semibold">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {u.totalGamesPlayed || 0} jogadas • {u.totalCorrectAnswers || 0} acertos
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">Selecionar</span>
                )}
              </button>
            );
          })}

          {/* Quick Add Player Form */}
          {!isAddingNew ? (
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full py-3 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Entrar com Novo Jogador</span>
            </button>
          ) : (
            <form onSubmit={handleCreateNew} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Nome do Novo Jogador</label>
              <input
                type="text"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                autoFocus
                placeholder="Ex: Ana Paula"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPlayerName.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Cadastrar e Jogar</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

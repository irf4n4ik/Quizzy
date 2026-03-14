import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import { useAppState } from '../store';
import { Hash, Play, User } from 'lucide-react';

export default function JoinQuiz() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const { state, joinRoomByCode } = useAppState();
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedName = (playerName.trim() || state.user?.name || '').trim();

    if (!roomCode.trim() || !normalizedName) {
      setError('Введите код комнаты и имя игрока.');
      return;
    }
    if (state.user?.role === 'organizer') {
      setError('Организатор не может войти в комнату как игрок в этой вкладке.');
      return;
    }
    try {
      const room = await joinRoomByCode(roomCode, normalizedName);
      navigate(room.status === 'playing' ? '/play/question' : '/play/lobby');
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Не удалось войти в комнату.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-particles px-4 pt-24 pb-10">
      <div className="w-full max-w-md">
        <div className="surface-hero p-8 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-2xl shadow-lg shadow-neon-blue/20 animate-pulse-glow">
              <BrandMark className="h-full w-full" />
            </div>
            <h1 className="text-3xl font-bold text-white">Вход в комнату</h1>
            <p className="text-slate-400 mt-2">Введите код активной комнаты и имя игрока.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="field-label">Код комнаты</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  className="input-dark pl-12 text-2xl text-center tracking-[0.3em] font-mono uppercase"
                  placeholder="ABC123"
                  maxLength={6}
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div>
              <label className="field-label">Имя игрока</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  className="input-dark pl-12"
                  placeholder="Как вас показать в лидерборде?"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-neon btn-neon-blue w-full py-4 text-lg mt-4">
              <Play className="w-6 h-6" />
              Присоединиться
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

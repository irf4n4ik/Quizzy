import { useAppState } from '../../store';
import { useNavigate } from 'react-router-dom';
import { Users, Copy, Clock, Wifi, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Lobby() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const room = state.currentRoom;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (room?.status === 'playing') {
      navigate('/play/question');
    }
  }, [room?.status, navigate]);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-particles pt-20">
        <div className="text-center glass-card p-12">
          <p className="text-slate-400 text-lg mb-4">Активная комната не найдена</p>
          <button onClick={() => navigate('/join')} className="btn-neon">Перейти ко входу</button>
        </div>
      </div>
    );
  }

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-particles pt-20 px-4 pb-12">
      <div className="max-w-2xl mx-auto">
        {/* Quiz Info */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{room.quiz.title}</h1>
          <p className="text-slate-400">{room.quiz.description}</p>
        </div>

        {/* Room Code */}
        <div className="glass-card-strong p-8 text-center mb-8 relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none"></div>
          <p className="text-sm text-slate-400 mb-2">Код комнаты</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl font-mono font-bold tracking-[0.5em] bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
              {room.code}
            </span>
            <button onClick={copyCode} className="p-2 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white">
              {copied ? <CheckCircle className="w-5 h-5 text-neon-green" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-sm text-slate-500">Поделитесь кодом с остальными участниками</p>
        </div>

        {/* Status */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-center gap-3 text-yellow-400">
            <div className="animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-lg font-medium">Ожидаем, пока организатор запустит викторину...</span>
          </div>
        </div>

        {/* Quiz Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-white">{room.quiz.questionsCount}</div>
            <div className="text-sm text-slate-400">Вопросов</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-white">{room.quiz.timePerQuestion} сек</div>
            <div className="text-sm text-slate-400">Секунд на вопрос</div>
          </div>
        </div>

        {/* Players */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-neon-purple" />
            <h2 className="text-lg font-semibold text-white">Игроки ({room.players.length})</h2>
          </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {room.players.map((player, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                  <Wifi className="w-4 h-4 text-neon-green" />
                  <span className="text-sm text-white truncate">{player.name}</span>
                  {player.userId === state.user?.id && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple ml-auto">Вы</span>
                  )}
                </div>
              ))}
            </div>
            {room.players.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Нет игроков
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

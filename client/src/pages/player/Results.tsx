import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../store';
import { Trophy, Medal, Home, RotateCcw, Crown, Star } from 'lucide-react';

export default function Results() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const room = state.currentRoom;

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-particles pt-20">
        <div className="text-center glass-card p-12">
          <p className="text-slate-400">Нет доступных результатов</p>
          <button onClick={() => navigate('/')} className="btn-neon mt-4">На главную</button>
        </div>
      </div>
    );
  }

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const top3 = sortedPlayers.slice(0, 3);
  
  const userPlayer = sortedPlayers.find(p => p.userId === state.user?.id);
  const userRank = userPlayer ? sortedPlayers.indexOf(userPlayer) + 1 : null;

  const handleGoHome = () => {
    dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
    navigate(state.user?.role === 'organizer' ? '/organizer' : '/player');
  };

  const medalIcons = ['🥇', '🥈', '🥉'];
  const medalClasses = ['medal-gold', 'medal-silver', 'medal-bronze'];

  return (
    <div className="min-h-screen bg-particles pt-20 px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-neon-purple text-sm mb-4">
            <Trophy className="w-4 h-4" /> Викторина завершена!
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{room.quiz.title}</h1>
          <p className="text-slate-400">Итоговые результаты • {room.players.length} игроков</p>
        </div>

        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <div className="glass-card-strong p-8 mb-8 relative overflow-hidden">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-end justify-center gap-4 mb-8">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="text-center flex-1 max-w-[160px]">
                  <div className="text-4xl mb-2">🥈</div>
                  <div className="glass-card p-4 rounded-xl" style={{ minHeight: '100px' }}>
                    <div className="font-semibold text-white truncate">{top3[1].name}</div>
                    <div className="text-lg font-bold text-slate-300 mt-1">{top3[1].score.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">баллов</div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="text-center flex-1 max-w-[180px]">
                  <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-1" />
                  <div className="text-5xl mb-2">🥇</div>
                  <div className="glass-card p-5 rounded-xl glow-purple" style={{ minHeight: '120px' }}>
                    <div className="font-bold text-white text-lg truncate">{top3[0].name}</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mt-1">
                      {top3[0].score.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">баллов</div>
                    {top3[0].userId === state.user?.id && (
                      <div className="mt-2 text-xs px-2 py-1 rounded-full bg-neon-purple/20 text-neon-purple inline-block">
                        <Star className="w-3 h-3 inline" /> Это вы!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="text-center flex-1 max-w-[160px]">
                  <div className="text-4xl mb-2">🥉</div>
                  <div className="glass-card p-4 rounded-xl" style={{ minHeight: '80px' }}>
                    <div className="font-semibold text-white truncate">{top3[2].name}</div>
                    <div className="text-lg font-bold text-slate-300 mt-1">{top3[2].score.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">баллов</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Your Result */}
        {userPlayer && userRank && userRank > 3 && (
          <div className="glass-card p-6 mb-6 border-neon-purple/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center text-lg font-bold text-neon-purple">
                  #{userRank}
                </div>
                <div>
                  <div className="font-semibold text-white">{userPlayer.name} <span className="text-xs text-neon-purple">(Вы)</span></div>
                </div>
              </div>
              <div className="text-xl font-bold text-neon-purple">{userPlayer.score.toLocaleString()} баллов</div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Medal className="w-5 h-5 text-neon-purple" />
            Полная таблица лидеров
          </h2>
          <div className="space-y-2">
            {sortedPlayers.map((player, i) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  player.userId === state.user?.id
                    ? 'bg-neon-purple/10 border border-neon-purple/20'
                    : 'bg-white/5 border border-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    i < 3 ? medalClasses[i] : 'text-slate-400'
                  }`}>
                    {i < 3 ? medalIcons[i] : `#${i + 1}`}
                  </div>
                  <span className="font-medium text-white">
                    {player.name}
                    {player.userId === state.user?.id && <span className="text-xs text-neon-purple ml-2">(Вы)</span>}
                  </span>
                </div>
                <span className="font-semibold text-slate-300">{player.score.toLocaleString()} баллов</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={handleGoHome} className="btn-neon py-3 px-8">
            <Home className="w-5 h-5" />
            На главную
          </button>
          <button onClick={() => navigate('/join')} className="btn-outline py-3 px-8">
            <RotateCcw className="w-5 h-5" />
            Играть снова
          </button>
        </div>
      </div>
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../../store';
import { Play, Trophy, Target, BarChart3, Clock, GamepadIcon } from 'lucide-react';
import { useEffect } from 'react';

export default function PlayerDashboard() {
  const { state, loadPlayerDashboard } = useAppState();
  const navigate = useNavigate();
  const user = state.user;
  const stats = state.playerStats;

  useEffect(() => {
    void loadPlayerDashboard();
  }, [loadPlayerDashboard]);

  const playerHistory = state.history.filter(h => h.role === 'player' && h.userId === user?.id);

  return (
    <div className="min-h-screen bg-particles pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            С возвращением, <span className="text-glow-purple bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">{user?.name}</span>!
          </h1>
          <p className="text-slate-400">Готовы к новому вызову?</p>
        </div>

        {/* Quick Join */}
        <div className="glass-card-strong p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-neon-blue/10 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Присоединиться к живой викторине</h2>
            <p className="text-slate-400">Введите код комнаты для участия в игре</p>
          </div>
          <Link to="/join" className="btn-neon btn-neon-blue py-3 px-6 shrink-0">
            <Play className="w-5 h-5" />
            Присоединиться
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: GamepadIcon, label: 'Игр сыграно', value: stats?.totalGames ?? playerHistory.length, color: 'from-neon-purple to-indigo-600' },
            { icon: Trophy, label: 'Побед', value: stats?.wins ?? playerHistory.filter(h => h.rank === 1).length, color: 'from-yellow-500 to-orange-500' },
            { icon: Target, label: 'Общий счёт', value: (stats?.totalScore ?? playerHistory.reduce((sum, h) => sum + (h.score || 0), 0)).toLocaleString(), color: 'from-neon-blue to-neon-cyan' },
            { icon: BarChart3, label: 'Средний счёт', value: stats?.averageScore ?? 0, color: 'from-neon-green to-teal-500' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quiz History */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-neon-purple" />
              История викторин
            </h2>
          </div>
          {playerHistory.length === 0 ? (
            <div className="text-center py-12">
              <GamepadIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Вы ещё не сыграли ни одной игры</p>
              <p className="text-sm text-slate-500">Присоединитесь к викторине, чтобы увидеть историю здесь</p>
              <button onClick={() => navigate('/join')} className="btn-neon mt-4 py-2 px-6 text-sm">
                Играть сейчас
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {playerHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neon-purple/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-cyan/20 flex items-center justify-center text-lg">
                      {h.rank === 1 ? '🥇' : h.rank === 2 ? '🥈' : h.rank === 3 ? '🥉' : '🎮'}
                    </div>
                    <div>
                      <div className="font-medium text-white">{h.quizTitle}</div>
                      <div className="text-sm text-slate-400">
                        {new Date(h.date).toLocaleDateString()} • {h.playerCount} игроков
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-neon-purple">{h.score?.toLocaleString()} очков</div>
                    <div className="text-sm text-slate-400">Место #{h.rank}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

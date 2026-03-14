import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../../store';
import { PlusCircle, Play, Trash2, Edit, Users, Clock, BarChart3, GamepadIcon, FileQuestion } from 'lucide-react';
import { useEffect } from 'react';

export default function OrganizerDashboard() {
  const { state, dispatch, loadOrganizerDashboard } = useAppState();
  const navigate = useNavigate();
  const user = state.user;
  const stats = state.organizerStats;

  useEffect(() => {
    void loadOrganizerDashboard();
  }, [loadOrganizerDashboard]);

  const myQuizzes = state.quizzes.filter(q => q.createdBy === user?.id);
  const hostHistory = state.history.filter(h => h.role === 'host' && h.userId === user?.id);

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_QUIZ', payload: id });
  };

  return (
    <div className="min-h-screen bg-particles pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Панель организатора
            </h1>
            <p className="text-slate-400">Управляйте викторинами и отслеживайте статистику</p>
          </div>
          <Link to="/organizer/create" className="btn-neon py-3 px-6">
            <PlusCircle className="w-5 h-5" />
            Создать викторину
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileQuestion, label: 'Всего викторин', value: stats?.totalQuizzes ?? myQuizzes.length, color: 'from-neon-purple to-indigo-600' },
            { icon: GamepadIcon, label: 'Проведено игр', value: stats?.hostedGames ?? hostHistory.length, color: 'from-neon-blue to-neon-cyan' },
            { icon: Users, label: 'Всего игроков', value: stats?.totalPlayers ?? hostHistory.reduce((sum, h) => sum + h.playerCount, 0), color: 'from-neon-pink to-neon-purple' },
            { icon: BarChart3, label: 'Среднее игроков/игра', value: stats?.averagePlayers ?? 0, color: 'from-neon-green to-teal-500' },
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

        {/* My Quizzes */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-neon-purple" />
              Мои викторины
            </h2>
          </div>

          {myQuizzes.length === 0 ? (
            <div className="text-center py-12">
              <FileQuestion className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Пока нет викторин</p>
              <p className="text-sm text-slate-500 mb-4">Создайте первую викторину, чтобы начать</p>
              <Link to="/organizer/create" className="btn-neon py-2 px-6 text-sm">
                <PlusCircle className="w-4 h-4" />
                Создать викторину
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neon-purple/20 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center shrink-0">
                      <FileQuestion className="w-6 h-6 text-neon-purple" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{quiz.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <FileQuestion className="w-3 h-3" />
                          {quiz.questions.length} вопросов
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {quiz.timePerQuestion} сек/вопрос
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs">{quiz.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/organizer/edit/${quiz.id}`)}
                      className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-neon-blue transition-all"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/organizer/host/${quiz.id}`)}
                      className="btn-neon btn-neon-green py-2 px-4 text-sm"
                    >
                      <Play className="w-4 h-4" />
                      Провести
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Host History */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-neon-blue" />
            История проведённых игр
          </h2>
          {hostHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <GamepadIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Пока нет проведённых игр
            </div>
          ) : (
            <div className="space-y-3">
              {hostHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <div className="font-medium text-white">{h.quizTitle}</div>
                    <div className="text-sm text-slate-400">
                      {new Date(h.date).toLocaleDateString()} • Комната: {h.roomCode}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    {h.playerCount} игроков
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

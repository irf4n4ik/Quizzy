import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../../store';
import {
  Copy, CheckCircle, Users, Play, SkipForward, StopCircle,
  Clock, Trophy, Wifi, Zap
} from 'lucide-react';

export default function HostRoom() {
  const { quizId } = useParams();
  const { state, dispatch, createRoom, loadOrganizerDashboard } = useAppState();
  const navigate = useNavigate();
  const quiz = state.quizzes.find(q => q.id === quizId);
  const room = state.currentRoom?.quizId === quizId ? state.currentRoom : null;
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!quizId || room?.quizId === quizId || !state.authReady) return;

    const hasStoredRoom =
      typeof window !== 'undefined' && Boolean(window.localStorage.getItem('quizzy:active-room'));
    if (hasStoredRoom) return;

    if (quiz) {
      void createRoom(quiz.id);
    } else {
      void loadOrganizerDashboard();
    }
  }, [createRoom, loadOrganizerDashboard, quiz, quizId, room?.quizId, state.authReady]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (room?.status === 'playing' && room.questionEndsAt) {
      const updateTimeLeft = () => {
        const nextTimeLeft = Math.max(0, Math.ceil((room.questionEndsAt! - Date.now()) / 1000));
        setTimeLeft(nextTimeLeft);
      };
      updateTimeLeft();
      timerRef.current = setInterval(updateTimeLeft, 500);
    } else {
      setTimeLeft(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room?.questionEndsAt, room?.status]);

  if (!quiz && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-particles pt-20">
        <div className="text-center glass-card p-12">
          <p className="text-slate-400">Викторина не найдена</p>
          <button onClick={() => navigate('/organizer')} className="btn-neon mt-4">Вернуться</button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    dispatch({ type: 'START_GAME' });
  };

  const handleNextQuestion = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (room.currentQuestionIndex >= room.quiz.questionsCount - 1) {
      handleEnd();
      return;
    }
    dispatch({ type: 'NEXT_QUESTION' });
  };

  const handleEnd = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    dispatch({ type: 'END_GAME' });
  };

  const currentQuestion = room.status === 'playing' ? room.currentQuestion : null;
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const isLastQuestion = room.currentQuestionIndex >= room.quiz.questionsCount - 1;

  return (
    <div className="min-h-screen bg-particles pt-20 px-4 pb-12">
      <div className="max-w-5xl mx-auto">
        {/* Header with Room Code */}
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{room.quiz.title}</h1>
              <p className="text-slate-400 text-sm mt-1">
                {room.status === 'waiting' ? 'Ожидание игроков...' :
                  room.status === 'playing' ? `Вопрос ${room.currentQuestionIndex + 1} из ${room.quiz.questionsCount}` :
                    'Викторина завершена!'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Код комнаты</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-bold tracking-wider bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                    {room.code}
                  </span>
                  <button onClick={copyCode} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                    {copied ? <CheckCircle className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Waiting State */}
            {room.status === 'waiting' && (
              <>
                <div className="glass-card p-8 text-center">
                  <div className="animate-pulse mb-6">
                    <Zap className="w-16 h-16 text-neon-purple mx-auto" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Готовы начать?</h2>
                  <p className="text-slate-400 mb-6">
                    {room.players.length === 0
                      ? 'Добавьте игроков, затем начните викторину!'
                      : `${room.players.length} игрок${room.players.length > 1 ? 'ов' : ''} подключено и ожидает.`}
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleStart}
                      disabled={room.players.length === 0}
                      className={`btn-neon btn-neon-green py-3 px-8 text-lg ${room.players.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <Play className="w-5 h-5" />
                      Начать викторину
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Playing State - Question Display */}
            {room.status === 'playing' && currentQuestion && (
              <>
                {/* Timer */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neon-purple font-medium">
                      Вопрос {room.currentQuestionIndex + 1} / {room.quiz.questionsCount}
                    </span>
                    <span className="text-sm text-slate-400">
                      {room.quiz.questionsCount} вопросов в сценарии
                    </span>
                    <span className={`text-lg font-mono font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-neon-cyan'}`}>
                      <Clock className="w-4 h-4 inline mr-1" />
                      {timeLeft} сек
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${timeLeft > 10 ? 'bg-neon-green' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${(timeLeft / currentQuestion.timeLimit) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question Card */}
                <div className="glass-card-strong p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">{currentQuestion.text}</h2>
                  {currentQuestion.imageUrl && (
                    <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                      <img src={currentQuestion.imageUrl} alt="Изображение вопроса" className="max-h-80 mx-auto rounded-xl" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.answers.map((a, i) => (
                      <div
                        key={a.id}
                        className={`answer-${['a','b','c','d','a','b'][i]} border rounded-xl p-4 flex items-center gap-3`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold">
                          {['A','B','C','D','E','F'][i]}
                        </span>
                        <span className="font-medium text-white">{a.text}</span>
                        {a.isCorrect && (
                          <CheckCircle className="w-4 h-4 text-neon-green ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button onClick={handleNextQuestion} className="btn-neon py-3 px-8">
                    <SkipForward className="w-5 h-5" />
                    {isLastQuestion ? 'Завершить викторину' : 'Следующий вопрос'}
                  </button>
                  <button onClick={handleEnd} className="btn-outline py-3 px-6 text-red-400 border-red-400/30 hover:bg-red-400/10">
                    <StopCircle className="w-5 h-5" />
                    Завершить
                  </button>
                </div>
              </>
            )}

            {/* Finished State */}
            {room.status === 'finished' && (
              <div className="glass-card-strong p-8">
                <div className="text-center mb-8">
                  <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">Викторина завершена!</h2>
                  <p className="text-slate-400">Вот итоговые результаты</p>
                </div>
                <div className="space-y-3">
                  {sortedPlayers.map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl ${i < 3 ? 'bg-white/10 border border-white/10' : 'bg-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                        <span className="font-semibold text-white">{p.name}</span>
                      </div>
                      <span className="font-bold text-neon-purple">{p.score.toLocaleString()} баллов</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button onClick={() => { dispatch({ type: 'SET_CURRENT_ROOM', payload: null }); navigate('/organizer'); }} className="btn-neon py-3 px-8">
                    Назад к панели
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Players */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-neon-purple" />
                Игроки ({room.players.length})
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sortedPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Wifi className={`w-3 h-3 shrink-0 ${player.connected ? 'text-neon-green' : 'text-red-500'}`} />
                      <span className="text-sm text-white truncate">{player.name}</span>
                    </div>
                    {room.status !== 'waiting' && (
                      <span className="text-xs font-medium text-neon-purple shrink-0">{player.score} баллов</span>
                    )}
                  </div>
                ))}
                {room.players.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Пока нет игроков
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {room.status === 'playing' && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Статистика</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Прогресс</span>
                    <span className="text-white">{room.currentQuestionIndex + 1} / {room.quiz.questionsCount}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-purple to-neon-blue rounded-full"
                      style={{ width: `${((room.currentQuestionIndex + 1) / room.quiz.questionsCount) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Лучший результат</span>
                    <span className="text-neon-green">{sortedPlayers[0]?.score || 0} баллов</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

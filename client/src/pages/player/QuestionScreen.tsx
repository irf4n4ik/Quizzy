import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../store';
import { Clock, CheckCircle, Image as ImageIcon } from 'lucide-react';

export default function QuestionScreen() {
  const { state, submitAnswer } = useAppState();
  const navigate = useNavigate();
  const room = state.currentRoom;
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const question = room?.currentQuestion ?? null;

  useEffect(() => {
    if (room?.status === 'finished') {
      navigate('/play/results');
      return;
    }
  }, [room?.status, navigate]);

  useEffect(() => {
    if (!question) return;
    setSelectedAnswers([]);
    setSubmitted(false);
    setError('');
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    const updateTimeLeft = () => {
      const nextValue = room?.questionEndsAt
        ? Math.max(0, Math.ceil((room.questionEndsAt - Date.now()) / 1000))
        : question.timeLimit;
      setTimeLeft(nextValue);
    };
    updateTimeLeft();
    timerRef.current = setInterval(updateTimeLeft, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room?.currentQuestionIndex, room?.questionEndsAt, question]);

  useEffect(() => {
    if (question && room?.mySubmission?.questionId === question.id) {
      setSubmitted(room.mySubmission.submitted);
      setSelectedAnswers(room.mySubmission.selectedAnswerIds);
    }
  }, [question, room?.mySubmission]);

  if (!room || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-particles pt-20">
        <div className="text-center glass-card p-12">
          <p className="text-slate-400 text-lg">Ожидаем следующий вопрос...</p>
        </div>
      </div>
    );
  }

  const toggleAnswer = (answerId: string) => {
    if (submitted || timeLeft === 0 || revealAnswers) return;
    if (question.multipleChoice) {
      setSelectedAnswers(prev =>
        prev.includes(answerId) ? prev.filter(id => id !== answerId) : [...prev, answerId]
      );
    } else {
      setSelectedAnswers([answerId]);
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setError('');

    try {
      await submitAnswer(question.id, selectedAnswers);
      setSubmitted(true);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Не удалось отправить ответ.';
      setError(message);
      setSubmitted(false);
    }
  };

  const answerColors = ['answer-a', 'answer-b', 'answer-c', 'answer-d'];
  const answerLabels = ['A', 'B', 'C', 'D'];
  const timerPercent = (timeLeft / question.timeLimit) * 100;
  const timerColor = timeLeft > 10 ? 'bg-neon-green' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500';
  const revealAnswers = question.answers.some((answer) => answer.isCorrect !== undefined);

  return (
    <div className="min-h-screen bg-particles pt-20 px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        {/* Progress & Timer */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neon-purple font-medium">
              Вопрос {(room.currentQuestionIndex ?? 0) + 1} из {room.quiz.questionsCount}
            </span>
            <span className="text-sm text-slate-400">
              {question.points} баллов
            </span>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-neon-cyan'}`} />
              <span className={`text-lg font-mono font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-neon-cyan'}`}>
                {timeLeft}с
              </span>
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full ${timerColor} rounded-full transition-all duration-1000 ease-linear`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="glass-card-strong p-8 mb-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none"></div>
          
          {question.multipleChoice && (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-blue/10 text-neon-blue text-xs font-medium mb-4">
              <CheckCircle className="w-3 h-3" /> Несколько ответов
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-white leading-relaxed">{question.text}</h2>
          
          {question.imageUrl && (
            <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-white/5 p-4">
              <img src={question.imageUrl} alt="Изображение вопроса" className="max-h-80 mx-auto rounded-xl" />
            </div>
          )}
          {!question.imageUrl && (
            <div className="mt-4 hidden rounded-xl overflow-hidden border border-white/10">
              <div className="bg-white/5 p-8 flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-slate-600" />
              </div>
            </div>
          )}
        </div>

        {/* Answers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {question.answers.map((answer, i) => {
            const isSelected = selectedAnswers.includes(answer.id);
            const isCorrect = answer.isCorrect === true;
            const isWrongSelection = revealAnswers && isSelected && answer.isCorrect === false;
            const answerStateClass = revealAnswers
              ? isCorrect
                ? 'ring-2 ring-neon-green border-neon-green/60 bg-neon-green/10'
                : isWrongSelection
                  ? 'ring-2 ring-red-400 border-red-400/50 bg-red-500/10'
                  : isSelected
                    ? 'ring-2 ring-neon-purple border-neon-purple/50'
                    : ''
              : isSelected
                ? 'ring-2 ring-neon-purple scale-[1.02]'
                : '';

            return (
              <button
                key={answer.id}
                onClick={() => toggleAnswer(answer.id)}
                disabled={submitted || timeLeft === 0 || revealAnswers}
                className={`${answerColors[i]} border rounded-xl p-5 text-left transition-all duration-300 relative overflow-hidden
                  ${answerStateClass}
                  ${!submitted && timeLeft > 0 && !revealAnswers ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
                    {answerLabels[i]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-base font-medium text-white">{answer.text}</span>
                      {revealAnswers && isCorrect && (
                        <span className="shrink-0 rounded-full bg-neon-green/15 px-2.5 py-1 text-xs font-semibold text-neon-green">
                          Верный ответ
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className={`mt-2 text-xs font-medium ${revealAnswers ? (isWrongSelection ? 'text-red-300' : 'text-neon-purple') : 'text-neon-purple'}`}>
                        Ваш выбор
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit / Result */}
        {!submitted ? (
          <>
            {error && (
              <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <button
              onClick={() => void handleSubmit()}
              disabled={selectedAnswers.length === 0 || timeLeft === 0 || revealAnswers}
              className={`btn-neon w-full py-4 text-lg ${(selectedAnswers.length === 0 || timeLeft === 0 || revealAnswers) ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Отправить ответ
            </button>
            {timeLeft === 0 && !revealAnswers && (
              <div className="mt-4 text-center text-sm text-slate-500">
                Время на ответ вышло. Ожидаем раскрытия правильного ответа.
              </div>
            )}
          </>
        ) : (
          <div className="glass-card-strong p-8 text-center">
            <div className="text-5xl mb-4">{revealAnswers ? '🎯' : '✅'}</div>
            <h3 className={`text-2xl font-bold mb-2 ${revealAnswers ? 'text-white' : 'text-neon-green'}`}>
              {revealAnswers ? 'Ответы раскрыты' : 'Ответ отправлен'}
            </h3>
            <p className="text-slate-400 mb-4">
              {revealAnswers
                ? 'Ваш выбор отмечен на карточках, а правильный ответ подсвечен после завершения таймера.'
                : 'Ваш выбор сохранён. После завершения таймера откроется правильный ответ.'}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              {revealAnswers ? 'Ожидание следующего вопроса...' : 'Ожидание окончания таймера...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

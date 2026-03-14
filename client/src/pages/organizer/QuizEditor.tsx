import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../../store';
import type { Question, Answer } from '../../types';
import {
  ArrowLeft, PlusCircle, Trash2, Edit, Save, X, Check,
  Image as ImageIcon, Clock, FileQuestion, GripVertical, Play
} from 'lucide-react';

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export default function QuizEditor() {
  const { quizId } = useParams();
  const { state, updateQuiz, uploadQuestionImage, loadOrganizerDashboard } = useAppState();
  const navigate = useNavigate();
  const quiz = state.quizzes.find(q => q.id === quizId);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!quizId || quiz) return;
    void loadOrganizerDashboard();
  }, [loadOrganizerDashboard, quiz, quizId]);

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-particles pt-20">
        <div className="text-center glass-card p-12">
          <p className="text-slate-400">Викторина не найдена</p>
          <button onClick={() => navigate('/organizer')} className="btn-neon mt-4">Вернуться</button>
        </div>
      </div>
    );
  }

  const handleSaveQuestion = async (question: Question, imageFile?: File | null) => {
    let updatedQuestions: Question[];
    if (isCreating) {
      updatedQuestions = [...quiz.questions, question];
    } else {
      updatedQuestions = quiz.questions.map(q => q.id === question.id ? question : q);
    }
    try {
      let savedQuiz = await updateQuiz({ ...quiz, questions: updatedQuestions });
      if (imageFile) {
        const imageUrl = await uploadQuestionImage(savedQuiz.id, question.id, imageFile);
        savedQuiz = await updateQuiz({
          ...savedQuiz,
          questions: savedQuiz.questions.map((item) =>
            item.id === question.id ? { ...item, imageUrl } : item,
          ),
        });
      }
      setEditingQuestion(null);
      setIsCreating(false);
    } catch (saveError) {
      console.error(saveError);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const updatedQuestions = quiz.questions.filter(q => q.id !== questionId);
    await updateQuiz({ ...quiz, questions: updatedQuestions });
  };

  const handleNewQuestion = () => {
    const newQuestion: Question = {
      id: genId(),
      text: '',
      answers: [
        { id: genId(), text: '', isCorrect: false },
        { id: genId(), text: '', isCorrect: false },
        { id: genId(), text: '', isCorrect: false },
        { id: genId(), text: '', isCorrect: false },
      ],
      multipleChoice: false,
      timeLimit: quiz.timePerQuestion,
      points: 100,
    };
    setEditingQuestion(newQuestion);
    setIsCreating(true);
  };

  return (
    <div className="min-h-screen bg-particles pt-20 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/organizer')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к панели
        </button>

        {/* Quiz Header */}
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
              <p className="text-slate-400 text-sm mt-1">
                {quiz.category} • {quiz.questions.length} вопросов • {quiz.timePerQuestion} сек на вопрос
              </p>
            </div>
            <button
              onClick={() => navigate(`/organizer/host/${quiz.id}`)}
              className="btn-neon btn-neon-green py-2 px-6"
              disabled={quiz.questions.length === 0}
            >
              <Play className="w-4 h-4" />
              Провести викторину
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3 mb-6">
          {quiz.questions.map((q, i) => (
            <div
              key={q.id}
              className="glass-card p-5 flex items-start justify-between gap-4 group hover:border-neon-purple/20 transition-all"
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <GripVertical className="w-4 h-4 text-slate-600" />
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center text-sm font-bold text-neon-purple">
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-white mb-1 truncate">{q.text || 'Без названия'}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{q.answers.length} ответов</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {q.timeLimit} сек</span>
                    <span>{q.points} баллов</span>
                    {q.multipleChoice && <span className="text-neon-blue">Несколько вариантов</span>}
                    {q.imageUrl && <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Изображение</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {q.answers.map((a, ai) => (
                      <span key={ai} className={`text-xs px-2 py-0.5 rounded ${a.isCorrect ? 'bg-neon-green/20 text-neon-green' : 'bg-white/5 text-slate-500'}`}>
                        {a.text || `Вариант ${ai + 1}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setEditingQuestion(q); setIsCreating(false); }}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-neon-blue transition-all"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Question Button */}
        {!editingQuestion && (
          <button
            onClick={handleNewQuestion}
            className="w-full glass-card p-6 border-dashed flex items-center justify-center gap-3 text-slate-400 hover:text-neon-purple hover:border-neon-purple/30 transition-all"
          >
            <PlusCircle className="w-6 h-6" />
            <span className="text-lg font-medium">Добавить вопрос</span>
          </button>
        )}

        {/* Question Editor Modal */}
        {editingQuestion && (
          <QuestionEditorModal
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onCancel={() => { setEditingQuestion(null); setIsCreating(false); }}
          />
        )}
      </div>
    </div>
  );
}

function QuestionEditorModal({
  question,
  onSave,
  onCancel,
}: {
  question: Question;
  onSave: (q: Question, imageFile?: File | null) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(question.text);
  const [imageUrl, setImageUrl] = useState(question.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [answers, setAnswers] = useState<Answer[]>(question.answers);
  const [multipleChoice, setMultipleChoice] = useState(question.multipleChoice);
  const [timeLimit, setTimeLimit] = useState(question.timeLimit);
  const [points, setPoints] = useState(question.points);
  const [error, setError] = useState('');

  const updateAnswer = (index: number, field: keyof Answer, value: string | boolean) => {
    const updated = answers.map((a, i) => {
      if (i === index) {
        return { ...a, [field]: value };
      }
      if (field === 'isCorrect' && value === true && !multipleChoice) {
        return { ...a, isCorrect: false };
      }
      return a;
    });
    setAnswers(updated);
  };

  const addAnswer = () => {
    if (answers.length >= 6) return;
    setAnswers([...answers, { id: genId(), text: '', isCorrect: false }]);
  };

  const removeAnswer = (index: number) => {
    if (answers.length <= 2) return;
    setAnswers(answers.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!text.trim()) {
      setError('Введите текст вопроса');
      return;
    }
    if (answers.some(a => !a.text.trim())) {
      setError('Заполните текст для всех вариантов ответа');
      return;
    }
    if (!answers.some(a => a.isCorrect)) {
      setError('Отметьте хотя бы один правильный ответ');
      return;
    }
    onSave({
      ...question,
      text: text.trim(),
      imageUrl: imageFile ? question.imageUrl : imageUrl || undefined,
      answers,
      multipleChoice,
      timeLimit,
      points,
    }, imageFile);
  };

  const answerLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="glass-card-strong p-6 mt-6 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <FileQuestion className="w-5 h-5 text-neon-purple" />
          {question.text ? 'Редактировать вопрос' : 'Новый вопрос'}
        </h2>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Question Text */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Текст вопроса</label>
          <textarea
            className="input-dark min-h-[80px] resize-none"
            placeholder="Введите ваш вопрос..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>

        {/* Image */}
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-1.5">
            <ImageIcon className="w-4 h-4" /> Изображение вопроса
          </label>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              className="input-dark file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            />
            <input
              type="text"
              className="input-dark"
              placeholder="или вставьте ссылку на изображение"
              value={imageUrl}
              onChange={e => {
                setImageFile(null);
                setImageUrl(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Время (сек)</label>
            <input
              type="number"
              className="input-dark"
              min={5}
              max={120}
              value={timeLimit}
              onChange={e => setTimeLimit(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Баллы</label>
            <input
              type="number"
              className="input-dark"
              min={10}
              max={1000}
              step={10}
              value={points}
              onChange={e => setPoints(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Тип</label>
            <button
              type="button"
              onClick={() => setMultipleChoice(!multipleChoice)}
              className={`input-dark text-center text-sm font-medium transition-all ${
                multipleChoice ? 'border-neon-blue text-neon-blue' : 'text-slate-400'
              }`}
            >
              {multipleChoice ? 'Несколько вариантов' : 'Один вариант'}
            </button>
          </div>
        </div>

        {/* Answers */}
        <div>
          <label className="block text-sm text-slate-400 mb-3">
            Варианты ответов — нажмите ✓ чтобы отметить правильный
          </label>
          <div className="space-y-3">
            {answers.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-slate-400 shrink-0">
                  {answerLabels[i]}
                </span>
                <input
                  type="text"
                  className="input-dark flex-1"
                  placeholder={`Ответ ${answerLabels[i]}`}
                  value={a.text}
                  onChange={e => updateAnswer(i, 'text', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => updateAnswer(i, 'isCorrect', !a.isCorrect)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    a.isCorrect
                      ? 'bg-neon-green/20 border border-neon-green text-neon-green'
                      : 'bg-white/5 border border-white/10 text-slate-500 hover:border-white/20'
                  }`}
                >
                  <Check className="w-5 h-5" />
                </button>
                {answers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeAnswer(i)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {answers.length < 6 && (
            <button
              type="button"
              onClick={addAnswer}
              className="mt-3 text-sm text-neon-purple hover:text-neon-blue transition-colors flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" /> Добавить вариант ответа
            </button>
          )}
        </div>

        {/* Save */}
        <button onClick={handleSave} className="btn-neon w-full py-3">
          <Save className="w-5 h-5" />
          Сохранить вопрос
        </button>
      </div>
    </div>
  );
}

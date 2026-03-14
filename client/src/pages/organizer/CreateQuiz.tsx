import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../store';
import type { Quiz } from '../../types';
import { FileQuestion, Save, ArrowLeft, Tag, Clock, AlignLeft, FileText } from 'lucide-react';

const categories = ['Технологии', 'Наука', 'История', 'География', 'Спорт', 'Развлечения', 'Общие знания', 'Другое'];

export default function CreateQuiz() {
  const { state, createQuiz } = useAppState();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Технологии');
  const [timePerQuestion, setTimePerQuestion] = useState(20);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Требуется название викторины');
      return;
    }

    const quiz: Quiz = {
      id: '',
      title: title.trim(),
      description: description.trim(),
      category,
      createdBy: state.user?.id || '',
      questions: [],
      timePerQuestion,
      createdAt: Date.now(),
    };

    try {
      const created = await createQuiz(quiz);
      navigate(`/organizer/edit/${created.id}`);
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : 'Не удалось создать викторину.');
    }
  };

  return (
    <div className="min-h-screen bg-particles pt-20 px-4 pb-12">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/organizer')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к панели
        </button>

        <div className="glass-card-strong p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Создать новую викторину</h1>
              <p className="text-slate-400 text-sm">Укажите детали викторины</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 mb-1.5">
                <FileText className="w-4 h-4" /> Название викторины
              </label>
              <input
                type="text"
                className="input-dark"
                placeholder="Например, Основы веб-разработки"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 mb-1.5">
                <AlignLeft className="w-4 h-4" /> Описание
              </label>
              <textarea
                className="input-dark min-h-[100px] resize-none"
                placeholder="Краткое описание викторины..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-400 mb-1.5">
                  <Tag className="w-4 h-4" /> Категория
                </label>
                <select
                  className="input-dark"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c} value={c} style={{ background: '#1a1a3e' }}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-slate-400 mb-1.5">
                  <Clock className="w-4 h-4" /> Время на вопрос (сек)
                </label>
                <input
                  type="number"
                  className="input-dark"
                  min={5}
                  max={120}
                  value={timePerQuestion}
                  onChange={e => setTimePerQuestion(Number(e.target.value))}
                />
              </div>
            </div>

            <button type="submit" className="btn-neon w-full py-4 text-lg mt-4">
              <Save className="w-5 h-5" />
              Создать викторину
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

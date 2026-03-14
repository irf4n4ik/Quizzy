import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Sparkles,
  User,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'player' | 'organizer'>('player');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    const result = await register(name, email, password, role);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(result.user.role === 'organizer' ? '/organizer' : '/player');
  };

  return (
    <div className="min-h-screen bg-particles px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="auth-shell surface-hero relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="relative z-10 mx-auto max-w-xl">
              <div className="mb-8">
                <div className="section-kicker mb-4">
                  <Sparkles className="w-4 h-4" />
                  Создание аккаунта
                </div>
                <h1 className="text-4xl font-semibold leading-[0.98] text-white sm:text-5xl">
                  Создайте аккаунт
                  <span className="block bg-gradient-to-r from-[#eaf2ff] via-[#42b4ff] to-[#9f5cff] bg-clip-text text-transparent">
                    и запустите первую игру.
                  </span>
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                  Выберите, как хотите использовать платформу: играть в викторины или собирать собственные комнаты и управлять их динамикой.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="field-label">Имя</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      className="input-dark pl-12"
                      placeholder="Как к вам обращаться?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Эл. почта</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      className="input-dark pl-12"
                      placeholder="mail@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      className="input-dark pl-12"
                      placeholder="Не меньше 8 символов"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Я хочу</label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setRole('player')}
                      className={`choice-tile text-left ${role === 'player' ? 'is-active' : ''}`}
                    >
                      <div className="text-2xl">🎮</div>
                      <div className="mt-5 text-lg font-semibold text-white">Играть в викторины</div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Подключаться по коду, участвовать в раундах и следить за своим местом в лидерборде.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('organizer')}
                      className={`choice-tile text-left ${role === 'organizer' ? 'is-active' : ''}`}
                    >
                      <div className="text-2xl">🎯</div>
                      <div className="mt-5 text-lg font-semibold text-white">Организовывать игры</div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Создавать комнаты, запускать вопросы и вести всю игру как полноценный сценарий в реальном времени.
                      </p>
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-neon w-full py-4 text-base">
                  <UserPlus className="w-5 h-5" />
                  Зарегистрироваться
                </button>
              </form>

              <div className="mt-7 text-center text-sm text-slate-400">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="font-semibold text-neon-blue transition-colors hover:text-white">
                  Войти
                </Link>
              </div>
            </div>
          </div>

          <div className="auth-shell surface-card relative hidden overflow-hidden p-8 lg:block lg:p-10">
            <div className="relative z-10">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Новый аккаунт</div>
              <h2 className="mt-4 max-w-lg text-5xl font-semibold leading-[0.98] text-white">
                Роль выбирается сразу,
                <span className="block text-slate-200">а путь после регистрации остаётся понятным.</span>
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">
                После регистрации игрок может подключаться к комнатам, а организатор — создавать и запускать собственные викторины.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  'Игрок попадает в сценарий присоединения и участия без лишних решений.',
                  'Организатор уходит в создание и управление викториной сразу после регистрации.',
                  'Оба сценария визуально остаются частью единой публичной системы.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-neon-green shrink-0" />
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 surface-quiet p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-white">
                    <Users className="w-5 h-5 text-neon-blue" />
                    <span className="font-semibold">После регистрации</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <div className="text-sm font-semibold text-white">Игрок</div>
                    <div className="mt-2 text-sm leading-6 text-slate-400">
                      Быстро подключается по коду и начинает отвечать.
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <div className="text-sm font-semibold text-white">Организатор</div>
                    <div className="mt-2 text-sm leading-6 text-slate-400">
                      Переходит в панель и запускает свою первую игру.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                <Zap className="w-5 h-5 text-neon-purple shrink-0" />
                Один экран регистрации, два понятных сценария использования и единый визуальный характер продукта.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

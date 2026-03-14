import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store';
import BrandMark from '../components/BrandMark';
import {
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  Radio,
  Sparkles,
  Trophy,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'player' | 'organizer'>('player');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    const result = await login(email, password, role);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(result.user.role === 'organizer' ? '/organizer' : '/player');
  };

  return (
    <div className="min-h-screen bg-particles px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="auth-shell surface-card relative hidden overflow-hidden p-8 lg:block lg:p-10">
            <div className="relative z-10">
              <div className="section-kicker mb-5">
                <Sparkles className="w-4 h-4" />
                С возвращением
              </div>
              <h1 className="max-w-lg text-5xl font-semibold leading-[0.98] text-white">
                Возвращайтесь в комнату,
                <span className="block bg-gradient-to-r from-[#f0e4ff] via-[#9f5cff] to-[#42b4ff] bg-clip-text text-transparent">
                  где игра уже ждёт.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">
                Войдите как игрок или организатор и продолжите работу в нужном разделе без повторной настройки.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  'Игроки входят быстро и сразу понимают, что происходит в комнате.',
                  'Организатор получает короткий путь до панели и запуска следующей игры.',
                  'Интерфейс сохраняет тот же тон, что и главная страница продукта.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-neon-green shrink-0" />
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="surface-quiet p-4">
                  <div className="flex items-center gap-3 text-white">
                    <Radio className="w-5 h-5 text-neon-blue" />
                    <span className="font-semibold">Быстрый вход</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Присоединяйтесь к активной сессии или продолжайте вести уже запущенную игру.
                  </p>
                </div>
                <div className="surface-quiet p-4">
                  <div className="flex items-center gap-3 text-white">
                    <Trophy className="w-5 h-5 text-neon-purple" />
                    <span className="font-semibold">Живая игра</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Лидерборд, таймер и динамика остаются частью одного цельного опыта.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-shell surface-hero relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="relative z-10 mx-auto max-w-xl">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 h-16 w-16 overflow-hidden rounded-[22px] shadow-lg shadow-neon-purple/20">
                  <BrandMark className="h-full w-full" />
                </div>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">С возвращением</h2>
                <p className="mt-3 text-base text-slate-400 sm:text-lg">Войдите в аккаунт и продолжите игру в своём ритме.</p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
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
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Роль</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['player', 'organizer'] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setRole(item)}
                        className={`choice-pill ${role === item ? 'is-active' : ''}`}
                      >
                        <div className="text-sm font-semibold">
                          {item === 'player' ? 'Игрок' : 'Организатор'}
                        </div>
                        <div className="mt-1 text-xs opacity-70">
                          {item === 'player' ? 'Войти в комнату и отвечать' : 'Управлять сценарием и запуском'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-neon w-full py-4 text-base">
                  <LogIn className="w-5 h-5" />
                  Войти
                </button>
              </form>

              <div className="mt-7 text-center text-sm text-slate-400">
                Нет аккаунта?{' '}
                <Link to="/register" className="font-semibold text-neon-purple transition-colors hover:text-white">
                  Зарегистрироваться
                </Link>
              </div>
              <div className="mt-3 text-center">
                <span className="text-sm text-slate-500 transition-colors hover:text-slate-300">
                  Забыли пароль?
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

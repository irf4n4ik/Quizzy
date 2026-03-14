import { Link } from 'react-router-dom';
import { ArrowUpRight, Github, Mail, Sparkles } from 'lucide-react';
import BrandMark from './BrandMark';

export default function Footer() {
  return (
    <footer className="px-4 pb-10 pt-16 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(14,20,39,0.9),rgba(9,14,28,0.88))] px-6 py-8 shadow-[0_24px_60px_rgba(2,6,23,0.28)] sm:px-8 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
            <div>
              <div className="flex items-center gap-3 text-xl font-bold">
                <div className="relative h-11 w-11 overflow-hidden rounded-2xl shadow-lg shadow-neon-purple/20">
                  <BrandMark className="h-full w-full" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-[#efe6ff] via-[#9f5cff] to-[#42b4ff] bg-clip-text text-transparent">
                    Quizzy
                  </span>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Платформа для квизов
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400 sm:text-base">
                Платформа для проведения викторин в реальном времени.
                Создавайте комнаты, запускайте вопросы и показывайте участникам итоговый лидерборд.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                <Sparkles className="w-4 h-4 text-neon-purple" />
                Для живых викторин в реальном времени
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Навигация</div>
              <div className="mt-5 space-y-3 text-sm sm:text-base">
                <Link to="/organizer" className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-slate-300 transition-all hover:border-white/14 hover:text-white">
                  Создать викторину
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link to="/join" className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-slate-300 transition-all hover:border-white/14 hover:text-white">
                  Присоединиться по коду
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-slate-300 transition-all hover:border-white/14 hover:text-white">
                  Войти в аккаунт
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Контакты</div>
              <div className="mt-5 space-y-3">
                <a
                  href="mailto:support@quizzy.local"
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-slate-300 transition-all hover:border-white/14 hover:text-white"
                >
                  <Mail className="w-4 h-4 text-neon-blue" />
                  support@quizzy.local
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-slate-300 transition-all hover:border-white/14 hover:text-white"
                >
                  <Github className="w-4 h-4 text-neon-purple" />
                  Репозиторий GitHub
                </a>
              </div>
            </div>
          </div>

          <div className="editorial-divider my-8" />

          <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div>© 2025 Quizzy. Публичный интерфейс на React и TypeScript.</div>
            <div>Собрано для обучения, команд и событий в реальном времени.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

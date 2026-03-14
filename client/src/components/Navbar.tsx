import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store';
import { LayoutDashboard, LogOut, Sparkles, User } from 'lucide-react';
import BrandMark from './BrandMark';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto rounded-[26px] border border-white/10 bg-[rgba(7,12,28,0.7)] px-4 shadow-[0_24px_60px_rgba(2,6,23,0.32)] backdrop-blur-2xl sm:px-6">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 text-xl font-bold">
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl shadow-lg shadow-neon-purple/20">
              <BrandMark className="h-full w-full" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-[#efe6ff] via-[#9f5cff] to-[#42b4ff] bg-clip-text text-transparent">
                Quizzy
              </span>
              <div className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block">
                Платформа для квизов
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to={user.role === 'organizer' ? '/organizer' : '/player'}
                  className="btn-quiet hidden sm:inline-flex"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Панель
                </Link>

                <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm md:flex">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                    <User className="w-4 h-4 text-neon-purple" />
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold text-white">{user.name}</div>
                    <div className="text-xs text-slate-500">
                      {user.role === 'organizer' ? 'Организатор' : 'Игрок'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn-quiet px-4"
                  aria-label="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-sm py-3 px-5">
                  Войти
                </Link>
                <Link to="/register" className="btn-neon text-sm py-3 px-5">
                  <Sparkles className="w-4 h-4" />
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

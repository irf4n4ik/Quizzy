import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import BrandMark from '../components/BrandMark';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Play,
  PlusCircle,
  Radio,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

export default function Landing() {
  const useCases = [
    {
      icon: GraduationCap,
      title: 'Для обучения',
      eyebrow: 'Уроки и практики',
      desc: 'Проводите быстрые проверки знаний, интерактивные лекции и соревнования между командами.',
    },
    {
      icon: Building2,
      title: 'Для команд',
      eyebrow: 'Команды и мероприятия',
      desc: 'Используйте викторины для онбординга, внутренних мероприятий и вовлекающих митапов.',
    },
    {
      icon: Trophy,
      title: 'Для событий',
      eyebrow: 'События и сообщества',
      desc: 'Добавляйте соревновательный слой на конференции, вечеринки и онлайн-стримы.',
    },
  ];

  const steps = [
    {
      icon: PlusCircle,
      title: 'Соберите игру под свой формат',
      desc: 'Создайте вопросы, добавьте изображения, настройте темп и подготовьте комнату к запуску.',
      color: 'from-neon-purple to-indigo-500',
    },
    {
      icon: Users,
      title: 'Откройте комнату для игроков',
      desc: 'Дайте код доступа, подключите участников и запустите единый поток вопросов в реальном времени.',
      color: 'from-neon-blue to-neon-cyan',
    },
    {
      icon: Trophy,
      title: 'Ведите динамику до финала',
      desc: 'Следите за баллами, скоростью ответов и удерживайте азарт живой таблицей лидеров.',
      color: 'from-neon-pink to-neon-purple',
    },
  ];

  const features = [
    { icon: Zap, title: 'Синхронная игра', desc: 'Вопросы и результаты приходят игрокам одновременно, без ощущения задержки.' },
    { icon: Clock, title: 'Ритм по таймеру', desc: 'Управляйте напряжением раунда ограничением по времени и скоростными бонусами.' },
    { icon: BarChart3, title: 'Лидерборд в движении', desc: 'Показывайте изменения рейтинга после каждого ответа и финального раунда.' },
    { icon: Shield, title: 'Гибкие типы вопросов', desc: 'Комбинируйте одиночный выбор, несколько ответов и визуальные вопросы.' },
    { icon: Radio, title: 'Комнаты по коду', desc: 'Игроку не нужен длинный онбординг: достаточно короткого кода комнаты.' },
    { icon: Sparkles, title: 'Ясный флоу ведущего', desc: 'Организатору проще удерживать сценарий, когда интерфейс показывает только нужное.' },
  ];

  return (
    <div className="min-h-screen bg-particles overflow-hidden">
      <section className="relative px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <div className="absolute left-[8%] top-28 h-56 w-56 rounded-full bg-neon-purple/12 blur-3xl pointer-events-none" />
        <div className="absolute right-[10%] top-40 h-64 w-64 rounded-full bg-neon-blue/10 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center">
          <div className="relative z-10">
            <div className="section-kicker mb-7">
              <Sparkles className="w-4 h-4" />
              Викторины в реальном времени
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] text-white sm:text-6xl lg:text-7xl">
              Создавайте викторины
              <span className="block text-glow-purple bg-gradient-to-r from-[#f3ecff] via-[#b28cff] to-[#42b4ff] bg-clip-text text-transparent">
                для обучения, игр
              </span>
              <span className="block text-slate-200">и живых мероприятий.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Создавайте комнаты, запускайте вопросы по таймеру, подключайте участников по коду
              и показывайте результаты в общей таблице лидеров.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to="/organizer"
                className="btn-neon text-base sm:text-lg py-4 px-7"
              >
                <PlusCircle className="w-5 h-5" />
                Создать викторину
              </Link>
              <Link to="/join" className="btn-outline text-base sm:text-lg py-4 px-7">
                <Play className="w-5 h-5" />
                Присоединиться по коду
              </Link>
            </div>
          </div>

          <div className="relative z-10">
            <div className="surface-hero relative overflow-hidden p-5 sm:p-7">
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Пример интерфейса
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-slate-300">
                    <div className="h-11 w-11 overflow-hidden rounded-2xl shadow-lg shadow-neon-purple/20">
                      <BrandMark className="h-full w-full" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Комната: Основы веб-разработки</div>
                      <div className="text-sm text-slate-500">24 игрока онлайн • организатор готов</div>
                    </div>
                  </div>
                </div>
                <div className="surface-quiet hidden rounded-2xl px-4 py-3 text-right sm:block">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">текущий счёт</div>
                  <div className="mt-1 text-lg font-semibold text-white">+120 баллов</div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-neon-purple">
                      <Radio className="w-4 h-4" />
                      Вопрос 3 из 10
                    </span>
                    <span className="inline-flex items-center gap-2 text-neon-cyan">
                      <Clock className="w-4 h-4" />
                      15 секунд
                    </span>
                  </div>
                  <h3 className="mt-5 max-w-md text-2xl font-semibold leading-tight text-white">
                    Какой язык программирования чаще всего используют для интерактивной веб-разработки?
                  </h3>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {['JavaScript', 'Python', 'C++', 'Rust'].map((answer, index) => (
                      <div
                        key={answer}
                        className={`answer-${['a', 'b', 'c', 'd'][index]} rounded-2xl border px-4 py-4 text-sm font-semibold text-white/92 transition-all`}
                      >
                        {answer}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="surface-quiet p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                      <span>Лидеры</span>
                      <span>Онлайн</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        ['Алина', '2450'],
                        ['Марк', '2310'],
                        ['Ира', '2160'],
                      ].map(([name, score], index) => (
                        <div key={name} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center text-xs font-semibold text-slate-300">
                              0{index + 1}
                            </div>
                            <span className="text-sm font-medium text-white">{name}</span>
                          </div>
                          <span className="text-sm text-slate-400">{score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="surface-quiet p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Состояние комнаты</div>
                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-neon-green" />
                        Комната открыта, игроки подключены и готовы к следующему раунду.
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-neon-blue" />
                        Скоростной бонус активен, лидерборд обновится после таймера.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ['24', 'активных игрока'],
                  ['92%', 'дошли до финала'],
                  ['1:45', 'средний раунд'],
                ].map(([value, label]) => (
                  <div key={label} className="surface-quiet px-4 py-3">
                    <div className="text-lg font-semibold text-white">{value}</div>
                    <div className="mt-1 text-sm text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="surface-card px-6 py-6 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <div className="section-kicker mb-4">
                  <Users className="w-4 h-4" />
                  Почему это удобно
                </div>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                  Всё, что нужно для запуска квиза, собрано в одном интерфейсе.
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['Организатору удобно', 'Создание квиза, запуск комнаты и управление ходом игры собраны в одном месте.'],
                  ['Игрокам просто войти', 'Для подключения нужен только код комнаты и имя игрока.'],
                  ['Результаты прозрачны', 'Баллы и лидерборд обновляются по ходу всей игры.'],
                ].map(([title, desc]) => (
                  <div key={title} className="surface-quiet p-4">
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="section-kicker mb-4">
                <Sparkles className="w-4 h-4" />
                Сценарии использования
              </div>
              <h2 className="text-4xl font-semibold text-white sm:text-5xl">Где можно использовать платформу</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Платформа подходит для уроков, командных активностей, мероприятий и онлайн-игр.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {useCases.map((item, index) => (
              <div
                key={item.title}
                className={`surface-card p-7 ${index === 1 ? 'lg:-mt-6' : ''}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {item.eyebrow}
                </div>
                <h3 className="mt-3 text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-4 text-base leading-7 text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="section-kicker mb-4">
                <Play className="w-4 h-4" />
                Как это работает
              </div>
              <h2 className="text-4xl font-semibold text-white sm:text-5xl">Три шага, которые ощущаются как сценарий, а не как чеклист</h2>
              <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
                Создайте квиз, откройте комнату и проведите игру до финального лидерборда.
              </p>
          </div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`surface-card grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr] ${index === 1 ? 'lg:translate-x-8' : ''} ${index === 2 ? 'lg:translate-x-16' : ''}`}
              >
                <div className="flex flex-col items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className={`inline-flex items-center rounded-full bg-gradient-to-r ${step.color} p-[1px]`}>
                    <div className="rounded-full bg-dark-900 px-4 py-1.5 text-sm font-semibold tracking-[0.24em] text-white/85">
                      ШАГ 0{index + 1}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-2xl font-semibold text-white sm:text-3xl">{step.title}</h3>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="surface-hero p-8 sm:p-10">
              <div className="section-kicker mb-5">
                <BarChart3 className="w-4 h-4" />
                Возможности платформы
              </div>
              <h2 className="max-w-2xl text-4xl font-semibold text-white sm:text-5xl">
                Возможности платформы собраны вокруг одного ощущения: темп под контролем.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
                Ведущий управляет ходом игры, игроки отвечают в нужный момент, а результаты считаются автоматически.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {features.slice(0, 4).map((feature) => (
                  <div key={feature.title} className="surface-quiet p-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-neon-purple" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="surface-card p-7">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Как это выглядит</div>
                <h3 className="mt-3 text-2xl font-semibold text-white">Ведущий, игрок и лидерборд остаются в одном ритме</h3>
                <p className="mt-4 text-base leading-7 text-slate-400">
                  Комнаты по коду, таймер, очки и быстрые бонусы работают как единый сценарий. Пользователь чувствует продукт целиком, а не отдельные экраны.
                </p>
                <div className="editorial-divider my-6" />
                <div className="space-y-4">
                  {features.slice(4).map((feature) => (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                        <feature.icon className="w-5 h-5 text-neon-blue" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{feature.title}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-400">{feature.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface-card p-7">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Что уже есть</div>
                <div className="mt-4 space-y-4">
                  {[
                    'Регистрация и вход для игроков и организаторов.',
                    'Создание викторин, добавление вопросов и запуск комнаты по коду.',
                    'Подключение участников, прохождение вопросов и итоговый лидерборд.',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 text-neon-green shrink-0" />
                      <p className="text-sm leading-6 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="surface-hero relative overflow-hidden p-8 sm:p-12 lg:p-14">
            <div className="absolute -top-16 right-10 h-40 w-40 rounded-full bg-neon-blue/14 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 left-12 h-40 w-40 rounded-full bg-neon-purple/16 blur-3xl pointer-events-none" />
            <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="section-kicker mb-4">
                  <ArrowRight className="w-4 h-4" />
                  Готовы начать
                </div>
                <h2 className="text-4xl font-semibold text-white sm:text-5xl lg:max-w-3xl">
                  Создайте первую викторину и запустите комнату для своей аудитории.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
                  Подготовьте вопросы, задайте правила проведения и отправьте игрокам код комнаты.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                <Link to="/organizer" className="btn-neon text-lg py-4 px-8">
                  Начать <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/join" className="btn-outline text-lg py-4 px-8">
                  Присоединиться к викторине
                </Link>
              </div>
            </div>

            <div className="relative z-10 mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Настройка', 'Создание квиза, правил и времени на ответ'],
                ['Запуск', 'Подключение игроков по короткому коду комнаты'],
                ['Результат', 'Лидерборд и финальные результаты после игры'],
              ].map(([title, desc]) => (
                <div key={title} className="surface-quiet p-4">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

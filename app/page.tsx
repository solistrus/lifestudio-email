import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-200px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#dc146e]/30 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-24">
          <span className="inline-block rounded-full border border-white/10 px-4 py-1 text-xs text-zinc-400">
            LifeStudio Email · B2B Outreach
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            B2B email-аутрич,  
            <br />
            который получают, читают и отвечают
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Холодные письма без «спама».  
            Персонализация, цепочки, аналитика и прозрачный процесс.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/preview"
              className="inline-flex items-center justify-center rounded-xl bg-[#dc146e] px-6 py-3 text-sm font-medium text-white transition hover:brightness-110"
            >
              Открыть preview писем
            </Link>

            <Link
              href="#cases"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 hover:bg-white/5"
            >
              Смотреть кейсы
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-semibold">Что здесь есть</h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Email-цепочки",
              text: "Холодные серии писем под конкретный ICP и сценарий.",
            },
            {
              title: "Preview писем",
              text: "Смотри письма как получатель — до запуска.",
            },
            {
              title: "Кейсы",
              text: "Реальные ниши, гипотезы, цифры и выводы.",
            },
            {
              title: "Процесс",
              text: "Без магии: подготовка → запуск → оптимизация.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CASES */}
      <section id="cases" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-semibold">Кейсы</h2>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "B2B сервис",
              result: "42 диалога за 30 дней",
            },
            {
              title: "Производственная компания",
              result: "18 встреч с ЛПР",
            },
            {
              title: "IT / SaaS",
              result: "2,1% ответов на холод",
            },
          ].map((caseItem) => (
            <div
              key={caseItem.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-sm font-semibold">{caseItem.title}</h3>
              <p className="mt-4 text-lg font-medium text-[#dc146e]">
                {caseItem.result}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                ICP · цепочки · персонализация
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-zinc-500">
            © {new Date().getFullYear()} lifestudio-email.ru
          </span>

          <div className="flex gap-6 text-sm">
            <Link href="/privacy-policy" className="text-zinc-400 hover:text-white">
              Политика
            </Link>
            <Link href="/cookie-policy" className="text-zinc-400 hover:text-white">
              Cookie
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

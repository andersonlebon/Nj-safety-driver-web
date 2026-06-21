import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { getTranslations } from "@/i18n/server";
import {
  ShieldCheck,
  Car,
  FileText,
  AlertTriangle,
  ScanLine,
  Smartphone,
  CreditCard,
  CheckCircle2,
  UserCheck,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";

const CONTACT_EMAIL = "njsafetydriver@securiteroutiere.ga";

export default async function LandingPage() {
  const { t } = await getTranslations();
  const year = new Date().getFullYear();

  const flowSteps = [
    t("landing.flow.steps.detected.title"),
    t("landing.flow.steps.notified.title"),
    t("landing.flow.steps.reviewed.title"),
    t("landing.flow.steps.paid.title"),
    t("landing.flow.steps.receipt.title"),
  ].map((title, index) => {
    const keys = [
      "detected",
      "notified",
      "reviewed",
      "paid",
      "receipt",
    ] as const;
    const key = keys[index];
    return {
      number: String(index + 1).padStart(2, "0"),
      title,
      description: t(`landing.flow.steps.${key}.description`),
    };
  });

  const featureItems = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: t("landing.features.items.documents.title"),
      description: t("landing.features.items.documents.description"),
      accent: "brand" as const,
    },
    {
      icon: <ScanLine className="h-5 w-5" />,
      title: t("landing.features.items.plateSearch.title"),
      description: t("landing.features.items.plateSearch.description"),
      accent: "navy" as const,
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: t("landing.features.items.infractions.title"),
      description: t("landing.features.items.infractions.description"),
      accent: "gold" as const,
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: t("landing.features.items.payments.title"),
      description: t("landing.features.items.payments.description"),
      accent: "brand" as const,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div
        aria-hidden
        className="h-1 bg-gradient-to-r from-brand-700 via-gold-500 to-navy-700"
      />

      <LandingNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden landing-hero">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(34,120,70,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(34,120,70,0.08),transparent)]"
          />
          <div
            aria-hidden
            className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl dark:bg-gold-500/5"
          />
          <div
            aria-hidden
            className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-600/5"
          />

          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/60 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:border-brand-800/40 dark:bg-brand-950/50 dark:text-brand-300">
                    <ShieldCheck className="h-3 w-3" />
                    {t("landing.hero.badgeRepublic")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-200/60 bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-800 dark:border-gold-800/40 dark:bg-gold-950/50 dark:text-gold-300">
                    {t("landing.hero.badgeMinistry")}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-stone-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-slate-400">
                    {t("landing.hero.version")}
                  </span>
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl lg:text-[3.25rem] leading-[1.08]">
                  {t("landing.hero.title")}
                  <br />
                  <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-navy-700 bg-clip-text text-transparent dark:from-brand-400 dark:via-brand-300 dark:to-navy-300">
                    {t("landing.hero.titleHighlight")}
                  </span>
                </h1>

                <p className="mt-6 text-lg text-stone-600 dark:text-slate-400 leading-relaxed max-w-xl">
                  {t("landing.hero.description")}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href="/register" className="btn-primary px-6 text-base shadow-md shadow-brand-700/15">
                    {t("landing.hero.ctaRegister")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/login" className="btn-secondary px-6 text-base">
                    {t("landing.hero.ctaLogin")}
                  </Link>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-stone-500 dark:text-slate-500">
                  <TrustItem label={t("landing.hero.trustSsl")} />
                  <TrustItem label={t("landing.hero.trustOtp")} />
                  <TrustItem label={t("landing.hero.trustAudit")} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <ProductPreviewCard
                  href="/register"
                  icon={<Car className="h-6 w-6" />}
                  tag={t("landing.products.driver.tag")}
                  title={t("landing.products.driver.title")}
                  description={t("landing.products.driver.description")}
                  cta={t("landing.products.driver.cta")}
                  variant="brand"
                />
                <ProductPreviewCard
                  href="/login"
                  icon={<UserCheck className="h-6 w-6" />}
                  tag={t("landing.products.agent.tag")}
                  title={t("landing.products.agent.title")}
                  description={t("landing.products.agent.description")}
                  cta={t("landing.products.agent.cta")}
                  variant="navy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-stone-200/70 dark:border-slate-800/70 landing-surface">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Stat value={t("landing.stats.drivers.value")} label={t("landing.stats.drivers.label")} />
              <Stat value={t("landing.stats.agents.value")} label={t("landing.stats.agents.label")} />
              <Stat value={t("landing.stats.discount.value")} label={t("landing.stats.discount.label")} />
              <Stat value={t("landing.stats.digital.value")} label={t("landing.stats.digital.label")} />
            </div>
          </div>
        </section>

        {/* Product details */}
        <section className="landing-surface-alt border-b border-stone-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <SectionHeader
              eyebrow={t("landing.products.eyebrow")}
              title={t("landing.products.title")}
              description={t("landing.products.description")}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductDetailCard
                href="/register"
                icon={<Car className="h-6 w-6" />}
                tag={t("landing.products.driver.tag")}
                title={t("landing.products.driver.title")}
                description={t("landing.products.driver.description")}
                features={[
                  t("landing.products.driver.features.0"),
                  t("landing.products.driver.features.1"),
                  t("landing.products.driver.features.2"),
                  t("landing.products.driver.features.3"),
                ]}
                cta={t("landing.products.driver.cta")}
                variant="brand"
              />
              <ProductDetailCard
                href="/login"
                icon={<ShieldCheck className="h-6 w-6" />}
                tag={t("landing.products.agent.tag")}
                title={t("landing.products.agent.title")}
                description={t("landing.products.agent.description")}
                features={[
                  t("landing.products.agent.features.0"),
                  t("landing.products.agent.features.1"),
                  t("landing.products.agent.features.2"),
                  t("landing.products.agent.features.3"),
                ]}
                cta={t("landing.products.agent.cta")}
                variant="navy"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="landing-surface border-b border-stone-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <SectionHeader
              eyebrow={t("landing.features.eyebrow")}
              title={t("landing.features.title")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {featureItems.map((item) => (
                <FeatureCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        {/* Flow */}
        <section className="landing-surface-alt border-b border-stone-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <SectionHeader
              eyebrow={t("landing.flow.eyebrow")}
              title={t("landing.flow.title")}
              description={t("landing.flow.description")}
            />

            <div className="relative grid grid-cols-1 sm:grid-cols-5 gap-4 mb-10">
              <div
                aria-hidden
                className="hidden sm:block absolute top-[1.375rem] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent dark:via-brand-700/40"
              />
              {flowSteps.map((step) => (
                <Step key={step.number} {...step} />
              ))}
            </div>

            <div className="rounded-2xl border border-gold-200/80 bg-gradient-to-br from-gold-50 to-white dark:from-gold-950/30 dark:to-slate-900/40 dark:border-gold-800/40 p-5 sm:p-6 flex gap-4 items-start max-w-3xl shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-600 text-white shadow-sm">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  {t("landing.flow.discountTitle")}
                </p>
                <p className="mt-1.5 text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                  {t("landing.flow.discountBody", { hours: "72", percent: "30%" })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Payments */}
        <section className="landing-surface border-b border-stone-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <SectionHeader
              eyebrow={t("landing.payments.eyebrow")}
              title={t("landing.payments.title")}
              description={t("landing.payments.description")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
              <PaymentMethod
                icon={<Smartphone className="h-5 w-5" />}
                title={t("landing.payments.mobileMoney.title")}
                description={t("landing.payments.mobileMoney.description")}
                detail={t("landing.payments.mobileMoney.detail")}
              />
              <PaymentMethod
                icon={<CreditCard className="h-5 w-5" />}
                title={t("landing.payments.card.title")}
                description={t("landing.payments.card.description")}
                detail={t("landing.payments.card.detail")}
              />
            </div>
          </div>
        </section>

        {/* Get started */}
        <section className="landing-surface-alt border-b border-stone-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <SectionHeader
              eyebrow={t("landing.getStarted.eyebrow")}
              title={t("landing.getStarted.title")}
              description={t("landing.getStarted.description")}
            />

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn-primary px-6 text-base">
                {t("landing.getStarted.registerCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 text-base">
                {t("landing.getStarted.loginCta")}
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-brand-700/90 dark:bg-brand-900/85 backdrop-blur-sm">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_55%)]"
          />
          <div className="relative mx-auto max-w-7xl px-6 py-16 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 mb-5">
              <Sparkles className="h-3 w-3" />
              {t("landing.cta.badge")}
            </span>
            <h2 className="text-2xl font-bold text-white sm:text-3xl tracking-tight">
              {t("landing.cta.title")}
            </h2>
            <p className="mt-3 text-brand-100 max-w-2xl mx-auto leading-relaxed">
              {t("landing.cta.description")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 transition-colors shadow-sm"
              >
                {t("landing.cta.registerButton")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                {t("landing.cta.loginButton")}
              </Link>
            </div>
            <p className="mt-8 text-xs text-brand-200">
              {t("landing.cta.contact")}{" "}
              <span className="font-medium text-white">{CONTACT_EMAIL}</span>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/70 dark:border-slate-800/70 landing-surface">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {t("app.legacyName")}
                </p>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  {t("landing.footer.version")}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right space-y-0.5">
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {t("landing.footer.partnership")}
              </p>
              <p className="text-xs font-medium text-brand-700 dark:text-brand-400">
                {CONTACT_EMAIL}
              </p>
              <p className="text-xs text-stone-400 dark:text-slate-500">
                {t("landing.footer.ministry")}
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-stone-400 dark:text-slate-500 text-center sm:text-left">
              &copy; {year} {t("app.legacyName")} · {t("landing.footer.copyright")}
            </p>
            <div
              aria-hidden
              className="h-0.5 w-16 rounded-full bg-gradient-to-r from-brand-600/50 via-gold-500/50 to-navy-700/50"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

function TrustItem({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
      {label}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-700 dark:text-brand-400 mb-2">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-stone-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-4 py-2 rounded-xl bg-white/40 dark:bg-slate-900/30 border border-stone-200/50 dark:border-slate-800/50">
      <p className="text-3xl font-bold tracking-tight text-brand-700 dark:text-brand-400">
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-500 dark:text-slate-400 leading-snug">
        {label}
      </p>
    </div>
  );
}

function ProductPreviewCard({
  href,
  icon,
  tag,
  title,
  description,
  cta,
  variant,
}: {
  href: string;
  icon: React.ReactNode;
  tag: string;
  title: string;
  description: string;
  cta: string;
  variant: "brand" | "navy";
}) {
  const headerCls =
    variant === "brand"
      ? "from-brand-700 to-brand-800"
      : "from-navy-800 to-navy-900";

  return (
    <Link
      href={href}
      className="group card overflow-hidden flex flex-col hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200"
    >
      <div className={`bg-gradient-to-br ${headerCls} px-5 py-5`}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white mb-4">
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
          {tag}
        </p>
        <h3 className="mt-1 text-lg font-bold text-white leading-tight">{title}</h3>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed flex-1">
          {description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400 group-hover:gap-2 transition-all">
          {cta}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function ProductDetailCard({
  href,
  icon,
  tag,
  title,
  description,
  features,
  cta,
  variant,
}: {
  href: string;
  icon: React.ReactNode;
  tag: string;
  title: string;
  description: string;
  features: string[];
  cta: string;
  variant: "brand" | "navy";
}) {
  const accentCls =
    variant === "brand"
      ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400"
      : "bg-navy-50 text-navy-700 dark:bg-navy-950/50 dark:text-navy-300";

  const buttonCls =
    variant === "brand"
      ? "bg-brand-700 text-white hover:bg-brand-600 dark:hover:bg-brand-500"
      : "bg-navy-800 text-white hover:bg-navy-700";

  return (
    <div className="card p-6 lg:p-8 flex flex-col h-full">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accentCls}`}
        >
          {icon}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400">
            {tag}
          </p>
          <h3 className="mt-1 text-xl font-bold text-stone-900 dark:text-stone-100">
            {title}
          </h3>
          <p className="mt-2 text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <ul className="mt-6 space-y-3 flex-1">
        {features.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <span className="text-stone-700 dark:text-slate-300 leading-snug">
              {item}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 ${buttonCls}`}
      >
        {cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "brand" | "navy" | "gold";
}) {
  const iconCls = {
    brand:
      "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400",
    navy: "bg-navy-50 text-navy-700 dark:bg-navy-950/50 dark:text-navy-300",
    gold: "bg-gold-50 text-gold-700 dark:bg-gold-950/50 dark:text-gold-400",
  }[accent];

  return (
    <div className="card p-6 flex flex-col gap-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconCls}`}
      >
        {icon}
      </span>
      <div>
        <h3 className="font-bold text-stone-900 dark:text-stone-100">{title}</h3>
        <p className="mt-2 text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center px-2">
      <div className="relative z-[1] flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white font-bold text-sm shadow-sm mb-3 shrink-0 ring-4 ring-white/80 dark:ring-slate-900/80">
        {number}
      </div>
      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
        {title}
      </h4>
      <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function PaymentMethod({
  icon,
  title,
  description,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-700 dark:bg-navy-950/50 dark:text-navy-300">
        {icon}
      </span>
      <div>
        <h3 className="font-bold text-stone-900 dark:text-stone-100">{title}</h3>
        <p className="mt-1.5 text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      <span className="mt-auto inline-flex items-center rounded-md bg-stone-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-stone-500 dark:text-slate-400 self-start">
        {detail}
      </span>
    </div>
  );
}

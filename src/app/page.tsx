import Link from "next/link";
import { ShieldCheck, Car, FileSearch, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-700 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="font-semibold text-slate-900 tracking-tight">
              NJ Safety Driver
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary">
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
                <ShieldCheck className="h-3.5 w-3.5" /> Official road safety platform
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Modern road safety management for drivers and agents
              </h1>
              <p className="mt-5 text-lg text-slate-600">
                Register vehicles, manage documents, issue infractions, and
                track payments all in one secure, government-grade platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login?role=driver" className="btn-primary">
                  Driver login
                </Link>
                <Link href="/login?role=agent" className="btn-secondary">
                  Agent login
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-bold text-slate-900">
              Built for every road safety actor
            </h2>
            <p className="mt-2 text-slate-600 max-w-2xl">
              A unified workspace that streamlines registration, enforcement,
              and oversight in a clean, compliant interface.
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Feature
                icon={<Car className="h-5 w-5" />}
                title="Driver portal"
                description="Self-service registration, vehicle records, and document uploads."
              />
              <Feature
                icon={<FileSearch className="h-5 w-5" />}
                title="Agent toolkit"
                description="Search by plate, review records, and file infractions with evidence."
              />
              <Feature
                icon={<Users className="h-5 w-5" />}
                title="Admin oversight"
                description="View activity across drivers, vehicles, agents, and infractions."
              />
              <Feature
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Secure by design"
                description="Role-based access with row-level security and encrypted storage."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} NJ Safety Driver. All rights reserved.</p>
          <p>Government-grade road safety platform.</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

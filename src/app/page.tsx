import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  ShieldCheck,
  Car,
  FileText,
  AlertTriangle,
  ScanLine,
  Smartphone,
  CreditCard,
  Landmark,
  QrCode,
  MapPin,
  Globe,
  Zap,
  CheckCircle2,
  UserCheck,
  Gauge,
  ArrowRight,
  Clock,
  LayoutDashboard,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Gabon flag accent stripe — green · gold · navy */}
      <div
        aria-hidden
        className="h-1 bg-gradient-to-r from-brand-700 via-gold-500 to-navy-700"
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 glass-panel border-b border-stone-200/80 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white shadow-sm ring-1 ring-brand-600/20">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
                NJ Safety Driver
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-tight">
                République Gabonaise
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="btn-secondary text-sm">
              Connexion
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              S&apos;inscrire
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── 1. Hero ── */}
        <section className="relative overflow-hidden landing-hero">
          {/* Decorative background shield */}
          <div
            aria-hidden
            className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.04] dark:opacity-[0.025] hidden lg:block pointer-events-none"
          >
            <ShieldCheck className="h-[480px] w-[480px] text-brand-700" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-32">
            <div className="max-w-3xl">
              {/* Official badges */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/60 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:border-brand-800/40 dark:bg-brand-950/50 dark:text-brand-300">
                  <ShieldCheck className="h-3 w-3" />
                  République Gabonaise
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-200/60 bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-800 dark:border-gold-800/40 dark:bg-gold-950/50 dark:text-gold-300">
                  Ministère des Transports
                </span>
                <span className="inline-flex items-center rounded-full bg-stone-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-slate-400">
                  Version 1.0
                </span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl lg:text-6xl leading-[1.08]">
                La sécurité routière
                <br />
                <span className="text-brand-700 dark:text-brand-400">
                  numérisée au Gabon
                </span>
              </h1>

              <p className="mt-6 text-lg text-stone-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                Application gouvernementale gabonaise de contrôle routier — une
                plateforme numérique complète conçue pour moderniser la gestion de
                la sécurité routière, faciliter les contrôles des agents,
                automatiser le traitement des infractions et simplifier le paiement
                des amendes pour tous les usagers de la route.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register" className="btn-primary px-6 text-base">
                  Portail conducteur
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/register/agent" className="btn-secondary px-6 text-base">
                  Devenir agent
                </Link>
                <Link href="/login?role=agent" className="btn-secondary px-6 text-base">
                  Connexion agent
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-stone-500 dark:text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                  Chiffrement SSL 256-bit
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                  Authentification 2 facteurs
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                  Audit trail horodaté
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Stats bar ── */}
        <section className="border-y border-stone-200/70 dark:border-slate-800/70 landing-surface">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x-0 sm:divide-x divide-stone-100 dark:divide-slate-800">
              <Stat value="98.5 %" label="Précision OCR plaques (ANPR)" />
              <Stat value="−30 %" label="Réduction pour paiement sous 72 h" />
              <Stat value="500+" label="Agents enrôlés — Phase 1 Libreville" />
              <Stat value="6" label="Modules fonctionnels couvrant tout le cycle" />
            </div>
          </div>
        </section>

        {/* ── 3. Six modules ── */}
        <section className="landing-surface-alt border-b border-stone-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <SectionHeader
              eyebrow="Sommaire de l'application"
              title="Six modules pour couvrir tout le cycle routier"
              description="De l'enregistrement du conducteur jusqu'au paiement sécurisé des amendes, chaque étape est numérisée, tracée et auditée."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Module
                icon={<UserCheck className="h-5 w-5" />}
                tag="Module 01"
                title="Enregistrement Personnel"
                description="Profil conducteur complet : nom, CNI, permis de conduire et catégorie, date d'obtention et d'expiration, photo d'identité. Données véhicule : plaque, marque, modèle, VIN, carte grise, assurance, contrôle technique."
                accent="brand"
              />
              <Module
                icon={<ShieldCheck className="h-5 w-5" />}
                tag="Module 02"
                title="Espace Agent de Sécurité"
                description="Connexion sécurisée NIP + OTP (attribué par le Ministère de l'Intérieur). Accès instantané au profil complet du conducteur, historique des infractions et amendes impayées. Chaque session est horodatée et enregistrée."
                accent="navy"
              />
              <Module
                icon={<Gauge className="h-5 w-5" />}
                tag="Module 03"
                title="Contrôle des Radars"
                description="Gestion centralisée des flashers de vitesse géolocalisés déployés sur le réseau routier gabonais. Tableau de bord des infractions captées : heure exacte, photo de plaque, vitesse mesurée, génération automatique du PV."
                accent="gold"
              />
              <Module
                icon={<FileText className="h-5 w-5" />}
                tag="Module 04"
                title="Téléversement de Documents"
                description="Dépôt sécurisé de la CNI / passeport, permis de conduire (recto-verso), carte grise, attestation d'assurance en cours de validité et certificat de contrôle technique délivré par un centre agréé. Max 5 Mo / document."
                accent="brand"
              />
              <Module
                icon={<AlertTriangle className="h-5 w-5" />}
                tag="Module 05"
                title="Gestion des Infractions"
                description="Suivi complet du cycle : détection automatique (radar) ou manuelle (agent), notification push + SMS immédiate, consultation du dossier avec photo de preuve, paiement sécurisé multi-canaux et quittance officielle PDF."
                accent="navy"
              />
              <Module
                icon={<ScanLine className="h-5 w-5" />}
                tag="Module 06"
                title="Scan de Plaque (ANPR / OCR)"
                description="Reconnaissance optique par IA entraînée sur les formats de plaques gabonaises. Précision de 98,5 % en conditions standard. Basculement vers saisie manuelle assistée en cas d'occlusion ou de faible luminosité."
                accent="gold"
              />
            </div>
          </div>
        </section>

        {/* ── 4. Infraction flow ── */}
        <section className="landing-surface border-b border-stone-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <SectionHeader
              eyebrow="Cycle de l'amende"
              title="De l'infraction à la quittance officielle"
              description="Un processus entièrement dématérialisé, inspiré des meilleures pratiques de France, du Maroc et d'Afrique du Sud."
            />

            {/* 5-step flow */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-10">
              {[
                {
                  n: "01",
                  title: "Infraction Détectée",
                  desc: "Enregistrée automatiquement par radar ou manuellement par l'agent. Associée au profil conducteur.",
                },
                {
                  n: "02",
                  title: "Notification Immédiate",
                  desc: "Alerte push et SMS au conducteur avec détail de l'infraction, montant et date limite de paiement.",
                },
                {
                  n: "03",
                  title: "Consultation du Dossier",
                  desc: "Tableau de bord : type d'infraction, photo de preuve, localisation GPS, montant et statut.",
                },
                {
                  n: "04",
                  title: "Paiement Sécurisé",
                  desc: "Mobile Money, carte bancaire (3D Secure) ou virement Trésor Public. QR Code disponible.",
                },
                {
                  n: "05",
                  title: "Quittance Officielle",
                  desc: "Reçu numérique certifié PDF généré et archivé automatiquement dans le profil de l'usager.",
                },
              ].map((s) => (
                <Step key={s.n} number={s.n} title={s.title} description={s.desc} />
              ))}
            </div>

            {/* 72h discount callout */}
            <div className="rounded-xl border border-gold-200 bg-gold-50 dark:border-gold-800/40 dark:bg-gold-950/20 p-5 flex gap-4 items-start max-w-3xl">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-600 text-white">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Réduction de 30 % pour paiement rapide
                </p>
                <p className="mt-1 text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                  Les paiements effectués dans les{" "}
                  <strong className="text-stone-800 dark:text-stone-200">72 heures</strong>{" "}
                  suivant la notification bénéficient d&apos;une réduction de{" "}
                  <strong className="text-gold-700 dark:text-gold-400">30 %</strong>{" "}
                  sur le montant de l&apos;amende — dispositif d&apos;incitation au règlement rapide conforme au barème officiel gabonais.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Payment methods ── */}
        <section className="landing-surface-alt border-b border-stone-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <SectionHeader
              eyebrow="Système de paiement gouvernemental"
              title="Passerelle multi-canaux connectée au Trésor Public"
              description="Connectée au Trésor Public Gabonais, la passerelle garantit la sécurité des transactions, leur traçabilité et leur reversement automatique vers les caisses de l'État."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <PaymentMethod
                icon={<Smartphone className="h-5 w-5" />}
                title="Mobile Money"
                description="Compatible Airtel Money, Moov Money et Orange Money. Débit depuis le portefeuille mobile en quelques secondes, sans saisir de coordonnées bancaires."
                detail="Airtel · Moov · Orange"
              />
              <PaymentMethod
                icon={<CreditCard className="h-5 w-5" />}
                title="Carte Bancaire"
                description="Visa, Mastercard ou carte BGFI / UGB. Sécurisé via protocole 3D Secure et chiffrement SSL 256 bits. Confirmation instantanée."
                detail="3D Secure · SSL 256-bit"
              />
              <PaymentMethod
                icon={<Landmark className="h-5 w-5" />}
                title="Virement Trésor Public"
                description="Virement bancaire direct vers le compte officiel du Trésor Public Gabonais avec génération automatique d'une référence unique par dossier."
                detail="Référence unique / dossier"
              />
              <PaymentMethod
                icon={<QrCode className="h-5 w-5" />}
                title="Paiement QR Code"
                description="Chaque procès-verbal contient un QR Code unique scannable en agence bancaire ou au guichet du Trésor pour paiement en espèces."
                detail="Scannable en agence ou guichet"
              />
            </div>
          </div>
        </section>

        {/* ── 6. Three portals ── */}
        <section className="landing-surface border-b border-stone-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <SectionHeader
              eyebrow="Accès par rôle"
              title="Un espace dédié pour chaque acteur de la sécurité routière"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Portal
                href="/register"
                icon={<Car className="h-6 w-6" />}
                role="Conducteur"
                subtitle="Driver Portal"
                items={[
                  "Enregistrement profil et véhicule (CNI, permis, plaque)",
                  "Téléversement des documents officiels requis",
                  "Consultation de l'historique des infractions",
                  "Paiement des amendes — Mobile Money, carte, virement",
                  "Téléchargement des quittances officielles PDF",
                ]}
                cta="Créer un compte conducteur"
                variant="brand"
              />
              <Portal
                href="/register/agent"
                icon={<ShieldCheck className="h-6 w-6" />}
                role="Agent de Sécurité"
                subtitle="Agent Workspace"
                items={[
                  "Candidature en ligne — validation par un administrateur",
                  "Connexion sécurisée NIP + OTP (Ministère de l'Intérieur)",
                  "Scan de plaque ANPR / OCR — précision 98,5 %",
                  "Profil complet conducteur et antécédents en temps réel",
                  "Émission de procès-verbal numérique (barème officiel)",
                  "Upload de preuves photographiques géolocalisées",
                ]}
                cta="Postuler comme agent"
                variant="navy"
              />
              <Portal
                href="/login?role=admin"
                icon={<LayoutDashboard className="h-6 w-6" />}
                role="Administrateur"
                subtitle="Admin Dashboard"
                items={[
                  "Supervision des agents et de leurs opérations de terrain",
                  "Statistiques nationales : infractions, amendes, paiements",
                  "Gestion des conducteurs, véhicules et documents",
                  "Tableau de bord des radars actifs et en maintenance",
                  "Journal d'audit horodaté — traçabilité complète",
                ]}
                cta="Connexion administrateur"
                variant="stone"
              />
            </div>
          </div>
        </section>

        {/* ── 7. Roadmap ── */}
        <section className="landing-surface-alt border-b border-stone-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <SectionHeader
              eyebrow="Vision & Feuille de route"
              title="Un déploiement national par étapes"
              description="NJ Safety Driver représente un tournant décisif dans la modernisation de la sécurité routière gabonaise. En unissant technologie mobile, intelligence artificielle et paiement numérique gouvernemental, l'application pose les fondations d'un système de contrôle routier transparent, efficace et équitable."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <RoadmapPhase
                icon={<MapPin className="h-5 w-5" />}
                phase="Phase 1"
                year="2025"
                status="En cours"
                items={[
                  "Déploiement pilote à Libreville",
                  "Enrôlement des 500 premiers agents",
                  "Intégration des 50 radars existants",
                  "Lancement du portail conducteur public",
                ]}
              />
              <RoadmapPhase
                icon={<Globe className="h-5 w-5" />}
                phase="Phase 2"
                year="2026"
                status="Planifié"
                items={[
                  "Extension aux capitales provinciales",
                  "Interconnexion avec le RCCM",
                  "Intégration Trésor Public & assurances",
                  "Application mobile iOS & Android",
                ]}
              />
              <RoadmapPhase
                icon={<Zap className="h-5 w-5" />}
                phase="Phase 3"
                year="2027"
                status="Vision"
                items={[
                  "Couverture nationale complète",
                  "Intelligence artificielle prédictive",
                  "Rapport annuel automatisé au Parlement",
                  "Interconnexion bases de données nationales",
                ]}
              />
            </div>
          </div>
        </section>

        {/* ── 8. CTA ── */}
        <section className="relative bg-brand-700/90 dark:bg-brand-900/90 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-16 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 mb-5">
              <ShieldCheck className="h-3 w-3" />
              Plateforme officielle — République Gabonaise
            </span>
            <h2 className="text-2xl font-bold text-white sm:text-3xl tracking-tight mt-2">
              Rejoignez la plateforme nationale
            </h2>
            <p className="mt-3 text-brand-100 max-w-xl mx-auto leading-relaxed">
              Conducteurs, agents de sécurité et administrateurs — enregistrez-vous
              et accédez à votre espace en quelques secondes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 transition-colors shadow-sm"
              >
                Créer un compte conducteur
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Se connecter
              </Link>
            </div>
            <p className="mt-8 text-xs text-brand-200">
              Pour toute information ou partenariat institutionnel :{" "}
              <span className="font-medium text-white">
                njsafetydriver@securiteroutiere.ga
              </span>
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-stone-200/70 dark:border-slate-800/70 landing-surface">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  NJ Safety Driver
                </p>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Version 1.0 — Sécurité Routière Gabonaise
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right space-y-0.5">
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Partenariat institutionnel
              </p>
              <p className="text-xs font-medium text-brand-700 dark:text-brand-400">
                njsafetydriver@securiteroutiere.ga
              </p>
              <p className="text-xs text-stone-400 dark:text-slate-500">
                Ministère des Transports, République Gabonaise
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-stone-400 dark:text-slate-500 text-center sm:text-left">
              &copy; {new Date().getFullYear()} NJ Safety Driver · Tous droits réservés · République Gabonaise
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

// ─── Sub-components ────────────────────────────────────────────────────────

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
    <div className="text-center px-4 py-2">
      <p className="text-3xl font-bold tracking-tight text-brand-700 dark:text-brand-400">
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-500 dark:text-slate-400 leading-snug">
        {label}
      </p>
    </div>
  );
}

function Module({
  icon,
  tag,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  tag: string;
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
      <div className="flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconCls}`}
        >
          {icon}
        </span>
        <span className="text-xs font-semibold text-stone-300 dark:text-slate-600 font-mono">
          {tag}
        </span>
      </div>
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
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white font-bold text-sm shadow-sm mb-3 shrink-0">
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

function Portal({
  href,
  icon,
  role,
  subtitle,
  items,
  cta,
  variant,
}: {
  href: string;
  icon: React.ReactNode;
  role: string;
  subtitle: string;
  items: string[];
  cta: string;
  variant: "brand" | "navy" | "stone";
}) {
  const headerCls = {
    brand: "bg-brand-700",
    navy: "bg-navy-800",
    stone: "bg-stone-800 dark:bg-slate-800",
  }[variant];

  const ctaCls = {
    brand: "bg-brand-700 text-white hover:bg-brand-600 dark:hover:bg-brand-500",
    navy: "bg-navy-800 text-white hover:bg-navy-700",
    stone: "bg-stone-800 text-white hover:bg-stone-700 dark:bg-slate-700 dark:hover:bg-slate-600",
  }[variant];

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className={`${headerCls} px-6 py-6`}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white leading-tight">{role}</h3>
        <p className="text-xs text-white/60 mt-0.5 font-mono">{subtitle}</p>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <ul className="space-y-3 flex-1">
          {items.map((item) => (
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
          className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 ${ctaCls}`}
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function RoadmapPhase({
  icon,
  phase,
  year,
  status,
  items,
}: {
  icon: React.ReactNode;
  phase: string;
  year: string;
  status: "En cours" | "Planifié" | "Vision";
  items: string[];
}) {
  const statusCls = {
    "En cours":
      "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300",
    Planifié:
      "bg-gold-50 text-gold-800 dark:bg-gold-950/40 dark:text-gold-300",
    Vision:
      "bg-navy-50 text-navy-700 dark:bg-navy-950/50 dark:text-navy-300",
  }[status];

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400">
            {icon}
          </span>
          <div>
            <p className="font-bold text-stone-900 dark:text-stone-100">
              {phase}
            </p>
            <p className="text-sm text-stone-500 dark:text-slate-400">{year}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}>
          {status}
        </span>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <span className="text-stone-600 dark:text-slate-400 leading-snug">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const landingEn = {
  header: {
    login: "Sign in",
    register: "Get started",
  },
  hero: {
    badgeRepublic: "Gabonese Republic",
    badgeMinistry: "Ministry of Transport",
    version: "Version 1.0",
    title: "Road safety,",
    titleHighlight: "built for drivers and agents",
    description:
      "NJ Safety Driver connects motorists and field agents on one platform. Create an account to manage vehicles, upload documents, pay fines, or access your agent workspace after sign-in.",
    ctaRegister: "Create an account",
    ctaLogin: "Sign in",
    trustSsl: "256-bit SSL encryption",
    trustOtp: "Secure sign-in",
    trustAudit: "Timestamped audit trail",
  },
  stats: {
    drivers: { value: "10k+", label: "Drivers ready to onboard" },
    agents: { value: "500+", label: "Field agents in Phase 1" },
    discount: { value: "−30%", label: "Early payment discount within 72 h" },
    digital: { value: "100%", label: "Digital infraction lifecycle" },
  },
  products: {
    eyebrow: "Two workspaces, one platform",
    title: "Everything drivers and agents need",
    description:
      "Create your account first, then choose the workspace that fits your role. Driver and agent tools live in the same platform.",
    driver: {
      tag: "Driver workspace",
      title: "For motorists",
      description:
        "Your digital glove box: profile, vehicles, documents, infractions, and payments in one place.",
      features: [
        "Register your profile and vehicles",
        "Upload license, ID, insurance, and registration",
        "Track infractions with proof and status",
        "Pay fines online and download receipts",
      ],
      cta: "Create an account",
    },
    agent: {
      tag: "Agent workspace",
      title: "For field agents",
      description:
        "After sign-in, apply for agent access from your account. Then verify drivers, search plates, and issue infractions in the field.",
      features: [
        "Sign in with your account, then request agent access",
        "Plate search and driver lookup",
        "Issue infractions with official fee schedule",
        "Upload photo evidence from the field",
      ],
      cta: "Sign in to continue",
    },
  },
  features: {
    eyebrow: "Core capabilities",
    title: "Designed for real road operations",
    items: {
      documents: {
        title: "Document vault",
        description:
          "Drivers upload required papers once. Agents and reviewers see verified status without paper chasing.",
      },
      plateSearch: {
        title: "Plate search",
        description:
          "Agents look up a plate and open the linked driver profile, vehicles, and compliance history instantly.",
      },
      infractions: {
        title: "Infraction lifecycle",
        description:
          "From issuance to notification, review, payment, and receipt. Every step is tracked and timestamped.",
      },
      payments: {
        title: "Simple fine payment",
        description:
          "Drivers settle fines from their dashboard with clear status and downloadable proof of payment.",
      },
    },
  },
  flow: {
    eyebrow: "How it works",
    title: "From infraction to receipt",
    description:
      "A clear, digital path for drivers. Agents initiate; drivers stay informed and can act quickly.",
    steps: {
      detected: {
        title: "Infraction recorded",
        description:
          "An agent issues a violation linked to the driver and vehicle, with optional photo evidence.",
      },
      notified: {
        title: "Driver notified",
        description:
          "The driver sees the infraction in their dashboard with amount, details, and due date.",
      },
      reviewed: {
        title: "Review the case",
        description:
          "Open the dossier: type, location, proof photo, and payment status at a glance.",
      },
      paid: {
        title: "Pay securely",
        description:
          "Settle online from the driver workspace. Status updates as soon as payment is confirmed.",
      },
      receipt: {
        title: "Official receipt",
        description:
          "Download a digital receipt archived in the driver profile for your records.",
      },
    },
    discountTitle: "30% off when you pay within 72 hours",
    discountBody:
      "Pay within {hours} hours of notification and receive a {percent} reduction on the fine amount, per official Gabonese fee rules.",
  },
  payments: {
    eyebrow: "For drivers",
    title: "Pay fines without the queue",
    description:
      "Settle from your phone or computer. No need to visit a counter for every step of the process.",
    mobileMoney: {
      title: "Mobile Money",
      description:
        "Pay from your mobile wallet in seconds when supported by your provider.",
      detail: "Airtel · Moov · Orange",
    },
    card: {
      title: "Bank card",
      description:
        "Use Visa or Mastercard with secure checkout when card payment is enabled.",
      detail: "3D Secure",
    },
  },
  getStarted: {
    eyebrow: "Get started",
    title: "Sign in or create an account",
    description:
      "Register to open your driver profile or sign in to continue. Agent applications and workspace selection happen after you are logged in.",
    registerCta: "Create an account",
    loginCta: "Sign in",
    loginHint: "Already have an account?",
  },
  cta: {
    badge: "Official platform — Gabonese Republic",
    title: "Ready to get started?",
    description:
      "Create an account or sign in to access your workspace. Choose driver or agent tools once you are logged in.",
    registerButton: "Create an account",
    loginButton: "Sign in",
    contact: "Institutional inquiries:",
  },
  footer: {
    version: "Version 1.0 — Gabon road safety",
    partnership: "Institutional partnership",
    ministry: "Ministry of Transport, Gabonese Republic",
    copyright: "All rights reserved — Gabonese Republic",
  },
} as const;

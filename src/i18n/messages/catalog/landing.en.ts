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
      "NJ Safety Driver connects motorists and field agents on one platform. Register your vehicle, upload documents, pay fines online, and let agents verify compliance in the field.",
    ctaDriver: "Start as a driver",
    ctaAgent: "Apply as an agent",
    ctaLogin: "Already have an account? Sign in",
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
      "Whether you manage your own compliance or enforce it on the road, NJ Safety Driver gives you a dedicated workspace with the tools that matter.",
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
      cta: "Create driver account",
    },
    agent: {
      tag: "Agent workspace",
      title: "For field agents",
      description:
        "Verify drivers on the spot, search plates, issue infractions, and attach geolocated evidence.",
      features: [
        "Secure sign-in after admin approval",
        "Plate search and driver lookup",
        "Issue infractions with official fee schedule",
        "Upload photo evidence from the field",
      ],
      cta: "Apply as an agent",
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
  portals: {
    eyebrow: "Choose your path",
    title: "Pick the workspace that fits your role",
    driver: {
      role: "Driver",
      subtitle: "Driver portal",
      items: [
        "Profile and vehicle registration",
        "Document uploads and verification status",
        "Infraction history and payment",
        "Digital receipts in your account",
      ],
      cta: "Register as a driver",
    },
    agent: {
      role: "Field agent",
      subtitle: "Agent workspace",
      items: [
        "Online application with admin review",
        "Plate search and driver lookup",
        "Issue infractions in the field",
        "Photo evidence and session audit trail",
      ],
      cta: "Apply as an agent",
    },
    loginHint: "Already have an account?",
  },
  cta: {
    badge: "Official platform — Gabonese Republic",
    title: "Ready to get started?",
    description:
      "Drivers register in minutes. Agents apply online and access the field workspace after approval. Sign in anytime if you already have an account.",
    driverButton: "Create driver account",
    agentButton: "Apply as an agent",
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

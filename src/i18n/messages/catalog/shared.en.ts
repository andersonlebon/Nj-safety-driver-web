export const sharedStatus = {
  verification: {
    pending_documents: "Documents missing",
    pending_review: "Pending review",
    active: "Active",
    rejected: "Rejected",
  },
  payment: {
    paid: "Paid",
    unpaid: "Unpaid",
    pending: "Pending",
    initialized: "Initialized",
  },
  documentExpiry: {
    noExpiry: "No expiry date",
    expiredDays: "Expired {days} day(s) ago",
    expiresInDays: "Expires in {days} day(s)",
    validUntil: "Valid until {date}",
  },
} as const;

export const sharedTables = {
  search: "Search",
  searchPlaceholder: "Search…",
  status: "Status",
  allStatuses: "All statuses",
  from: "From",
  to: "To",
  noRows: "No rows",
  noMatchingRows: "No matching rows",
  noMatchForSearch:
    'Nothing matches "{searchTerm}". Try clearing filters.',
  filterHint: "Try clearing filters or adjusting your search.",
  reset: "Reset",
  matchingRows: "{count} matching row(s)",
} as const;

export const sharedErrors = {
  global: {
    somethingWentWrong: "Something went wrong",
    connectionIssue: "Connection or app version issue. Reloading…",
    unexpected: "An unexpected error occurred.",
    reloadNow: "Reload now",
    tryAgain: "Try again",
  },
  notFound: {
    code: "404",
    title: "Page not found",
    description:
      "The page you are looking for does not exist or has been moved.",
    goHome: "Go home",
  },
} as const;

export const sharedTheme = {
  toggle: "Toggle theme",
  light: "Switch to light mode",
  dark: "Switch to dark mode",
  switchToLight: "Switch to light mode",
  switchToDark: "Switch to dark mode",
  toggleLabel: "Theme toggle",
} as const;

export const sharedCamera = {
  permission:
    "Camera permission was denied. Allow camera access in your browser settings, then retry.",
  unavailable:
    "Camera is unavailable or already in use. Close other camera apps and retry, or enter details manually.",
  unsupported:
    "Camera is not supported in this browser. Enter details manually.",
  takePhoto: "Take photo",
  starting: "Starting camera...",
  removePhoto: "Remove photo",
  capture: "Capture",
  cancel: "Cancel",
  retake: "Retake photo",
  capturePreview: "Capture preview",
} as const;

export const sharedComments = {
  title: "Chat with staff",
  empty: "No comments yet. Start the conversation with the driver here.",
  you: "You",
  addComment: "Add a comment",
  sendComment: "Send comment",
  placeholder:
    "Ask for missing documents, clarify details, or leave a note for the driver…",
  validationEmpty: "Write a comment before sending.",
  loadingAria: "Loading comments",
  staffMember: "Staff member",
  driver: "Driver",
  unknown: "Unknown",
} as const;

export const sharedInfractions = {
  detail: {
    description: "Infraction on plate {plate}",
    plate: "Plate",
    country: "Country",
    type: "Type",
    status: "Status",
    fineAmount: "Fine amount",
    location: "Location",
    descriptionLabel: "Description",
    filedOn: "Filed on",
    lastUpdated: "Last updated",
    evidence: "Evidence",
    evidenceNone: "None",
    viewEvidence: "View evidence",
    openPlateSearch: "Open plate search",
    close: "Close",
    emptyValue: "—",
    noLinkedDriver:
      "No linked driver account. Ask the visitor to register, then search this plate again.",
  },
} as const;

export const sharedVehicles = {
  detail: {
    sections: {
      overview: "Overview",
      registration: "Registration",
      idDocs: "ID docs",
      owner: "Owner",
      documents: "Documents",
      fines: "Fines",
      infractions: "Infractions",
      tracking: "Tracking",
      verify: "Verify",
    },
    modalTitle: "Vehicle {plate}",
    modalDescription:
      "Use the section links to jump to registration, fines, or tracking.",
    staffModalDescription:
      "Review vehicle details, documents, and verification — actions stay pinned at the bottom.",
    staffModalDescriptionReadOnly: "Review vehicle and infraction details.",
    foreignTransit: "Foreign / transit",
    noVehicleDetails: "No vehicle details",
    agentSearchLink: "Agent search link",
    registered: "Registered",
    insurance: "Insurance",
    insuranceValid: "Valid",
    insuranceMissing: "Missing",
    inspection: "Inspection",
    inspectionValid: "Valid",
    inspectionMissing: "Missing",
    borderCheckpoint: "Border checkpoint",
    borderEntry: "Border entry",
    transitDriver: "Transit driver",
    transitPhone: "Transit phone",
    passportId: "Passport / ID no.",
    notes: "Notes",
    owner: "Owner",
    fineTotals: "Fine totals",
    paid: "Paid",
    pending: "Pending",
    unpaid: "Unpaid",
    unpaidSummary: "{unpaid} unpaid infraction(s) of {total} total",
    recentInfractions: "Recent infractions",
    tracking: "Tracking",
    trackingEmpty: "No tracking history yet.",
    close: "Close",
    approveVehicle: "Approve vehicle",
    rejectLock: "Reject / lock",
    rejectConfirm:
      "Reject and lock this vehicle? The owner may need staff review to use it again.",
    verifyTabHint:
      "Confirm registration papers and photos match this plate before approving. Quick actions are also in the footer.",
    vehicleDocumentsTitle: "Vehicle documents",
    verificationApproveTitle: "Approve vehicle",
    verificationRejectTitle: "Reject vehicle",
  },
} as const;

export const sharedCharts = {
  noData: "No data",
  noDataYet: "No data yet",
  complianceScore: "Compliance score",
  total: "Total",
  scoreOutOf: "/ 100",
  totalWithAmount: "Total: {amount}",
} as const;

export const sharedSetup = {
  brandName: "NJ Safety Driver",
  lockedTitle: "Setup already complete",
  lockedDescription:
    "An administrator account exists for this installation, so the one-time setup route is locked.",
  goToSignIn: "Go to sign-in",
  title: "Create the first administrator",
  description:
    "This one-time form bootstraps the very first admin for your NJ Safety Driver installation. Once you submit, this route permanently locks and any further admins must be promoted from the admin dashboard.",
  authorizedEmailHint: "Only {email} is authorised to complete this setup.",
  form: {
    fullName: "Full name",
    email: "Email",
    password: "Password",
    passwordHint: "Minimum 8 characters.",
    confirmPassword: "Confirm password",
    submit: "Create administrator account",
    unexpectedError:
      "Setup failed unexpectedly. Check the console and try again.",
  },
  errors: {
    allFieldsRequired: "All fields are required.",
    restrictedEmail:
      "This setup is restricted. Only {email} may create the first administrator account.",
    passwordTooShort: "Password must be at least 8 characters.",
    passwordMismatch: "Passwords do not match.",
    alreadyComplete: "Setup is already complete. Sign in at /login.",
    emailExists:
      "An account with that email already exists. Sign in at /login or use a different email.",
    createUserFailed: "Failed to create user.",
    finalizeFailed:
      "We couldn't finish creating your admin account. {error}",
    signInAfterCreate:
      "Admin account created. Please sign in at /login. ({error})",
    unexpectedFailure:
      "Setup failed unexpectedly. Check the server console for details and try again.",
  },
} as const;

export const sharedAuthProfile = {
  titleMulti: "Choose how to continue",
  titleSingle: "Your account",
  signedInAs: "Signed in as {name}",
  signOut: "Sign out",
  registerDriverTitle: "Register as Driver",
  registerDriverDescription:
    "Manage your vehicle, documents, and infractions",
  registerStaffTitle: "Apply as Field Agent",
  registerStaffDescription:
    "Issue infractions and manage driver compliance",
  driverLabel: "Driver",
  driverDescription: "Manage your vehicle, documents, and infractions",
  adminLabel: "Administrator",
  adminDescription:
    "Full system access — manage agents, finance, and all drivers",
  agentLabel: "Field Agent",
  agentDescription: "Issue infractions and approve driver profiles",
  activeBadge: "Active",
  pendingTitle: "Field Agent",
  pendingDescription: "Application pending administrator approval",
  backToHome: "Back to home",
} as const;

export const sharedAuthAgentRegister = {
  pageTitle: "Apply as a field agent",
  pageSubtitle:
    "Submit an application to become a traffic enforcement agent. An administrator will review and approve access.",
  infoAlert:
    "Agent accounts require administrator approval before you can access the agent dashboard.",
  fullName: "Full name",
  phone: "Phone",
  phonePlaceholder: "+241 ...",
  badgeId: "Badge / employee ID (optional)",
  badgePlaceholder: "Ministry badge number",
  noteLabel: "Why do you want agent access?",
  notePlaceholder: "Your role, station, or supervisor contact...",
  submit: "Submit agent application",
  backToProfile: "Back to profile",
  pendingTitle: "Application under review",
  pendingDescription:
    "Thank you for applying. An administrator will review your request and approve your agent account. You will receive access to the staff dashboard once approved.",
  rejectedTitle: "Your agent application was not approved.",
  signOut: "Sign out",
  backToHome: "Back to home",
  errorNotSignedIn: "You must be signed in to apply.",
  errorRequiredFields: "Full name and phone are required.",
  errorPendingApproval: "Your agent application is still pending approval.",
} as const;

export const sharedAuthDriverRegister = {
  pageTitle: "Register as a driver",
  pageSubtitleConfirm: "Confirm your details to open your driver workspace.",
  pageSubtitleNew:
    "Set up your driver profile to manage vehicles, documents, and infractions.",
  fullName: "Full name",
  phoneOptional: "Phone (optional)",
  phonePlaceholder: "+241 ...",
  submitContinue: "Continue as driver",
  submitCreate: "Create driver profile",
  errorNotSignedIn: "You must be signed in.",
  errorFullNameRequired: "Full name is required.",
} as const;

export const sharedEn = {
  status: sharedStatus,
  tables: sharedTables,
  errors: sharedErrors,
  theme: sharedTheme,
  camera: sharedCamera,
  comments: sharedComments,
  infractions: sharedInfractions,
  vehicles: sharedVehicles,
  charts: sharedCharts,
  setup: sharedSetup,
  authProfile: sharedAuthProfile,
  authAgentRegister: sharedAuthAgentRegister,
  authDriverRegister: sharedAuthDriverRegister,
} as const;

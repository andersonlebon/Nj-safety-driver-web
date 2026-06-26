export const sharedStatus = {
  verification: {
    pending_documents: "Documents manquants",
    pending_review: "En attente de validation",
    active: "Actif",
    rejected: "Refusé",
  },
  payment: {
    paid: "Payé",
    unpaid: "Impayé",
    pending: "En attente",
    initialized: "Initialisé",
  },
  transaction: {
    initialized: "Initialisé",
    rejected: "Refusé",
  },
  documentExpiry: {
    noExpiry: "Pas de date d'expiration",
    expiredDays: "Expiré il y a {days} jour(s)",
    expiresInDays: "Expire dans {days} jour(s)",
    validUntil: "Valide jusqu'au {date}",
  },
} as const;

export const sharedTables = {
  search: "Rechercher",
  searchPlaceholder: "Rechercher…",
  status: "Statut",
  allStatuses: "Tous les statuts",
  from: "Du",
  to: "Au",
  noRows: "Aucune ligne",
  noMatchingRows: "Aucune ligne correspondante",
  noMatchForSearch:
    'Aucun résultat pour « {searchTerm} ». Essayez de réinitialiser les filtres.',
  filterHint:
    "Essayez de réinitialiser les filtres ou d'ajuster votre recherche.",
  reset: "Réinitialiser",
  matchingRows: "{count} ligne(s) correspondante(s)",
} as const;

export const sharedErrors = {
  global: {
    somethingWentWrong: "Une erreur est survenue",
    connectionIssue:
      "Problème de connexion ou de version de l'application. Rechargement…",
    unexpected: "Une erreur inattendue est survenue.",
    reloadNow: "Recharger maintenant",
    tryAgain: "Réessayer",
  },
  notFound: {
    code: "404",
    title: "Page introuvable",
    description:
      "La page que vous recherchez n'existe pas ou a été déplacée.",
    goHome: "Retour à l'accueil",
  },
} as const;

export const sharedTheme = {
  toggle: "Changer le thème",
  light: "Passer en mode clair",
  dark: "Passer en mode sombre",
  switchToLight: "Passer en mode clair",
  switchToDark: "Passer en mode sombre",
  toggleLabel: "Basculer le thème",
} as const;

export const sharedCamera = {
  permission:
    "L'accès à la caméra a été refusé. Autorisez la caméra dans les paramètres du navigateur, puis réessayez.",
  unavailable:
    "La caméra est indisponible ou déjà utilisée. Fermez les autres applications caméra et réessayez, ou saisissez les informations manuellement.",
  unsupported:
    "La caméra n'est pas prise en charge par ce navigateur. Saisissez les informations manuellement.",
  takePhoto: "Prendre une photo",
  starting: "Démarrage de la caméra...",
  removePhoto: "Supprimer la photo",
  capture: "Capturer",
  cancel: "Annuler",
  retake: "Reprendre la photo",
  capturePreview: "Aperçu de la capture",
} as const;

export const sharedComments = {
  title: "Discussion avec le personnel",
  empty:
    "Aucun commentaire pour l'instant. Commencez la conversation avec le chauffeur ici.",
  you: "Vous",
  addComment: "Ajouter un commentaire",
  sendComment: "Envoyer le commentaire",
  placeholder:
    "Demandez des documents manquants, précisez des détails ou laissez une note au chauffeur…",
  validationEmpty: "Écrivez un commentaire avant d'envoyer.",
  loadingAria: "Chargement des commentaires",
  staffMember: "Membre du personnel",
  driver: "Chauffeur",
  unknown: "Inconnu",
} as const;

export const sharedInfractions = {
  detail: {
    description: "Infraction sur la plaque {plate}",
    plate: "Plaque",
    country: "Pays",
    type: "Type",
    status: "Statut",
    fineAmount: "Montant de l'amende",
    location: "Lieu",
    descriptionLabel: "Description",
    filedOn: "Déposée le",
    lastUpdated: "Dernière mise à jour",
    evidence: "Preuve",
    evidenceNone: "Aucune",
    viewEvidence: "Voir la preuve",
    openPlateSearch: "Ouvrir la recherche plaque",
    close: "Fermer",
    emptyValue: "—",
    noLinkedDriver:
      "Aucun compte chauffeur lié. Demandez au visiteur de s'inscrire, puis recherchez à nouveau cette plaque.",
  },
} as const;

export const sharedVehicles = {
  detail: {
    sections: {
      overview: "Vue d'ensemble",
      registration: "Immatriculation",
      idDocs: "Pièces d'identité",
      owner: "Propriétaire",
      documents: "Documents",
      fines: "Amendes",
      infractions: "Infractions",
      tracking: "Suivi",
      verify: "Vérifier",
      comments: "Commentaires",
    },
    modalTitle: "Véhicule {plate}",
    modalDescription:
      "Utilisez les liens de section pour accéder à l'immatriculation, aux amendes ou au suivi.",
    staffModalDescription:
      "Consultez les détails du véhicule, les documents et la vérification — les actions restent épinglées en bas.",
    staffModalDescriptionReadOnly:
      "Consultez les détails du véhicule et des infractions.",
    foreignTransit: "Étranger / transit",
    noVehicleDetails: "Aucun détail sur le véhicule",
    agentSearchLink: "Lien de recherche agent",
    registered: "Immatriculé",
    insurance: "Assurance",
    insuranceValid: "Valide",
    insuranceMissing: "Manquante",
    inspection: "Contrôle technique",
    inspectionValid: "Valide",
    inspectionMissing: "Manquant",
    borderCheckpoint: "Poste frontalier",
    borderEntry: "Entrée frontalière",
    transitDriver: "Chauffeur de transit",
    transitPhone: "Téléphone de transit",
    passportId: "Passeport / n° d'identité",
    notes: "Notes",
    owner: "Propriétaire",
    fineTotals: "Totaux des amendes",
    paid: "Payé",
    pending: "En attente",
    unpaid: "Impayé",
    unpaidSummary:
      "{unpaid} infraction(s) impayée(s) sur {total} au total",
    recentInfractions: "Infractions récentes",
    tracking: "Suivi",
    trackingEmpty: "Aucun historique de suivi pour l'instant.",
    close: "Fermer",
    approveVehicle: "Approuver le véhicule",
    rejectLock: "Refuser / verrouiller",
    rejectConfirm:
      "Refuser et verrouiller ce véhicule ? Le propriétaire pourrait avoir besoin d'une révision par le personnel pour l'utiliser à nouveau.",
    verifyTabHint:
      "Confirmez que les papiers d'immatriculation et les photos correspondent à cette plaque avant d'approuver. Des actions rapides sont aussi disponibles dans le pied de page.",
    vehicleDocumentsTitle: "Documents du véhicule",
    verificationApproveTitle: "Approuver le véhicule",
    verificationRejectTitle: "Refuser le véhicule",
    comments: {
      title: "Notes de vérification véhicule",
      hint: "Notes du personnel sur les documents et la vérification de ce véhicule. Le conducteur peut lire et répondre ici. Séparées du chat du profil conducteur.",
      empty: "Aucune note pour ce véhicule. Laissez la première note pour les autres agents.",
      formLabel: "Ajouter une note véhicule",
      formPlaceholder:
        "Problèmes de documents, pièces manquantes ou contexte de vérification pour cette plaque…",
      formSend: "Publier la note",
      loadingAria: "Chargement des notes véhicule",
      senderYou: "Vous",
      errorEmpty: "Saisissez une note avant d'envoyer.",
    },
  },
} as const;

export const sharedCharts = {
  noData: "Aucune donnée",
  noDataYet: "Pas encore de données",
  complianceScore: "Score de conformité",
  total: "Total",
  scoreOutOf: "/ 100",
  totalWithAmount: "Total : {amount}",
} as const;

export const sharedSetup = {
  brandName: "NJ Safety Driver",
  lockedTitle: "Configuration déjà terminée",
  lockedDescription:
    "Un compte administrateur existe pour cette installation, la route de configuration unique est verrouillée.",
  goToSignIn: "Aller à la connexion",
  title: "Créer le premier administrateur",
  description:
    "Ce formulaire unique initialise le tout premier administrateur de votre installation NJ Safety Driver. Une fois soumis, cette route se verrouille définitivement et les autres administrateurs doivent être promus depuis le tableau de bord admin.",
  authorizedEmailHint:
    "Seul {email} est autorisé à effectuer cette configuration.",
  form: {
    fullName: "Nom complet",
    email: "E-mail",
    password: "Mot de passe",
    passwordHint: "Minimum 8 caractères.",
    confirmPassword: "Confirmer le mot de passe",
    submit: "Créer le compte administrateur",
    unexpectedError:
      "La configuration a échoué de manière inattendue. Consultez la console et réessayez.",
  },
  errors: {
    allFieldsRequired: "Tous les champs sont obligatoires.",
    restrictedEmail:
      "Cette configuration est restreinte. Seul {email} peut créer le premier compte administrateur.",
    passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères.",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    alreadyComplete:
      "La configuration est déjà terminée. Connectez-vous sur /login.",
    emailExists:
      "Un compte avec cet e-mail existe déjà. Connectez-vous sur /login ou utilisez un autre e-mail.",
    createUserFailed: "Échec de la création de l'utilisateur.",
    finalizeFailed:
      "Nous n'avons pas pu finaliser la création de votre compte admin. {error}",
    signInAfterCreate:
      "Compte admin créé. Veuillez vous connecter sur /login. ({error})",
    unexpectedFailure:
      "La configuration a échoué de manière inattendue. Consultez la console serveur pour plus de détails et réessayez.",
  },
} as const;

export const sharedAuthProfile = {
  titleMulti: "Choisissez comment continuer",
  titleSingle: "Votre compte",
  signedInAs: "Connecté en tant que {name}",
  signOut: "Déconnexion",
  registerDriverTitle: "S'inscrire comme chauffeur",
  registerDriverDescription:
    "Gérez votre véhicule, vos documents et vos infractions",
  registerStaffTitle: "Postuler comme agent de terrain",
  registerStaffDescription:
    "Émettre des infractions et gérer la conformité des chauffeurs",
  driverLabel: "Chauffeur",
  driverDescription:
    "Gérez votre véhicule, vos documents et vos infractions",
  adminLabel: "Administrateur",
  adminDescription:
    "Accès complet au système — gérer les agents, les finances et tous les chauffeurs",
  agentLabel: "Agent de terrain",
  agentDescription:
    "Émettre des infractions et approuver les profils chauffeurs",
  activeBadge: "Actif",
  pendingTitle: "Agent de terrain",
  pendingDescription: "Candidature en attente d'approbation administrateur",
  backToHome: "Retour à l'accueil",
} as const;

export const sharedAuthAgentRegister = {
  pageTitle: "Postuler comme agent de terrain",
  pageSubtitle:
    "Soumettez une candidature pour devenir agent d'application du code de la route. Un administrateur examinera et approuvera l'accès.",
  infoAlert:
    "Les comptes agent nécessitent l'approbation d'un administrateur avant d'accéder au tableau de bord agent.",
  fullName: "Nom complet",
  phone: "Téléphone",
  phonePlaceholder: "+241 ...",
  badgeId: "Badge / ID employé (optionnel)",
  badgePlaceholder: "Numéro de badge ministériel",
  noteLabel: "Pourquoi souhaitez-vous un accès agent ?",
  notePlaceholder: "Votre rôle, poste ou contact superviseur...",
  submit: "Soumettre la candidature agent",
  backToProfile: "Retour au profil",
  pendingTitle: "Candidature en cours d'examen",
  pendingDescription:
    "Merci pour votre candidature. Un administrateur examinera votre demande et approuvera votre compte agent. Vous aurez accès au tableau de bord personnel une fois approuvé.",
  rejectedTitle: "Votre candidature agent n'a pas été approuvée.",
  signOut: "Déconnexion",
  backToHome: "Retour à l'accueil",
  errorNotSignedIn: "Vous devez être connecté pour postuler.",
  errorRequiredFields: "Le nom complet et le téléphone sont obligatoires.",
  errorPendingApproval:
    "Votre candidature agent est toujours en attente d'approbation.",
} as const;

export const sharedAuthDriverRegister = {
  pageTitle: "S'inscrire comme chauffeur",
  pageSubtitleConfirm:
    "Confirmez vos informations pour ouvrir votre espace chauffeur.",
  pageSubtitleNew:
    "Configurez votre profil chauffeur pour gérer véhicules, documents et infractions.",
  fullName: "Nom complet",
  phoneOptional: "Téléphone (optionnel)",
  phonePlaceholder: "+241 ...",
  submitContinue: "Continuer comme chauffeur",
  submitCreate: "Créer le profil chauffeur",
  errorNotSignedIn: "Vous devez être connecté.",
  errorFullNameRequired: "Le nom complet est obligatoire.",
} as const;

export const sharedFr = {
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

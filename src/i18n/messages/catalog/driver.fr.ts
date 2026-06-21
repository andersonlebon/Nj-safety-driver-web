export const driverShell = {
  banner: {
    accountStatus: "Statut du compte : {status}",
    pendingDocumentsBody:
      "Votre profil n'est pas encore entièrement actif. Complétez vos informations personnelles et téléversez les documents requis sur votre page profil.",
    pendingReviewBody:
      "Un administrateur examine vos documents. Vous pouvez toujours parcourir votre tableau de bord en attendant.",
    rejectedBody:
      "Votre compte n'a pas été approuvé. Consultez le message ci-dessous et mettez à jour votre profil ou vos documents.",
    ctaCompleteProfile: "Compléter le profil",
    ctaUpdateDocuments: "Mettre à jour les documents",
    ctaUploadDocuments: "Téléverser les documents",
    adminMessageTitle: "Action requise de l'administrateur",
    adminMessageBody: "{message}",
  },
} as const;

export const driverOverview = {
  welcome: "Bienvenue",
  welcomeWithName: "Bienvenue, {firstName}",
  description:
    "Gérez votre profil chauffeur, vos véhicules et vos infractions.",
  kpi: {
    vehicles: "Véhicules",
    registerFirst: "Immatriculez votre premier véhicule",
    insuredInspected: "{insured} assuré(s) · {inspected} contrôlé(s)",
    documents: "Documents",
    openInfractions: "Infractions ouvertes",
    pendingPayment: "{count} en attente de paiement",
    noOutstanding: "Aucune amende en cours",
    totalDue: "Total dû",
  },
  charts: {
    finesTitle: "Amendes accumulées — 6 derniers mois",
    total: "Total : {amount}",
    finesAriaLabel: "Total des amendes par mois, 6 derniers mois",
    finesTooltipSeries: "Total",
    paymentStatusTitle: "Statut de paiement",
    paymentStatusAriaLabel:
      "Répartition des statuts de paiement pour vos infractions",
    paid: "Payé",
    pending: "En attente",
    unpaid: "Impayé",
  },
  compliance: {
    title: "Score de conformité",
    descriptionExcellent:
      "Tout est en ordre. Continuez ainsi — conduisez prudemment.",
    descriptionWarning:
      "Action recommandée. Réglez les points ouverts bientôt.",
    descriptionCritical:
      "Critique. Réglez les infractions impayées avant de conduire.",
    formula:
      "Formule : 100 moins {penalty} pts par infraction impayée. Les transactions de paiement sont suivies séparément ; les points sont restaurés uniquement lorsque l'infraction est marquée payée. Les scores à {minimum} % ou moins nécessitent une révision avant de conduire.",
  },
  recentInfractions: {
    title: "Infractions récentes",
    viewAll: "Tout voir",
    emptyTitle: "Aucune infraction",
    emptyDescription:
      "Vous n'avez actuellement aucune infraction enregistrée.",
    date: "Date",
    plate: "Plaque",
    type: "Type",
    amount: "Montant",
    status: "Statut",
  },
} as const;

export const driverProfile = {
  onboarding: {
    title: "Complétez votre profil",
    description:
      "Ajoutez vos informations personnelles, documents et véhicule pour activer votre compte chauffeur.",
    errors: {
      allFieldsRequired:
        "Tous les champs d'informations personnelles sont obligatoires.",
      notAuthenticated: "Non authentifié.",
      missingPersonalInfo: "Informations personnelles manquantes.",
      filePathsNotScoped:
        "Les chemins de fichiers téléversés ne sont pas limités à votre compte.",
      duplicateBeforeSubmit:
        "Image de document en double détectée. Veuillez remplacer une pièce jointe avant de soumettre.",
      profileSaveFailed:
        "Impossible d'enregistrer votre profil : {error}",
      vehicleSaveFailed: "Le véhicule n'a pas pu être enregistré : {error}",
      documentSaveFailed: "Le document n'a pas pu être enregistré : {error}",
      documentUploadFailed: "Échec du téléversement du document : {error}",
      completeFailed:
        "Impossible de terminer l'intégration : {error}",
    },
  },
  tabs: {
    ariaLabel: "Sections du profil",
    personalInfo: "Informations personnelles",
    documents: "Documents",
    chat: "Discussion avec le personnel",
  },
  personal: {
    title: "Informations personnelles",
    description:
      "Gérez votre profil, vos documents et vos messages avec le personnel.",
    editButton: "Modifier le profil",
    editDialogTitle: "Informations personnelles",
    editDialogDescription:
      "Mettez à jour vos coordonnées et informations d'identité.",
    fullName: "Nom complet",
    email: "E-mail",
    phone: "Téléphone",
    nationalId: "Carte d'identité",
    driverLicense: "Permis de conduire",
    memberSince: "Membre depuis",
    address: "Adresse",
    emptyValue: "—",
    fallbackName: "Chauffeur",
  },
  form: {
    fullName: "Nom complet",
    phone: "Numéro de téléphone",
    nationalId: "Numéro de carte d'identité",
    driverLicense: "Numéro de permis de conduire",
    nationality: "Nationalité",
    address: "Adresse",
    save: "Enregistrer les modifications",
    success: "Profil mis à jour avec succès.",
  },
  chat: {
    title: "Discussion avec le personnel",
    loadingAria: "Chargement des commentaires",
    empty:
      "Aucun commentaire pour l'instant. Commencez la conversation avec le chauffeur ici.",
    senderYou: "Vous",
    senderUnknown: "Inconnu",
    formLabel: "Ajouter un commentaire",
    formPlaceholder:
      "Demandez des documents manquants, précisez des détails ou laissez une note au chauffeur…",
    formSend: "Envoyer le commentaire",
    errorEmpty: "Écrivez un commentaire avant d'envoyer.",
    errorEmptyServer: "Le commentaire ne peut pas être vide.",
  },
} as const;

export const driverDocuments = {
  title: "Documents",
  description:
    "Téléversez chaque document requis ci-dessous. Appuyez sur une ligne pour ajouter ou remplacer des fichiers.",
  submit: {
    button: "Soumettre tous les documents pour vérification",
    dialogTitle: "Impossible de soumettre pour l'instant",
    errorMissingPersonal:
      "Téléversez votre carte d'identité (recto et verso) et votre permis de conduire (recto et verso) avant de soumettre pour examen.",
    errorNoVehicle:
      "Immatriculez au moins un véhicule avant de soumettre pour examen.",
    errorMissingVehicleDocs:
      "Chaque véhicule a besoin d'une photo de face et d'une carte grise avant l'examen.",
  },
  validation: {
    deliveredRequired:
      "La date de délivrance est obligatoire pour ce document.",
    deliveredFuture:
      "La date de délivrance ne peut pas être dans le futur.",
    expirationRequired:
      "La date d'expiration est obligatoire pour ce document.",
    expirationPast:
      "La date d'expiration doit être aujourd'hui ou dans le futur.",
    expirationBeforeDelivered:
      "La date d'expiration doit être égale ou postérieure à la date de délivrance.",
  },
  legacyUpload: {
    trigger: "Téléverser un document",
    title: "Téléverser un document",
    description:
      "Ajoutez des pièces d'identité, permis ou documents véhicule en quelques étapes guidées.",
    stepType: "Type de document",
    stepDetails: "Détails",
    stepFile: "Téléverser le fichier",
    docType: "Que téléversez-vous ?",
    typeIdentity: "Document d'identité",
    typeDriverLicense: "Permis de conduire",
    typeVehiclePhoto: "Photo du véhicule",
    typeVehicleRegistration: "Immatriculation véhicule",
    typeInsurance: "Certificat d'assurance",
    typeInspection: "Contrôle technique",
    typeOther: "Autre",
    vehicle: "Véhicule",
    selectVehicle: "— sélectionner un véhicule —",
    label: "Libellé (optionnel)",
    labelPlaceholder: "ex. recto, verso, 2025",
    deliveredDate: "Date de délivrance",
    expirationDate: "Date d'expiration",
    noDatesNeeded:
      "Ce type de document ne nécessite pas de dates de validité.",
    evidenceDescription:
      "Glissez-déposez ou appuyez pour choisir une photo nette ou un PDF.",
    submit: "Téléverser le document",
    errorSelectVehicle:
      "Veuillez sélectionner un véhicule pour ce document.",
    errorFileRequired:
      "Veuillez ajouter une photo ou un PDF à téléverser.",
    errorNotSignedIn: "Non connecté.",
    errorDuplicateFile:
      "Ce fichier exact est déjà téléversé. Utilisez Remplacer sur le document existant si nécessaire.",
  },
  legacyList: {
    typeIdentity: "Carte d'identité nationale",
    typeDriverLicense: "Permis de conduire",
    typeInsurance: "Assurance",
    typeInspection: "Contrôle technique",
    typeVehiclePhoto: "Photo du véhicule",
    typeRegistration: "Immatriculation véhicule",
    typePassport: "Passeport / pièce de voyage",
    typeOther: "Autre",
    categoryIdentity: "Identité",
    categoryDriverLicense: "Permis de conduire",
    categoryVehiclePhotos: "Photos du véhicule",
    categoryVehiclePapers: "Documents véhicule",
    categoryOther: "Autre",
    columnType: "Type",
    columnLabel: "Libellé",
    columnFile: "Fichier",
    columnUploaded: "Téléversé",
    columnExpiry: "Expiration",
    columnActions: "Actions",
    actionView: "Voir",
    actionReplace: "Remplacer",
    actionReplaceTitle: "Remplacer ce fichier",
    actionDeleteTitle: "Supprimer ce document",
    confirmDelete: "Supprimer ce document ?",
    errorDuplicateFile:
      "Ce fichier exact est déjà téléversé. Choisissez une photo différente.",
    replaceHint:
      "Utilisez « Remplacer » pour garder le même emplacement mais changer le fichier — l'ancienne version est supprimée automatiquement.",
    expiryNoDate: "Pas de date d'expiration",
    expiryExpired: "Expiré il y a {days} jour(s)",
    expiryExpiresSoon: "Expire dans {days} jour(s)",
    expiryValidUntil: "Valide jusqu'au {date}",
  },
} as const;

export const driverVehicles = {
  title: "Véhicules",
  description: "Immatriculez et gérez vos véhicules.",
  listHeading: "Vos véhicules",
  emptyTitle: "Aucun véhicule immatriculé",
  emptyDescription:
    'Cliquez sur « Ajouter un véhicule » pour immatriculer votre première voiture.',
  addButton: "Ajouter un véhicule",
  addDialog: {
    title: "Immatriculer un véhicule",
    description:
      "Ajoutez un nouveau véhicule en deux étapes rapides. Téléversez les photos depuis Documents ensuite.",
  },
  form: {
    stepCountryPlate: "Pays et plaque",
    stepDetails: "Détails du véhicule",
    stepStatus: "Statut",
    registrationCountry: "Pays d'immatriculation",
    plateNumber: "Numéro de plaque",
    platePlaceholder: "ex. AB-123-CD ou plaque étrangère",
    brand: "Marque",
    model: "Modèle",
    color: "Couleur",
    selectColor: "Choisir une couleur",
    colorBlack: "Noir",
    colorWhite: "Blanc",
    colorSilver: "Argent",
    colorGray: "Gris",
    colorRed: "Rouge",
    colorBlue: "Bleu",
    colorGreen: "Vert",
    colorOther: "Autre",
    year: "Année",
    insurance: "Assurance",
    inspection: "Contrôle technique",
    notInsured: "Non assuré",
    insured: "Assuré",
    notInspected: "Non contrôlé",
    inspectionValid: "Contrôle valide",
    foreignAlert:
      "Plaque étrangère — assurez-vous de téléverser les documents frontaliers après l'immatriculation.",
    submit: "Immatriculer le véhicule",
    errorPlateRequired: "Le numéro de plaque est obligatoire.",
  },
  plateScan: {
    scanLabel: "Scanner la plaque avec la caméra",
    analyzing: "Analyse de la photo…",
    confirmButton: "Confirmer la plaque",
    suggested:
      "Plaque suggérée ({confidence} % de confiance) — veuillez vérifier.",
    hint: "Pointez la caméra vers la plaque, puis confirmez ou modifiez le numéro. L'OCR automatique arrive dans une prochaine version.",
    ready: "Plaque prête — continuez ou recherchez.",
  },
  card: {
    insurance: "Assurance",
    inspection: "Contrôle",
    lastSeen: "Vu pour la dernière fois :",
    fullPage: "Page complète",
    deleteAria: "Supprimer le véhicule",
    confirmDelete:
      "Supprimer ce véhicule ? Cette action est irréversible.",
  },
  detail: {
    description:
      "Immatriculation du véhicule, amendes et historique de suivi.",
    backLink: "Retour aux véhicules",
    modalTitle: "Véhicule {plate}",
    modalDescription:
      "Utilisez les liens de section pour accéder à l'immatriculation, aux amendes ou au suivi.",
    close: "Fermer",
    sectionOverview: "Vue d'ensemble",
    sectionRegistration: "Immatriculation",
    sectionIdDocs: "Pièces d'identité",
    sectionOwner: "Propriétaire",
    sectionFines: "Amendes",
    sectionInfractions: "Infractions",
    sectionTracking: "Suivi",
    foreignBadge: "Étranger / transit",
    noDetails: "Aucun détail sur le véhicule",
    registered: "Immatriculé",
    insurance: "Assurance",
    inspection: "Contrôle technique",
    valid: "Valide",
    missing: "Manquant",
    borderCheckpoint: "Poste frontalier",
    borderEntry: "Entrée frontalière",
    transitDriver: "Chauffeur de transit",
    transitPhone: "Téléphone de transit",
    passportId: "Passeport / n° d'identité",
    notes: "Notes",
    finesTitle: "Totaux des amendes",
    paid: "Payé",
    pending: "En attente",
    unpaid: "Impayé",
    finesSummary:
      "{unpaid} infraction(s) impayée(s) sur {total} au total",
    infractionsTitle: "Infractions récentes",
    trackingTitle: "Suivi",
    trackingEmpty: "Aucun historique de suivi pour l'instant.",
  },
  tracking: {
    eventInfraction: "Infraction enregistrée",
    eventAgentCheckin: "Pointage agent",
    eventRegistration: "Véhicule immatriculé",
    eventVerification: "Mise à jour de vérification",
    eventNote: "Note",
  },
} as const;

export const driverInfractions = {
  title: "Infractions",
  description:
    "Consultation seule : les infractions sont déposées par les agents de terrain et administrateurs. Contactez le support si vous pensez qu'un enregistrement est incorrect.",
  searchPlaceholder: "Plaque, type, lieu…",
  emptyTitle: "Aucune infraction",
  emptyDescription:
    "Vous n'avez actuellement aucune infraction enregistrée.",
  summary: "{count} infraction(s)",
  summaryMatching: "{count} ligne(s) correspondante(s)",
  date: "Date",
  plate: "Plaque",
  type: "Type",
  location: "Lieu",
  amount: "Montant",
  status: "Statut",
  filterPaid: "Payé",
  filterUnpaid: "Impayé",
  filterPending: "En attente",
  emptyValue: "—",
} as const;

export const driverPayments = {
  title: "Paiements",
  description:
    "Payez vos amendes et suivez les paiements partiels jusqu'à règlement complet de chaque infraction.",
  stats: {
    totalDue: "Reste à payer",
    unpaid: "Impayé",
    pending: "En validation",
    paid: "Payé",
  },
  manualNotice:
    "Seuls les paiements manuels sont disponibles pour l'instant. Téléversez votre reçu pour chaque paiement ; un administrateur le validera avant que le montant ne soit appliqué à l'amende.",
  ledgerTitle: "Paiements des infractions",
  searchPlaceholder: "Plaque, type…",
  emptyTitle: "Rien à payer",
  emptyDescription: "Aucune infraction enregistrée.",
  summary: "{count} infraction(s)",
  date: "Date",
  plate: "Plaque",
  type: "Type",
  amount: "Montant",
  totalDue: "Total dû",
  paidSoFar: "Déjà payé",
  remaining: "Reste à payer",
  transactions: "Transactions",
  actions: "Actions",
  submitPayment: "Soumettre un paiement",
  awaitingReview: "En validation",
  noAction: "Réglé",
  filterPaid: "Payé",
  filterUnpaid: "Impayé",
  filterPending: "En attente",
  submitDialog: {
    title: "Soumettre un paiement manuel",
    description:
      "Téléversez une preuve de paiement pour {plate}. Solde restant : {remaining}.",
    amountLabel: "Montant payé",
    receiptLabel: "Reçu de paiement",
    receiptHint: "JPG, PNG, WEBP, HEIC ou PDF jusqu'à 10 Mo.",
    manualOnly:
      "Seuls les paiements manuels sont actifs pour l'instant. Mobile money et carte arrivent bientôt.",
    submit: "Soumettre pour validation",
  },
  methods: {
    manual: "Reçu manuel",
    mobile_money: "Mobile money",
    card: "Carte bancaire",
    bank_transfer: "Virement bancaire",
    comingSoon: "Bientôt disponible",
  },
} as const;

export const driverShared = {
  tables: {
    reset: "Réinitialiser",
    paginationPage:
      "Page {page} sur {totalPages} ({filteredCount}{ofTotal, select, other { sur {totalRows}} none {}} lignes)",
    paginationPrevious: "Précédent",
    paginationNext: "Suivant",
  },
} as const;

export const driverFr = {
  shell: driverShell,
  overview: driverOverview,
  profile: driverProfile,
  documents: driverDocuments,
  vehicles: driverVehicles,
  infractions: driverInfractions,
  payments: driverPayments,
  shared: driverShared,
} as const;

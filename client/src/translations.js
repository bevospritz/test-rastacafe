// import { useLang } from "../../LanguageContext";
// const { t } = useLang();
// {t("dashboard")}

const translations = {
  IT: {
    //Online/Offline
    offlineBanner:
      "Sei offline. I dati verranno salvati localmente e sincronizzati quando torni online.",
    savedOffline:
      "Dati salvati offline. Verranno sincronizzati quando torni online.",

    // Dashboard
    dashboard: "Dashboard",
    dashboardSubtitle: "Analisi produzione per appezzamento",

    // Navbar & Layout
    logout: "Disconnessione",
    profile: "Gestione del profilo",

    // Sidebar

    users: "Utenti",
    manageFarm: "Gestione Fattoria",
    traceability: "Tracciabilità",

    //Tracciabilità
    newLots: "Nuovi Lotti",
    noNewLots: "Nessun nuovo lotto",
    patios: "Terreni",
    noPatios: "Nessun terreno attivo",
    dryers: "Essiccatori",
    noDryers: "Nessun essiccatore attivo",
    fermentations: "Fermentazioni",
    noFermentations: "Nessuna fermentazione attiva",
    rests: "Tulha / Riposo",
    noRests: "Nessun lotto in riposo",
    noStocking: "Nessun lotto stoccato",
    type: "Tipo",
    lot: "Lotto",
    traceabilitySubtitle: "Panoramica dei lotti in lavorazione",

    // ManageLot
    manageLot: "Gestione Lotto",
    manageLotSubtitle: "Seleziona la fase di lavorazione",
    newLot: "Nuovo Lotto",
    washDivide: "Lavaggio e Separazione",
    drying: "Essiccazione",
    fermentation: "Fermentazione",
    resting: "Riposo",
    cleaning: "Pulizia",
    stocking: "Stoccaggio",
    selling: "Vendita",

    // Tipi lavorazione
    types: {
      Natural: "Naturale",
      Dry: "Boia",
      BigDry: "Boia Grande",
      CD: "CD",
      Green: "Verde",
      CDGreen: "Verde CD",
      WashedNatural: "Naturale Lavato",
    },

    // NewLot
    newLotTitle: "Nuovo Lotto",
    plot: "Talhão",
    volume: "Volume (L)",
    method: "Metodo",
    date: "Data",
    confirm: "Conferma",
    cancel: "Annulla",
    natural: "Naturale",
    vassoura: "Vassoura",
    mechanical: "Meccanica",
    manual: "Manuale",

    // Newlot alert
    lotCreated: "Lotto creato con successo!",
    invalidVolume: "Il volume deve essere un numero valido maggiore di zero.",
    confirmData: "Confermi i seguenti dati?",
    operationCancelled: "Operazione annullata.",

    // WashDevide
    washDivideTitle: "Wash & Divide",
    selectLots: "Seleziona Lotti",
    washing: "Lavaggio",
    matureGreen: "Maturo+Verde",
    dry: "Boia",
    stepDryMatureGreen: "Boia vs Maturo+Verde",
    stepPeneirao: "Peneirão",
    stepDespolpador: "Despolpador",
    stepSummary: "Riepilogo",
    noLotsAvailable: "Nessun lotto disponibile",
    selectDate: "Seleziona una data.",
    dateInFuture: "La data non può essere nel futuro",
    dateBeforeHarvest:
      "La data non può essere precedente alla data di raccolta più recente",
    minDateHint: "Data minima",
    assignPatio: "Assegna ogni lotto a un patio",
    naturalLot: "Lotto Naturale",
    selectPatio: "Seleziona",
    additionalProcessingCD: "Lavorazioni aggiuntive sul CD",
    noDespolpador: "Senza despolpador il Mature+Green sarà classificato come",
    totalVolume: "Volume totale",
    confirmSend: "Conferma",
    lotPending:
      "Questo lotto è stato creato offline e non può essere processato finché non viene sincronizzato.",

    // Fermentation
    fermentationTitle: "Fermentazione",
    startFermentation: "Inizia Fermentazione",
    endFermentation: "Finisci Fermentazione",
    startDate: "Data Inizio",
    endDate: "Data Fine",
    startTime: "Ora Inizio",
    endTime: "Ora Fine",
    fermentationType: "Tipo Fermentazione",
    barrel: "Botti",
    tank: "Tank",
    rotative: "Rotativa",
    bigBag: "Big Bag",
    lotsFermenting: "Lotti in fermentazione",
    fermentationStarted: "Fermentazione salvata con successo!",
    fermentationEnded: "Fermentazione chiusa con successo!",
    selectAtLeastOne: "Seleziona almeno un lotto.",

    // Drying
    dryingTitle: "Essiccazione",
    selectPatioLots: "Seleziona i lotti dal Patio",
    totalVolumeSelected: "Volume totale selezionato",
    timeIn: "Ora Entrata",
    dryerSaved: "Dryer salvato e lotti aggiornati con successo!",
    incompleteData: "Errore: dati incompleti, controlla i campi del form.",
    cdMixWarning:
      "Attenzione: stai aggiungendo un lotto CD a lotti di tipo diverso. Sei sicuro?",
    mixWarning:
      "Attenzione: stai aggiungendo un lotto non-CD a lotti CD. Tipo:",

    // Resting
    restingTitle: "Riposo in tulha",
    restSaved: "Rest salvato correttamente!",
    totalSelectedVolume: "Volume totale selezionato",
    time: "Ora",

    // Cleaning
    cleaningTitle: "Beneficio",
    selectTulha: "Seleziona Tulha",
    totalLiters: "Litri totali",
    volumeToClean: "Volume da beneficiare (L)",
    totalVolumeToClean: "Volume totale da beneficiare",
    cleaningData: "Dati del beneficio",
    noDepoForCleaning: "Nessuna tulha disponibile per il beneficio",
    cleanedWeight: "Peso pulito (kg)",
    bags: "N° Sacchi (60kg)",
    humidity: "Umidità (%)",
    defects: "Difetti / Cata (%)",
    destination: "Deposito di destinazione",
    noDeposit: "Nessun deposito (vendita diretta)",
    selected: "selezionata",
    cleaningRegistered: "Cleaning registrato con successo! Lotto: {{lot}}",

    // Stocking
    stockingTitle: "Stoccaggio",
    stockingSubtitle:
      "Visualizza e aggiorna i dettagli dei lotti puliti prima della vendita.",
    farmData: "Dati fattoria",
    depositData: "Dati deposito",
    weight: "Peso",
    peneira: "Peneira 17 (%)",
    bebida: "Bebida",
    deposit: "Deposito",
    directSale: "Vendita diretta",
    edit: "Modifica",
    save: "Salva",

    // Selling
    sellingTitle: "Vendita",
    sellingSubtitle:
      "Seleziona un lotto per visualizzare i dettagli o avviare una vendita.",
    details: "Dettagli",
    sell: "Vendi",
    loss: "Perdita",
    buyer: "Acquirente",
    pricePerBag: "Prezzo per sacco",
    certification: "Certificazione",
    noCertification: "Nessuna",
    notes: "Note",
    confirmSale: "Conferma Vendita",
    availableBags: "Disponibili",
    bagsToSell: "N° Sacchi da vendere",
    summary: "Riepilogo",
    total: "Totale",
    registerLoss: "Registra Perdita",
    bagsLost: "Sacchi persi",
    residueAvailable: "Residuo disponibile",
    remainingBags: "Sacchi restanti",
    remainingWeight: "Peso restante",
    quantity: "Quantità",
    saleData: "Dati vendita",
    certBonus: "Bonus {{cert}} per sacco ({{currency}})",
    notesPlaceholder: "Es. Solo peneira > 15",
    bagsTimesPrice: "{{bags}} sacchi × {{price}} {{currency}}",
    certBonusRow: "Bonus {{cert}} ({{bags}} × {{bonus}})",
    residualBags: "Sacchi residui disponibili",
    lossNotes: "Es. Sacco danneggiato durante il trasporto",

    // Sellin alerts
    lotDataNotComplited: "I dati del lotto non sono completi.",
    fillBeforeSelling: "Compila tutti i campi prima di vendere.",
    selectBuyer: "Seleziona un acquirente valido.",
    invalidBagsToSell: "Inserisci un numero valido di sacchi da vendere.",
    insufficientBags:
      "Sacchi insufficienti: disponibili {{available}}, inseriti {{bags}}.",
    saleRegistered:
      "Vendita registrata!\nLotto: {{lot}}\nTotale: {{currency}} {{total}}",
    savingError: "Errore durante il salvataggio.",
    loseMoreThanAvailable:
      "Non puoi registrare una perdita maggiore dei sacchi disponibili {{available}}.",
    lossRegistered:
      "Perdita registrata!\nLotto: {{lossLot.cleaning_nLot}}\nSacchi persi: {{bagsLost}}",

    // Status
    available: "Disponibile",
    partial: "Parziale",
    sold: "Venduto",

    // Gestione Fattoria
    manageFarmTitle: "Gestione Fattoria",
    nFarmlands: "N° appezzamenti",
    totalSurface: "Superficie totale (ha)",
    avgAge: "Età media piante",
    years: "anni",
    structure: "Struttura",
    farmlands: "Appezzamenti",
    noFarms: "Nessuna farm configurata.",
    addFarm: "+ Aggiungi Fazenda",
    newFarm: "Nuova Farm",
    editFarm: "Modifica Farm",
    farmName: "Nome Farm",

    // Gestione Appezzamenti
    plotsTitle: "Gestione Appezzamenti",
    filterByName: "Filtra per nome...",
    addPlotTitle: "Aggiungi Talhão",
    addPlot: "+ Aggiungi Talhão",
    noPlots: "Nessun appezzamento trovato",
    code: "Codice",
    surface: "Superficie (ha)",
    variety: "Varietà",
    nPlants: "N° piante",
    distance: "Distanza (cm)",
    plantingYear: "Anno",
    plantPhase: "Stato della pianta",
    irrigation: "Irrigazione",
    yield: "Resa stimata",
    yes: "Sì",
    no: "No",
    harvest: "Raccolta",
    prune: "Potatura",
    forming: "Formazione",

    //Caricamento appezzamenti da file
    addFarmFirst: "Seleziona prima una fattoria.",
    loading: "Caricamento in corso...",
    dropFile: "Rilascia qui il file Excel.",
    clickToBrowse: "Trascina un file Excel o clicca per selezionarlo",

    // Gestione Utenti
    usersTitle: "Gestione Utenti",
    newUser: "Nuovo Utente",
    email: "Email",
    role: "Ruolo",
    delete: "Elimina",
    createUser: "Crea Utente",
    creating: "Creazione...",
    noUsers: "Nessun utente trovato.",
    actions: "Azioni",

    //Gestione Struttura
    manageStructureTitle: "Gestione Struttura",
    addElement: "+ Aggiungi Elemento",
    noElement: "Nessun elemento configurato",
    select: "Seleziona",
    patio: "Terreno",
    dryer: "Essicatore",
    tulha: "Tulha",
    centrifuga: "Centrifuga",
    name: "Nome",
    editElement: "Modifica Elemento",

    // LotHistory
    lotHistoryTitle: "Storia Lotto",
    lotHistory: "Storia Lotto",

    // Common
    noData: "Nessun dato disponibile.",
    saving: "Salvataggio...",
    success: "Successo",
    error: "Errore",
    back: "Indietro",
    next: "Avanti",
    add: "Aggiungi",
    manage: "Gestisci",
    element: "Elemento",
  },

  PT: {
    //Online/Offline
    offlineBanner:
      "Você está offline. Os dados serão salvos localmente e sincronizados quando voltar online.",
    savedOffline:
      "Dados salvos offline. Serão sincronizados quando voltar online.",

    // Dashboard
    dashboard: "Dashboard",
    dashboardSubtitle: "Análise produção por talhão",

    // Navbar & Layout
    logout: "Sair",
    profile: "Gerenciar perfil",

    // Sidebar

    users: "Usuários",
    manageFarm: "Gestão da Fazenda",
    traceability: "Rastreabilidade",

    //Tracciabilità
    newLots: "Novos Lotes",
    noNewLots: "Nenhum novo lote",
    patios: "Terreiros",
    noPatios: "Nenhum terreiro ativo",
    dryers: "Secadores",
    noDryers: "Nenhum Secador ativo",
    fermentations: "Fermentações",
    noFermentations: "Nenhuma fermentação ativa",
    rests: "Tulha",
    noRests: "Nenhum lote na tulha",
    noStocking: "Nenhum lote armazenado",
    type: "Tipo",
    lot: "Lote",
    traceabilitySubtitle: "Visão geral dos lotes em processamento",

    // ManageLot
    manageLot: "Gestão de Lote",
    manageLotSubtitle: "Selecione a fase de processamento",
    newLot: "Novo Lote",
    washDivide: "Lavagem & Separação",
    drying: "Secagem",
    fermentation: "Fermentação",
    resting: "Descanso",
    cleaning: "Beneficiamento",
    stocking: "Armazenagem",
    selling: "Venda",

    // Tipi lavorazione — ATTENZIONE alle eccezioni
    types: {
      Natural: "Natural",
      Dry: "Boia", // non si traduce
      BigDry: "Boia Grande", // non si traduce
      CD: "CD", // non si traduce
      Green: "Verde",
      CDGreen: "Verde CD",
      WashedNatural: "Natural Lavado",
    },

    // NewLot
    newLotTitle: "Novo Lote",
    plot: "Talhão",
    volume: "Volume (L)",
    method: "Método",
    date: "Data",
    confirm: "Confirmar",
    cancel: "Cancelar",
    natural: "Natural",
    vassoura: "Vassoura",
    mechanical: "Mecânica",
    manual: "Manual",

    // Newlot alert
    lotCreated: "Lote criado com sucesso!",
    invalidVolume: "O volume deve ser um número válido maior que zero.",
    confirmData: "Confirma os seguintes dados?",
    operationCancelled: "Operação cancelada.",

    // WashDevide
    washDivideTitle: "Lavagem & Separação",
    selectLots: "Selecionar Lotes",
    washing: "Lavagem",
    matureGreen: "Maduro+Verde",
    dry: "Boia",
    stepDryMatureGreen: "Boia vs Maduro+Verde",
    stepPeneirao: "Peneirão",
    stepDespolpador: "Despolpador",
    stepSummary: "Resumo",
    noLotsAvailable: "Nenhum lote disponível",
    selectDate: "Selecione uma data.",
    dateInFuture: "A data não pode ser no futuro",
    dateBeforeHarvest: "A data não pode ser anterior à colheita mais recente",
    minDateHint: "Data mínima",
    assignPatio: "Atribua cada lote a um pátio",
    naturalLot: "Lote Natural",
    selectPatio: "Selecionar",
    additionalProcessingCD: "Processamentos adicionais no CD",
    noDespolpador: "Sem despolpador o Maduro+Verde será classificado como",
    totalVolume: "Volume total",
    confirmSend: "Confirmar",
    lotPending:
      "Este lote foi criado offline e não pode ser processado até ser sincronizado.",

    // Fermentation
    fermentationTitle: "Fermentação",
    startFermentation: "Iniciar Fermentação",
    endFermentation: "Finalizar Fermentação",
    startDate: "Data de Início",
    endDate: "Data de Término",
    startTime: "Hora de Início",
    endTime: "Hora de Término",
    fermentationType: "Tipo de Fermentação",
    barrel: "Barris",
    tank: "Tanques",
    rotative: "Rotativo",
    bigBag: "Big Bag",
    lotsFermenting: "Lotes em fermentação",
    fermentationStarted: "Fermentação salva com sucesso!",
    fermentationEnded: "Fermentação encerrada com sucesso!",
    selectAtLeastOne: "Selecione pelo menos um lote.",

    // Drying
    dryingTitle: "Secagem",
    selectPatioLots: "Selecione os lotes do Terreiro",
    totalVolumeSelected: "Volume total selecionado",
    timeIn: "Hora de Entrada",
    dryerSaved: "Secador salvo e lotes atualizados com sucesso!",
    incompleteData: "Erro: dados incompletos, verifique os campos.",
    cdMixWarning:
      "Atenção: você está adicionando um lote CD a lotes de tipo diferente. Tem certeza?",
    mixWarning:
      "Atenção: você está adicionando um lote não-CD a lotes CD. Tipo:",

    // Resting
    restingTitle: "Tulha",
    restSaved: "Descanso salvo corretamente!",
    totalSelectedVolume: "Volume total selecionado",
    time: "Hora",

    // Cleaning
    cleaningTitle: "Beneficiamento",
    selectTulha: "Selecione Tulha",
    totalLiters: "Litros totais",
    volumeToClean: "Volume a beneficiar (L)",
    totalVolumeToClean: "Volume total a beneficiar",
    cleaningData: "Dados do beneficiamento",
    noDepoForCleaning: "Nenhuma tulha disponivel para o beneficio",
    cleanedWeight: "Peso beneficiado (kg)",
    bags: "N° Sacas (60kg)",
    humidity: "Umidade (%)",
    defects: "Defeitos / Cata (%)",
    destination: "Depósito de destino",
    noDeposit: "Sem depósito (venda direta)",
    selected: "selecionada",
    cleaningRegistered: "Beneficiamento registrado com sucesso! Lote: {{lot}}",

    // Stocking
    stockingTitle: "Estocagem",
    stockingSubtitle:
      "Visualize e atualize os detalhes dos lotes beneficiados antes da venda.",
    farmData: "Dados da fazenda",
    depositData: "Dados do depósito",
    weight: "Peso",
    peneira: "Peneira 17 (%)",
    bebida: "Bebida",
    deposit: "Depósito",
    directSale: "Venda direta",
    edit: "Editar",
    save: "Salvar",
    depositWeight: "Peso no depósito",
    depositHumidity: "Umidade no depósito (%)",
    depositCata: "Cata no depósito (%)",
    depositPeneira: "Peneira no depósito (%)",

    // Selling
    sellingTitle: "Venda",
    sellingSubtitle:
      "Selecione um lote para ver os detalhes ou iniciar uma venda.",
    details: "Detalhes",
    sell: "Vender",
    loss: "Perda",
    buyer: "Comprador",
    pricePerBag: "Preço por saca",
    certification: "Certificação",
    noCertification: "Nenhuma",
    notes: "Observações",
    confirmSale: "Confirmar Venda",
    availableBags: "Disponíveis",
    bagsToSell: "N° Sacas a vender",
    summary: "Resumo",
    total: "Total",
    registerLoss: "Registrar Perda",
    bagsLost: "Sacas perdidas",
    residueAvailable: "Resíduo disponível",
    remainingBags: "Sacas restantes",
    remainingWeight: "Peso restante",
    quantity: "Quantidade",
    saleData: "Dados da venda",
    certBonus: "Bônus {{cert}} por saca ({{currency}})",
    notesPlaceholder: "Ex. Apenas peneira > 15",
    bagsTimesPrice: "{{bags}} sacas × {{price}} {{currency}}",
    certBonusRow: "Bônus {{cert}} ({{bags}} × {{bonus}})",
    residualBags: "Sacas residuais disponíveis",
    lossNotes: "Ex. Saco danificado durante o transporte",

    // Sellin alerts
    lotDataNotComplited: "Os dados do lote não estão completos.",
    fillBeforeSelling: "Compila todos os campos antes de vender.",
    selectBuyer: "Selecione um comprador válido.",
    invalidBagsToSell: "Insira um número válido de sacas para vender.",
    insufficientBags:
      "Sacas insuficientes: disponíveis {{available}}, inseridas {{bags}}.",
    saleRegistered:
      "Venda registrada!\nLote: {{lot}}\nTotal: {{currency}} {{total}}",
    savingError: "Erro ao salvar.",
    loseMoreThanAvailable:
      "Você não pode registrar uma perda maior que as sacas disponíveis {{available}}.",
    lossRegistered:
      "Perda registrada!\nLote: {{lossLot.cleaning_nLot}}\nSacas perdidas: {{bagsLost}}",

    // Status
    available: "Disponível",
    partial: "Parcial",
    sold: "Vendido",

    // Gestione Fattoria
    manageFarmTitle: "Gestão da Fazenda",
    nFarmlands: "N° de talhões",
    totalSurface: "Área total (ha)",
    avgAge: "Idade média das plantas",
    years: "anos",
    structure: "Estrutura",
    farmlands: "Talhões",
    noFarms: "Nenhuma fazenda configurada.",
    addFarm: "+ Adicionar Fazenda",
    newFarm: "Nova Fazenda",
    editFarm: "Editar Fazenda",
    farmName: "Nome da Fazenda",

    // Gestione Appezzamenti
    plotsTitle: "Gestão de Talhões",
    filterByName: "Filtrar por nome...",
    addPlotTitle: "Adicionar Talhão",
    addPlot: "+ Adicionar Talhão",
    noPlots: "Nenhum talhão encontrado",
    code: "Codice",
    surface: "Superfície (ha)",
    variety: "Variedade",
    nPlants: "N° covas",
    distance: "Distância (cm)",
    plantingYear: "Ano",
    plantPhase: "Estágio da planta",
    irrigation: "Irrigação",
    yield: "Rendimento estimado",
    yes: "Sim",
    no: "Não",
    harvest: "Colheita",
    prune: "Poda",
    forming: "Formação",

    //Caricamento appezzamenti da file
    addFarmFirst: "Selecione uma fazenda primeiro.",
    loading: "Carregando...",
    dropFile: "Solte o arquivo Excel aqui.",
    clickToBrowse: "Arraste um arquivo Excel ou clique para selecioná-lo",

    // Gestione Utenti
    usersTitle: "Gestão de Usuários",
    newUser: "Novo Usuário",
    email: "E-mail",
    role: "Função",
    delete: "Excluir",
    createUser: "Criar Usuário",
    creating: "Criando...",
    noUsers: "Nenhum usuário encontrado",
    actions: "Ações",

    //Gestione Struttura
    manageStructureTitle: "Gestão de Estrutura",
    addElement: "+ Adicionar Elemento",
    noElement: "Nenhum elemento configurado",
    select: "Selecione",
    patio: "Terreiro",
    dryer: "Secador",
    tulha: "Tulha",
    centrifuga: "Centrifuga",
    name: "Nome",
    editElement: "Editar Elemento",

    // LotHistory
    lotHistoryTitle: "Histórico do Lote",
    lotHistory: "Histórico do Lote",

    // Common
    noData: "Nenhum dado disponível.",
    saving: "Salvando...",
    success: "Sucesso",
    error: "Erro",
    back: "Voltar",
    next: "Próximo",
    add: "Adicionar",
    manage: "Gerenciar",
    element: "Elemento",
  },
};

export default translations;

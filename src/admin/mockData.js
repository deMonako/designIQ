export const TODAY = "2026-03-02";

export function isOverdue(dueDate, status) {
  if (status === "Zrobione" || status === "Ukończony") return false;
  return dueDate < TODAY;
}


export const mockProjects = [
  {
    id: "proj-1",
    name: "Dom Kowalski – Kraków",
    client: { name: "Jan Kowalski", email: "j.kowalski@gmail.com", phone: "+48 601 234 567" },
    package: "Full house",
    status: "W trakcie",
    stageIndex: 3,
    stages: ["Wycena", "Projekt automatyki", "Projekt szafy", "Prefabrykacja", "Montaż", "Uruchomienie", "Szkolenie", "Odbiór"],
    progress: 58,
    startDate: "2026-02-01",
    deadline: "2026-04-30",
    budget: 85000,
    address: "ul. Różana 12, Kraków",
    notes: "Klient wymaga cotygodniowych raportów postępu.",
    tags: ["priorytet", "full house"],
  },
  {
    id: "proj-2",
    name: "Apartament Nowak – Warszawa",
    client: { name: "Anna Nowak", email: "a.nowak@gmail.com", phone: "+48 602 345 678" },
    package: "Smart design+",
    status: "Wstrzymany",
    stageIndex: 1,
    stages: ["Wycena", "Projekt automatyki", "Projekt szafy", "Prefabrykacja", "Uruchomienie"],
    progress: 20,
    startDate: "2026-01-15",
    deadline: "2026-05-31",
    budget: 45000,
    address: "ul. Marszałkowska 7/4, Warszawa",
    notes: "Wstrzymany – klient oczekuje na decyzję architekta.",
    tags: [],
  },
  {
    id: "proj-3",
    name: "Dom Wiśniewski – Wrocław",
    client: { name: "Piotr Wiśniewski", email: "p.wisniewski@gmail.com", phone: "+48 603 456 789" },
    package: "Smart design",
    status: "W trakcie",
    stageIndex: 2,
    stages: ["Wycena", "Projekt automatyki", "Projekt szafy", "Odbiór"],
    progress: 45,
    startDate: "2026-02-10",
    deadline: "2026-03-31",
    budget: 22000,
    address: "ul. Lipowa 5, Wrocław",
    notes: "",
    tags: [],
  },
  {
    id: "proj-4",
    name: "Biuro Malinowski – Gdańsk",
    client: { name: "Tomasz Malinowski", email: "t.malinowski@gmail.com", phone: "+48 604 567 890" },
    package: "Full house",
    status: "W trakcie",
    stageIndex: 4,
    stages: ["Wycena", "Projekt", "Prefabrykacja", "Montaż", "Uruchomienie", "Odbiór"],
    progress: 60,
    startDate: "2025-12-01",
    deadline: "2026-03-01",
    budget: 120000,
    address: "ul. Długa 1, Gdańsk",
    notes: "Projekt komercyjny – biuro 5 kondygnacji.",
    tags: ["komercyjny", "priorytet"],
  },
  {
    id: "proj-5",
    name: "Dom Zieliński – Poznań",
    client: { name: "Marek Zieliński", email: "m.zielinski@gmail.com", phone: "+48 605 678 901" },
    package: "Smart design+",
    status: "Ukończony",
    stageIndex: 4,
    stages: ["Wycena", "Projekt", "Szafa", "Montaż", "Uruchomienie"],
    progress: 100,
    startDate: "2025-10-01",
    deadline: "2026-01-31",
    budget: 38000,
    address: "ul. Kwiatowa 22, Poznań",
    notes: "Projekt zakończony. Klient bardzo zadowolony.",
    tags: [],
  },
];

export const mockTasks = [
  { id: "t1", projectId: "proj-1", title: "Schemat szafy sterowniczej – v2", assignee: "Adam", status: "Niezrobione", priority: "Wysoki", dueDate: "2026-03-05", description: "Przygotować schemat elektryczny szafy sterowniczej." },
  { id: "t2", projectId: "proj-1", title: "Zamówienie kabli – lista BOM", assignee: "Adam", status: "Niezrobione", priority: "Normalny", dueDate: "2026-03-10", description: "Przygotować listę materiałową i złożyć zamówienie." },
  { id: "t3", projectId: "proj-3", title: "Projekt automatyki – dom Wiśniewski", assignee: "Adam", status: "Zrobione", priority: "Normalny", dueDate: "2026-02-28", description: "Projekt gotowy, przesłany do klienta." },
  { id: "t4", projectId: "proj-4", title: "Wycena dodatkowych modułów I/O", assignee: "Adam", status: "Niezrobione", priority: "Wysoki", dueDate: "2026-03-02", description: "Klient zapytał o 4 dodatkowe moduły wejść/wyjść." },
  { id: "t5", projectId: "proj-2", title: "Kontakt z architektem – Nowak", assignee: "Adam", status: "Niezrobione", priority: "Niski", dueDate: "2026-03-15", description: "Uzgodnić zmiany w projekcie po decyzji architekta." },
  { id: "t6", projectId: "proj-4", title: "Programowanie sterownika Loxone", assignee: "Adam", status: "Niezrobione", priority: "Krytyczny", dueDate: "2026-03-01", description: "Zakończenie programowania logiki sterowania biura." },
  { id: "t7", projectId: "proj-1", title: "Integracja alarmu Satel z Loxone", assignee: "Adam", status: "Niezrobione", priority: "Wysoki", dueDate: "2026-03-20", description: "Integracja systemu alarmowego Satel z miniServerem." },
  { id: "t8", projectId: "proj-3", title: "Aktualizacja oferty – Wiśniewski", assignee: "Adam", status: "Niezrobione", priority: "Normalny", dueDate: "2026-03-08", description: "Zaktualizować ofertę o dodatkowe gniazdka." },
  { id: "t9", projectId: null, title: "Przygotować szkolenie KNX", assignee: "Adam", status: "Niezrobione", priority: "Normalny", dueDate: "2026-03-10", description: "Szkolenie z obsługi ETS i topologii KNX." },
  { id: "t10", projectId: null, title: "Aktualizacja szablonów dokumentów", assignee: "Adam", status: "Niezrobione", priority: "Niski", dueDate: "2026-03-20", description: "Zaktualizować szablony Excel i Word do nowego brandu." },
];

export const mockChecklists = [
  {
    id: "ch1",
    projectId: "proj-1",
    title: "Odbiór projektu automatyki",
    type: "etapowa",
    stage: "Etap 2",
    items: [
      { id: "chi1", text: "Weryfikacja listy punktów pomiarowych", done: true },
      { id: "chi2", text: "Sprawdzenie topologii sieci", done: true },
      { id: "chi3", text: "Weryfikacja programu Loxone Config", done: false },
      { id: "chi4", text: "Akceptacja klienta", done: false },
    ],
  },
  {
    id: "ch2",
    projectId: "proj-1",
    title: "Kontrola jakości szafy sterowniczej",
    type: "etapowa",
    stage: "Etap 3",
    items: [
      { id: "chi5", text: "Weryfikacja okablowania wewnętrznego", done: false },
      { id: "chi6", text: "Pomiar rezystancji izolacji", done: false },
      { id: "chi7", text: "Test zasilania UPS", done: false },
      { id: "chi8", text: "Oznaczenie kabli wg schematu", done: false },
      { id: "chi9", text: "Zdjęcia dokumentacyjne", done: false },
    ],
  },
  {
    id: "ch3",
    projectId: "proj-3",
    title: "Odbiór projektu – dom Wiśniewski",
    type: "projektowa",
    stage: "Finał",
    items: [
      { id: "chi10", text: "Projekt automatyki przekazany", done: true },
      { id: "chi11", text: "Projekt szafy przekazany", done: true },
      { id: "chi12", text: "Protokół odbioru podpisany", done: false },
      { id: "chi13", text: "Faktura wystawiona", done: false },
    ],
  },
  {
    id: "ch-g1",
    projectId: null,
    title: "Standardowa checklista uruchomienia Loxone",
    type: "globalna",
    stage: null,
    items: [
      { id: "chg1", text: "Firmware miniServera aktualny", done: false },
      { id: "chg2", text: "Konfiguracja sieci LAN / VLAN", done: false },
      { id: "chg3", text: "Test wszystkich wejść/wyjść", done: false },
      { id: "chg4", text: "Konfiguracja Loxone App na telefonie klienta", done: false },
      { id: "chg5", text: "Backup konfiguracji na Google Drive", done: false },
    ],
  },
  {
    id: "ch-g2",
    projectId: null,
    title: "Checklista przed oddaniem projektu elektrycznego",
    type: "globalna",
    stage: null,
    items: [
      { id: "chg6", text: "Schemat elektryczny zaktualizowany", done: false },
      { id: "chg7", text: "Lista BOM zgodna z projektem", done: false },
      { id: "chg8", text: "Certyfikaty urządzeń zebrane", done: false },
      { id: "chg9", text: "Dokumentacja archiwizowana na Drive", done: false },
    ],
  },
];

export const mockMaterials = [
  { id: "mat-1", title: "Dokumentacja Loxone Config 14", category: "Dokumentacje", description: "Oficjalna dokumentacja oprogramowania Loxone Config v14 – wszystkie bloki funkcyjne", url: "https://www.loxone.com/pol/kb/", date: "2026-01-10" },
  { id: "mat-2", title: "Skrypt konfiguracji interfejsu KNX", category: "Skrypty", description: "Bash script do automatycznej konfiguracji interfejsu IP/USB KNX na Raspberry Pi", url: "#", date: "2026-01-20" },
  { id: "mat-3", title: "Instrukcja Satel INTEGRA 128-WRL", category: "Instrukcje", description: "Instrukcja programowania i obsługi centrali alarmowej Satel INTEGRA 128", url: "#", date: "2026-02-01" },
  { id: "mat-4", title: "Kalkulator długości kabli (Excel)", category: "Skrypty", description: "Arkusz Excel do obliczania długości kabli na podstawie rzutu budynku", url: "#", date: "2026-02-15" },
  { id: "mat-5", title: "Szablon schematu szafy sterowniczej", category: "Dokumentacje", description: "Szablon schematu elektrycznego szafy sterowniczej – AutoCAD .dwg", url: "#", date: "2026-02-20" },
  { id: "mat-6", title: "Loxone HTTP API Reference", category: "Linki", description: "API do komunikacji z miniServerem przez HTTP/REST – odczyt i sterowanie punktami", url: "https://www.loxone.com/enen/kb/api/", date: "2026-03-01" },
];

export const mockProjectDocs = [
  { id: "pd-1", projectId: "proj-1", name: "Projekt automatyki v1.2.pdf", type: "pdf", description: "Projekt automatyki instalacji elektrycznej – rewizja 1.2", url: "#", date: "2026-02-10", clientVisible: true },
  { id: "pd-2", projectId: "proj-1", name: "Lista BOM – szafa sterownicza.xlsx", type: "xlsx", description: "Lista materiałów do szafy sterowniczej", url: "#", date: "2026-02-15", clientVisible: false },
  { id: "pd-3", projectId: "proj-1", name: "Schemat szafy v2.pdf", type: "pdf", description: "Schemat elektryczny szafy – rewizja 2", url: "#", date: "2026-02-20", clientVisible: false },
  { id: "pd-4", projectId: "proj-3", name: "Projekt automatyki Wiśniewski.pdf", type: "pdf", description: "Projekt automatyki – dom Wiśniewski, Wrocław", url: "#", date: "2026-02-28", clientVisible: true },
];

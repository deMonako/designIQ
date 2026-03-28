# CLAUDE.md — Kontekst projektu designIQ

## Czym jest ten projekt

Strona firmowa + panel admina dla **designIQ** — firmy zajmującej się instalacjami Smart Home (głównie Loxone). Aplikacja Create React App (TypeScript NIE jest używany — czysty JSX).

## Technologie

- **Frontend:** React (CRA), Tailwind CSS, Framer Motion, Lucide Icons
- **Backend:** Google Apps Script (GAS) — jeden plik `GAS_Code.gs` obsługuje wszystko przez HTTP
- **Baza danych:** Google Sheets (przez GAS)
- **Pliki:** Google Drive (przez GAS)
- **Mailing:** `GmailApp.sendEmail()` w GAS

---

## Struktura katalogów

```
src/
├── pages/              # Strony publiczne (React Router)
│   ├── Home.jsx
│   ├── Konfigurator.jsx        # 4-krokowy kreator Smart Home
│   ├── Instalator.jsx          # Demo Loxone + przycisk "irytacja"
│   ├── Kontakt.jsx
│   ├── StatusInwestycji.jsx    # Panel klienta (śledzenie inwestycji)
│   └── ...
├── components/
│   ├── forms/
│   │   ├── ConfiguratorContactForm.jsx  # Formularz po konfiguratorze
│   │   └── ContactForm.jsx             # Ogólny formularz kontaktowy
│   ├── configurator/
│   │   └── RoomLayoutBuilder.jsx
│   ├── investment/             # Komponenty panelu klienta
│   ├── quotation/
│   └── ui/                     # Button, Input, Label, Card, itp.
├── admin/
│   ├── views/                  # Widoki panelu admina
│   │   ├── Kalkulator.jsx      # Kalkulator instalacji + ControlDevicePicker
│   │   ├── Klienci.jsx
│   │   ├── Projekty.jsx
│   │   ├── Zadania.jsx
│   │   ├── Wyceny.jsx / WycenaEditor.jsx
│   │   ├── Zakupy.jsx / ZakupyEditor.jsx
│   │   ├── Materialy.jsx
│   │   └── ...
│   └── api/
│       ├── gasConfig.js        # URL głównego GAS + konfiguracja
│       ├── gasClient.js        # gasGet() / gasPost() — niski poziom HTTP
│       ├── gasApi.js           # Funkcje domenowe (getClients, createTask, …)
│       └── index.js
├── hooks/
│   └── useGasSubmit.js         # Hook do wysyłania formularzy do GAS (POST, retry x3)
└── logger.js
```

---

## Konfiguracja GAS — WAŻNE endpointy

Plik: `src/admin/api/gasConfig.js`

```js
GAS_CONFIG.scriptUrl = "https://script.google.com/macros/s/AKfycbxRLFP0ebHQFCbut-tkUY0JyRvllN40aj1gwt9hezj_0BI3UFc8GBAEsXtTv528qSQzoQ/exec"
// → główny admin GAS: CRUD klienci/projekty/zadania, upload, SVG, wyceny, zakupy
```

Plik: `.env` (nie commitowany do repo, ale istnieje lokalnie)

```env
REACT_APP_GAS_CONTACT_URL=https://script.google.com/macros/s/AKfycbwl3IlqxAbzxkipu28oMHOnVxs4HUJT_PJm7i8SogMDOeBVNc7gvR0Jzph9kp1TXipZ/exec
# → używany przez ContactForm i ConfiguratorContactForm do wysyłki maili

REACT_APP_GAS_STATUS_URL=https://script.google.com/macros/s/AKfycbzaygYUtnj50uxOWsMCqIH0EvjlheXka59q96r6fvikZ4ESVZvOtyDwvzCjrg5x7QZbmw/exec
# → panel klienta: StatusInwestycji, FileUploadSection, ClientWycenaView

REACT_APP_GAS_LOXONE_URL=https://script.google.com/macros/s/AKfycbwfV7DnjYtwfzqlguc9QRFIZzg3VQW9g7Zn_H8M_qibUZAzoinJ6-9Ds9MYm23JzsPR/exec?action=zirytujMnie&key=zirytuj_mnie
# → przycisk irytacji na stronie Instalator.jsx (wymagany action= i key=!)

REACT_APP_GA_ID=G-XXXXXXXXXX
```

### Google Sheets
- **Sheet ID:** `1aq3kmpw5mOGcy7JHB29C0s6OiR3evdEWY1gS08EE2FU`
- **Drive Root Folder ID:** `1tSaZwW144N9qiPyLPffd_mgj0f9jZtT6` (zawiera `Materiały/` i `Projekty/`)
- **Projects Folder ID:** `1bt-r9FQDR7rU3NrUPrLXzJ99lbfDaWuQ` (`Projekty/` — podfoldery z kodami projektów)
- **SVG Folder ID:** `1a0l_Az9JTxyHWo1Go2EO--RIxHfR7THO`

### Zakładki w Sheets
`Klienci`, `Projekty`, `Zadania`, `Checklists`, `Materiały`, `Dokumenty`, `Leady`, `Wiadomosci`, `Kontakty`, `Wkurwienia` (log irytacji), `Wyceny`, `Zakupy`

---

## Komunikacja z GAS

### GET (zapytania/odczyt)
```js
import { gasGet } from './admin/api/gasClient';
const result = await gasGet('getClients');  // { ok: true, data: [...] }
```

### POST (mutacje)
```js
import { gasPost } from './admin/api/gasClient';
const result = await gasPost('createClient', { client: { ... } });
```

### Formularze publiczne (z retry x3 i timeout 15s)
```js
const { isSubmitting, errorMessage, submit } = useGasSubmit(process.env.REACT_APP_GAS_CONTACT_URL);
await submit(payload, { onSuccess: () => {}, onError: (msg) => {} });
```

**Ważne:** POST jest wysyłany jako `text/plain` (bez `Content-Type`) — celowo, żeby ominąć CORS preflight. GAS czyta `e.postData.contents`.

---

## Architektura GAS (GAS_Code.gs)

- `doGet(e)` — switch na `e.parameter.action` → odczyty
- `doPost(e)` — switch na `body.action` → mutacje
- Każda akcja zwraca `ok({ ... })` lub `err("...")` → `ContentService` JSON
- Email: `GmailApp.sendEmail()` (NIE `MailApp`) — admin: `obsługa.designiq@gmail.com`

### Kluczowe akcje GAS
| Akcja | Metoda | Opis |
|-------|--------|------|
| `getClients` | GET | Lista klientów |
| `getProjects` | GET | Lista projektów |
| `getTasks` | GET | Lista zadań |
| `getMaterials` | GET | Katalog materiałów |
| `getShoppingLists` | GET | Listy zakupów |
| `getWyceny` | GET | Wyceny |
| `getInvestment` | GET | Status inwestycji klienta |
| `zirytujMnie` | GET | Trigger Loxone buczek (`key=zirytuj_mnie` wymagany!) |
| `createClient` | POST | Nowy klient |
| `createProject` | POST | Nowy projekt (+ folder Drive) |
| `createTask` | POST | Nowe zadanie |
| `submitForm` | POST | Formularz konfiguratora → Leady + maile |
| `sendContactForm` | POST | Formularz kontaktowy → Kontakty + maile |
| `uploadFile` | POST | Upload do Drive |
| `getSvgData` | GET | SVG/JSON rzutów po `code` projektu |

---

## Funkcje domenowe (gasApi.js)

```js
// Klienci
getClients(), createClient(client), updateClient(client), setClientArchived(id, bool)

// Projekty
getProjects(), createProject(project), updateProject(project)

// Zadania
getTasks(), createTask(task), updateTask(task), deleteTask(id)

// Materiały
getMaterials(), createMaterial(mat), updateMaterial(mat), deleteMaterial(id)

// Wyceny
getWyceny(), createWycena(w), updateWycena(w)

// Zakupy
getShoppingLists(), createShoppingList(list), updateShoppingList(list)

// Lead (panel klienta)
createLead(lead)
```

---

## Kluczowe komponenty

### Kalkulator.jsx (admin)
- Kalkulator instalacji z tabelą punktów instalacyjnych
- `ControlDevicePicker` — picker z wyszukiwaniem urządzeń Loxone i materiałów (min. 3 znaki)
- `EditableCell` — edycja inline w tabeli
- **Uwaga:** `p.name` i `m.name` mogą być `null` — używaj `(p.name ?? "").toLowerCase()`

### Konfigurator.jsx (publiczny)
- 4-krokowy kreator: metraż → pakiet → opcje → kontakt
- Krok 4: `ConfiguratorContactForm` → `useGasSubmit(REACT_APP_GAS_CONTACT_URL)`
- Wysyła payload: `{ action: 'submitForm', name, email, phone, quoteValue, configData }`

### Instalator.jsx (publiczny)
- Demo Loxone + przycisk "irytacja" (aktivuje buczek w biurze)
- `fetch(GAS_URL)` gdzie URL to `REACT_APP_GAS_LOXONE_URL` z `.env`
- **Wymaga:** `?action=zirytujMnie&key=zirytuj_mnie` w URL
- Throttle: 1 wywołanie/sekundę

### StatusInwestycji.jsx (panel klienta)
- Używa `REACT_APP_GAS_STATUS_URL`
- Klient loguje się przez link z kodem projektu

---

## Naprawione błędy (sesja 2026-03-15)

1. **Irytacja "Failed to fetch"** — brakował parametr `?action=zirytujMnie` w `.env` + brak `.catch()` w Instalator.jsx
2. **Konfigurator nie wysyłał maili** — formularze używały admin GAS zamiast `REACT_APP_GAS_CONTACT_URL`
3. **Kalkulator `Cannot read properties of null (reading 'toLowerCase')`** — `ControlDevicePicker` nie obsługiwał `null` w `p.name`/`m.name`

---

## Polecenia

```bash
npm start          # dev server na :3000
npm run build      # produkcyjny build
```

## Git

- Branch roboczy: `claude/update-status-and-name-ZRAlL`
- Main branch: `main`
- Remote: `origin`

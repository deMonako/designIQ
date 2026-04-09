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
│   │   ├── DwgViewer.jsx       # Interaktywny rzut DWG (SVG + overlay)
│   │   └── ClientWycenaView.jsx
│   ├── quotation/
│   │   └── WarrantyAndSupport.jsx
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
│   │   ├── Dashboard.jsx       # Widget ostatnich wejść klientów
│   │   └── Analityka.jsx
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
| `getLoginLogs` | GET | Logi wejść klientów (`{ limit: N }`) |
| `getCennik` | GET | Cennik urządzeń (autocomplete wyceny) |
| `getMaterialyJson` | GET | Katalog materiałów JSON (autocomplete wyceny) |
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

### WycenaEditor.jsx (admin)
- Edytor wycen z sekcjami kategorii
- **Autocomplete nazw pozycji** — przy ≥3 znakach sugeruje z `getCennik` + `getMaterialyJson`; wybranie sugestii auto-uzupełnia `unit_price` z `price_pln`
- **Drag & drop pomieszczeń** — `@dnd-kit/core` + `@dnd-kit/sortable`; każde pomieszczenie ma `id: rm-${Date.now()}-${random}`; `SortableRoomRow` z uchwytem `GripVertical`
- **Ujemne pozycje** — `calcGross(item) < 0` → zielone tło wiersza + zielony tekst ("Zniżka")
- `roomSensors` jako `const` na poziomie komponentu (nie inline w JSX — narusza Rules of Hooks)

### ClientWycenaView.jsx (panel klienta)
- `const round2 = v => Math.round(v * 100) / 100` — stosowany do wszystkich wartości monetarnych
- `toLocaleString` z `{ minimumFractionDigits: 2, maximumFractionDigits: 2 }` wszędzie
- Notatka do pozycji: drugi `<tr className="bg-orange-50/40">` jako `<React.Fragment>` — nie absolutnie pozycjonowany (unikamy przycięcia przez `overflow-x-hidden`)
- **Ujemne pozycje** — zielone tło + badge "Zniżka"

### DwgViewer.jsx (panel klienta)
- Interaktywny rzut piętra z punktami instalacyjnymi
- **Renderowanie:** SVG wstawiany bezpośrednio do DOM (nie canvas) — wektorowe, ostro przy każdym powiększeniu; `will-change: transform` na rodzicu = GPU composite layer
- **Pan:** CSS transform na `wrapRef` (translate + scale), drag via `mousemove`
- **Zoom:** `applyZoom(newScale, anchorX, anchorY)` — formuła: `newPan = anchor*(1-ratio) + oldPan*ratio`
- **Pinch-to-zoom (mobile):** `touchRef` + `pinchRef` (useRef przed applyZoom!), touch eventy bindowane przez `useEffect` z `{passive: false}`
- **Legenda filtrów:** domyślnie zwinięta (mały przycisk z kolorowymi kółkami), `max-h-[45vh]` po rozwinięciu
- **Przełącznik pięter:** `absolute bottom-10 left-1/2 -translate-x-1/2` (nie top — nie koliduje z Toolbar)
- **Panele mobilne (AttribPanel, ClusterPanel):** gdy `containerW < 480` → pełna szerokość, przypięty do dołu

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

### Dashboard.jsx (admin)
- Widget **"Ostatnie wejścia"** — `gasGet("getLoginLogs", { limit: 5 })` przy mount; kolorowe badge z kodem projektu + czas; umieszczony w lewej kolumnie pod "Nadchodzące"

### Analityka.jsx (admin)
- Logi logowań ograniczone do 20: `gasGet("getLoginLogs", { limit: 20 })` + `logs.slice(0, 20)`

---

## Nawigacja (Layout.js)

- **Realizacje** — tymczasowo wykomentowane z menu nawigacji

---

## Pliki statyczne

### public/.htaccess
- Redirect non-www → `https://www.designiq.pl`
- Redirect `http://www` → `https://www`
- SPA fallback: `RewriteRule . /index.html [L]`

---

## Naprawione błędy

### Sesja 2026-03-15
1. **Irytacja "Failed to fetch"** — brakował parametr `?action=zirytujMnie` w `.env` + brak `.catch()` w Instalator.jsx
2. **Konfigurator nie wysyłał maili** — formularze używały admin GAS zamiast `REACT_APP_GAS_CONTACT_URL`
3. **Kalkulator `Cannot read properties of null (reading 'toLowerCase')`** — `ControlDevicePicker` nie obsługiwał `null` w `p.name`/`m.name`

### Sesja 2026-04-09
4. **DwgViewer TDZ "Cannot access applyZoom before initialization"** — `onTouchMove` useCallback był zadeklarowany przed `applyZoom`; fix: `touchRef`/`pinchRef` (useRef) przed `applyZoom`, a `onTouchStart`/`onTouchMove` (useCallback) po nim
5. **Notatka wchodziła pod kolejną kategorię** — absolutnie pozycjonowany tooltip był przycinany przez `overflow-x-hidden`; fix: drugi `<tr>` jako inline row
6. **Zaokrąglenia wyceny** — brakujące `round2()` powodowało np. `1111,111 zł`; fix: `round2 = v => Math.round(v * 100) / 100` stosowany wszędzie
7. **DwgViewer blur przy zoomie** — canvas miał stałą liczbę pikseli; fix: zastąpienie canvasa bezpośrednim SVG w DOM (wektorowy re-render przy każdym zoomie)
8. **Legenda zasłaniała obraz na mobile** — fix: domyślnie zwinięta, `max-h-[45vh]` po rozwinięciu
9. **Przełącznik pięter zasłonięty** — fix: przeniesiony z `top-3` na `bottom-10`

---

## Polecenia

```bash
npm start          # dev server na :3000
npm run build      # produkcyjny build
```

## Git

- Main branch: `main`
- Remote: `origin`

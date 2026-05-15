# The Bikram Dey Archive
## A Five-Book Reading Platform — Fractured Cynicism

---

### Setup & Running

The application uses `fetch()` to load book files and requires a local web server.

**Option 1 — Python (recommended)**
```bash
cd bikram-archive
python3 -m http.server 8080
```
Then open: http://localhost:8080

**Option 2 — Node.js**
```bash
npx serve bikram-archive
```

**Option 3 — VS Code**
Use the "Live Server" extension. Right-click index.html → Open with Live Server.

---

### File Structure

```
bikram-archive/
├── index.html              ← Main application
├── Bikram_Dey.png          ← Series character illustration
├── css/
│   └── style.css           ← All styles, themes, responsive layout
├── js/
│   └── app.js              ← Application logic, text processing
├── data/
│   ├── series.json         ← Book metadata and atmosphere themes
│   └── body-inventory.json ← Bikram Dey's cumulative damage record
└── books/
    ├── injury-time.txt     ← Book 1
    ├── no-contest.txt      ← Book 2
    ├── last-ballot.txt     ← Book 3
    ├── glass-rulebook.txt  ← Book 4
    └── ward.txt            ← Book 5
```

---

### Features

**Reading Platform**
- Three-panel layout: Navigation sidebar / Reading area / Body Inventory
- Automatic chapter detection and navigation
- Reading progress tracking
- Four font size options (A− / A+)
- Smooth scrolling to chapters
- Scroll position memory per book

**Body Inventory**
- Persistent right panel showing Bikram Dey's physical and psychological status
- Evolves across all five books
- Metric bars for shoulder, knee, vision, spine, mind
- Cumulative history with mini-bar visualization

**Atmosphere System**
- Each book changes the application's color palette
- Book 1 (Injury Time): Sodium-vapor amber
- Book 2 (No Contest): Industrial red
- Book 3 (The Last Ballot): Procedural green
- Book 4 (The Glass Rulebook): Naval steel blue
- Book 5 (Ward): Clinical grey-green

**Mobile Support**
- Collapsible navigation drawer
- Expandable Body Inventory drawer
- Reading-first mobile layout
- Touch-optimized controls

**Keyboard Shortcuts**
- `Alt + →` — Next book
- `Alt + ←` — Previous book
- `Esc` — Close mobile drawers

---

### Series Order

| # | Title | Atmosphere |
|---|-------|-----------|
| 1 | Injury Time | Sodium-vapor / Wet asphalt |
| 2 | No Contest | Industrial / Flower market neon |
| 3 | The Last Ballot | Bureaucratic / Fluorescent fatigue |
| 4 | The Glass Rulebook | Frosted institutional glass / Naval steel |
| 5 | Ward | Clinical rehabilitation / Surveillance undertones |

---

*The text of all five books is loaded verbatim from source files. No content is modified, summarised, or paraphrased by the application.*

/* ═══════════════════════════════════════════════
   THE BIKRAM DEY ARCHIVE — APP.JS
   Institutional Archive / Procedural Case System
   ═══════════════════════════════════════════════ */

'use strict';

// ── STATE ─────────────────────────────────────────
const State = {
  books: [],
  inventory: null,
  currentBookIndex: -1,
  currentChapters: [],
  fontSizeClass: 'font-md',
  readingProgress: 0,
  scrollPositions: {},
};

// ── DOM REFERENCES ────────────────────────────────
const DOM = {
  app: null,
  sidebar: null,
  readerPanel: null,
  inventoryPanel: null,
  bookNavList: null,
  chapterNavWrap: null,
  chapterNavList: null,
  progressFill: null,
  loadingState: null,
  welcomeScreen: null,
  bookContent: null,
  bookHeader: null,
  readingContent: null,
  bookText: null,
  topbarLocation: null,
  readingStatCurrent: null,
  readingStatTotal: null,
  inventoryBody: null,
  mobileNavDrawer: null,
  mobileInvDrawer: null,
  drawerOverlay: null,
  mobileNavBtn: null,
  mobileInvBtn: null,
};

// ── INIT ──────────────────────────────────────────
async function init() {
  cacheDOMRefs();
  setupMobileControls();
  setupFontControls();
  setupScrollTracking();
  document.body.classList.add('font-md');

  try {
    const [seriesData, inventoryData] = await Promise.all([
      fetchJSON('data/series.json'),
      fetchJSON('data/body-inventory.json'),
    ]);
    State.books = seriesData.books;
    State.inventory = inventoryData;
    renderBookNav();
    renderInventoryHistory();
    showWelcome();
  } catch (e) {
    console.error('Archive init failed:', e);
    showError('Archive initialisation failed. Ensure the server is running.');
  }
}

function cacheDOMRefs() {
  DOM.app               = document.getElementById('app');
  DOM.sidebar           = document.getElementById('sidebar');
  DOM.readerPanel       = document.getElementById('reader-panel');
  DOM.inventoryPanel    = document.getElementById('inventory-panel');
  DOM.bookNavList       = document.getElementById('book-nav-list');
  DOM.chapterNavWrap    = document.getElementById('chapter-nav-wrap');
  DOM.chapterNavList    = document.getElementById('chapter-nav-list');
  DOM.progressFill      = document.getElementById('progress-fill');
  DOM.loadingState      = document.getElementById('loading-state');
  DOM.welcomeScreen     = document.getElementById('welcome-screen');
  DOM.bookContent       = document.getElementById('book-content');
  DOM.bookHeader        = document.getElementById('book-header');
  DOM.readingContent    = document.getElementById('reading-content');
  DOM.bookText          = document.getElementById('book-text');
  DOM.topbarLocation    = document.getElementById('topbar-location');
  DOM.readingStatCurrent= document.getElementById('reading-stat-current');
  DOM.readingStatTotal  = document.getElementById('reading-stat-total');
  DOM.inventoryBody     = document.getElementById('inventory-body');
  DOM.mobileNavDrawer   = document.getElementById('mobile-nav-drawer');
  DOM.mobileInvDrawer   = document.getElementById('mobile-inv-drawer');
  DOM.drawerOverlay     = document.getElementById('drawer-overlay');
  DOM.mobileNavBtn      = document.getElementById('mobile-nav-btn');
  DOM.mobileInvBtn      = document.getElementById('mobile-inv-btn');
}

// ── FETCH HELPERS ─────────────────────────────────
async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.json();
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.text();
}

// ── BOOK NAVIGATION ───────────────────────────────
function renderBookNav() {
  DOM.bookNavList.innerHTML = State.books.map((book, i) => `
    <div class="book-nav-item" data-book-index="${i}" onclick="loadBook(${i})">
      <div class="book-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="book-nav-content">
        <div class="book-nav-title">${book.title}</div>
        <div class="book-nav-sub">${book.subtitle}</div>
      </div>
    </div>
  `).join('');
}

function updateBookNavActive(index) {
  document.querySelectorAll('.book-nav-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
}

// ── LOAD BOOK ─────────────────────────────────────
async function loadBook(index) {
  if (index === State.currentBookIndex) return;

  // Save scroll position
  if (State.currentBookIndex >= 0) {
    State.scrollPositions[State.currentBookIndex] = DOM.readerPanel.scrollTop;
  }

  const book = State.books[index];
  State.currentBookIndex = index;

  // Update atmosphere
  document.body.setAttribute('data-book', book.slug);
  updateBookNavActive(index);
  closeMobileDrawers();

  // Show loading
  showLoading();

  try {
    const rawText = await fetchText(book.file);
    State.currentChapters = [];

    renderBookContent(book, rawText);
    renderChapterNav(State.currentChapters);
    renderCurrentInventory(index);
    updateTopbarLocation(book);

    // Restore or reset scroll
    const savedPos = State.scrollPositions[index] || 0;
    DOM.readerPanel.scrollTop = savedPos;

    showBookContent();
    DOM.readerPanel.classList.add('book-transition');
    setTimeout(() => DOM.readerPanel.classList.remove('book-transition'), 500);
  } catch (e) {
    console.error('Failed to load book:', e);
    showError(`Failed to load "${book.title}". Ensure book files are present.`);
  }
}

// ── TEXT PROCESSING ───────────────────────────────
function renderBookContent(book, rawText) {
  // Build book header
  DOM.bookHeader.innerHTML = `
    <div class="book-header-inner">
      <div class="book-number-label">Book ${book.id} of 5 — The Bikram Dey Archive</div>
      <div class="book-main-title">${book.title}</div>
      <div class="book-subtitle-line">${book.subtitle}</div>
      <div class="book-meta-row">
        <div class="book-meta-item"><strong>Atmosphere</strong> ${formatAtmosphere(book.atmosphere)}</div>
        <div class="book-meta-item"><strong>Setting</strong> ${book.setting}</div>
      </div>
    </div>
  `;

  // Process the text
  const html = processBookText(rawText);
  DOM.bookText.innerHTML = html;

  // Count words for stats
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.ceil(wordCount / 230);
  if (DOM.readingStatTotal) {
    DOM.readingStatTotal.textContent = `~${readingMinutes} min`;
  }
}

function formatAtmosphere(atm) {
  const map = {
    'sodium-vapor': 'Sodium-Vapor / Wet Asphalt',
    'industrial': 'Industrial / Flower Market Neon',
    'bureaucratic': 'Fluorescent Fatigue / Procedural',
    'institutional': 'Frosted Glass / Naval Steel',
    'clinical': 'Clinical Rehabilitation / Surveillance',
  };
  return map[atm] || atm;
}

function processBookText(rawText) {
  // Split into lines for processing
  const lines = rawText.split('\n');
  let html = '';
  let chapterCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect chapter headings — various patterns used across the books
    if (isChapterHeading(trimmed)) {
      const cleanTitle = stripMarkdownBold(trimmed);
      const chapterId = `chapter-${++chapterCount}`;
      State.currentChapters.push({ id: chapterId, title: cleanTitle });

      html += `<span id="${chapterId}" class="chapter-anchor chapter-heading">${escapeHtml(cleanTitle)}</span>\n`;
      continue;
    }

    // Section headings (italic lines, location/time stamps in italics)
    if (isSectionHeading(trimmed)) {
      const clean = stripMarkdown(trimmed);
      html += `<span class="section-heading">${escapeHtml(clean)}</span>\n`;
      continue;
    }

    // Timestamp / location italic lines e.g. *Tangra, Kolkata — 9:15 PM*
    if (isTimestamp(trimmed)) {
      const clean = trimmed.replace(/^\*/, '').replace(/\*$/, '').trim();
      html += `<span class="timestamp-line">${escapeHtml(clean)}</span>\n`;
      continue;
    }

    // Scene break markers
    if (isSceneBreak(trimmed)) {
      html += `<span class="scene-break">— ◦ —</span>\n`;
      continue;
    }

    // Bold italic for chapter titles still in ** ** format
    if (/^\*\*.*\*\*$/.test(trimmed)) {
      const clean = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
      if (clean.match(/^(chapter|part|prologue|epilogue|appendix)/i) || clean.length < 60) {
        const chapterId = `chapter-${++chapterCount}`;
        State.currentChapters.push({ id: chapterId, title: clean });
        html += `<span id="${chapterId}" class="chapter-anchor chapter-heading">${escapeHtml(clean)}</span>\n`;
        continue;
      }
      html += `<span class="bold-text">${escapeHtml(clean)}</span>\n`;
      continue;
    }

    // Italic text blocks *...*
    if (/^\*[^*].*[^*]\*$/.test(trimmed) && trimmed.length > 4) {
      const clean = trimmed.replace(/^\*/, '').replace(/\*$/, '').trim();
      html += `<span class="italic-block">${escapeHtml(clean)}</span>\n`;
      continue;
    }

    // Normal text (preserve line breaks)
    if (trimmed === '') {
      html += '\n';
    } else {
      // Inline bold/italic handling
      const processed = processInlineFormatting(escapeHtml(line));
      html += processed + '\n';
    }
  }

  return html;
}

function isChapterHeading(line) {
  if (!line) return false;
  // Patterns: CHAPTER ONE, Chapter One, **CHAPTER ONE**, **Chapter One**
  const patterns = [
    /^(CHAPTER|Chapter)\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\d+)/i,
    /^\*\*(CHAPTER|Chapter)\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\d+)/i,
    /^(PART|Part)\s+(ONE|TWO|THREE|FOUR|FIVE|\d+)/i,
    /^\*\*(PART|Part)\s+(ONE|TWO|THREE|FOUR|FIVE|\d+)/i,
    /^(PROLOGUE|EPILOGUE|APPENDIX|INTERMISSION)$/i,
    /^\*\*(PROLOGUE|EPILOGUE|APPENDIX|INTERMISSION)\*\*$/i,
  ];
  return patterns.some(p => p.test(line));
}

function isSectionHeading(line) {
  if (!line) return false;
  // **Title** that's not a chapter heading and is short
  if (/^\*\*[^*]+\*\*$/.test(line)) {
    const inner = line.replace(/^\*\*/, '').replace(/\*\*$/, '');
    // If it reads like a section title (short, no period at end)
    if (inner.length < 80 && !inner.endsWith('.') && !inner.endsWith(',')) {
      return true;
    }
  }
  return false;
}

function isTimestamp(line) {
  if (!line) return false;
  // *Location — Time* or *Location, Date*
  return /^\*[A-Z].*(\s—\s|\s–\s|,\s\d).*\*$/.test(line);
}

function isSceneBreak(line) {
  return /^[—–\-]{3,}$|^[\*\s]+[\*][\s\*]+$|^—\s*◦\s*—$|^[\*]{3}$|^---+$/.test(line);
}

function stripMarkdownBold(text) {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
}

function stripMarkdown(text) {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/, '').trim();
}

function processInlineFormatting(html) {
  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── CHAPTER NAVIGATION ────────────────────────────
function renderChapterNav(chapters) {
  if (!DOM.chapterNavList) return;

  if (chapters.length === 0) {
    DOM.chapterNavList.innerHTML = `<div class="chapter-nav-item" style="cursor:default;color:var(--text-dim)">No chapters detected</div>`;
    return;
  }

  DOM.chapterNavList.innerHTML = chapters.map((ch, i) => `
    <div class="chapter-nav-item" onclick="scrollToChapter('${ch.id}')" data-chapter-id="${ch.id}">
      ${ch.title.length > 40 ? ch.title.slice(0, 38) + '…' : ch.title}
    </div>
  `).join('');
}

function scrollToChapter(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const panelRect = DOM.readerPanel.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const offset = elRect.top - panelRect.top + DOM.readerPanel.scrollTop - 70;

  DOM.readerPanel.scrollTo({ top: offset, behavior: 'smooth' });
  closeMobileDrawers();
}

// ── SCROLL TRACKING ───────────────────────────────
function setupScrollTracking() {
  DOM.readerPanel.addEventListener('scroll', onReaderScroll, { passive: true });
}

function onReaderScroll() {
  const panel = DOM.readerPanel;
  const scrollMax = panel.scrollHeight - panel.clientHeight;
  const scrollPct = scrollMax > 0 ? Math.min(100, (panel.scrollTop / scrollMax) * 100) : 0;

  // Update progress bar
  if (DOM.progressFill) {
    DOM.progressFill.style.width = scrollPct.toFixed(1) + '%';
  }

  // Update reading stat
  if (DOM.readingStatCurrent) {
    DOM.readingStatCurrent.textContent = Math.round(scrollPct) + '%';
  }

  // Update active chapter in nav
  updateActiveChapterNav(panel.scrollTop);
}

function updateActiveChapterNav(scrollTop) {
  if (!State.currentChapters.length) return;

  let activeId = null;
  const offset = 100;

  for (const ch of State.currentChapters) {
    const el = document.getElementById(ch.id);
    if (!el) continue;
    const panelRect = DOM.readerPanel.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const elTop = elRect.top - panelRect.top + DOM.readerPanel.scrollTop;
    if (elTop <= scrollTop + offset) {
      activeId = ch.id;
    }
  }

  document.querySelectorAll('.chapter-nav-item').forEach(el => {
    el.classList.toggle('active-chapter', el.dataset.chapterId === activeId);
  });
}

// ── INVENTORY RENDERING ───────────────────────────
function renderCurrentInventory(bookIndex) {
  const inv = State.inventory;
  if (!inv || !inv.progression) return;

  const current = inv.progression[bookIndex];
  if (!current) return;

  // Render current book inventory
  const currentBlock = document.getElementById('inventory-current');
  if (!currentBlock) return;

  currentBlock.innerHTML = `
    <div class="inv-book-label">${current.label}</div>
    ${current.metrics.map(m => renderMetric(m)).join('')}
    <div class="overall-status ${current.statusClass}">${current.overallStatus}</div>
    ${current.annotation ? `<div class="inv-annotation">${current.annotation}</div>` : ''}
  `;

  // Update active history
  document.querySelectorAll('.history-item').forEach((el, i) => {
    el.classList.toggle('active-history', i === bookIndex);
  });
}

function renderMetric(m) {
  const hasBar = m.value !== null;
  let barClass = '';
  if (m.value !== null) {
    if (m.value < 70) barClass = 'critical';
    else if (m.value < 80) barClass = 'declining';
    else barClass = 'stable';
  }

  return `
    <div class="metric-row">
      <div class="metric-label">
        <span class="metric-name">${m.system}</span>
        <span class="metric-value">${m.value !== null ? m.value + '%' : m.status}</span>
      </div>
      ${hasBar ? `
        <div class="metric-bar-track">
          <div class="metric-bar-fill ${barClass}" style="width:${m.value}%"></div>
        </div>
        <div class="metric-status-text">${m.status}</div>
      ` : `
        <div class="metric-bar-track">
          <div class="metric-bar-fill" style="width:0%"></div>
        </div>
        <div class="metric-status-text">${m.status}</div>
      `}
    </div>
  `;
}

function renderInventoryHistory() {
  const inv = State.inventory;
  if (!inv) return;

  const histWrap = document.getElementById('inventory-history');
  if (!histWrap) return;

  histWrap.innerHTML = `
    <div class="history-label">Cumulative Record</div>
    ${inv.progression.map((prog, i) => `
      <div class="history-item" onclick="loadBook(${i})" data-book-index="${i}">
        <div class="history-book-title">${prog.label}</div>
        <div class="history-mini-bars">
          ${prog.metrics.slice(0, 4).map(m => `
            <div class="history-mini-bar">
              <div class="history-mini-fill" style="width:${m.value !== null ? m.value : 50}%"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

// ── TOPBAR ────────────────────────────────────────
function updateTopbarLocation(book) {
  if (DOM.topbarLocation) {
    DOM.topbarLocation.innerHTML = `
      <span>The Bikram Dey Archive</span>
      <span style="margin:0 8px;opacity:0.3">·</span>
      <span class="current-book-label">${book.title}</span>
    `;
  }
}

// ── UI STATE ──────────────────────────────────────
function showLoading() {
  if (DOM.loadingState) DOM.loadingState.style.display = 'flex';
  if (DOM.welcomeScreen) DOM.welcomeScreen.style.display = 'none';
  if (DOM.bookContent) DOM.bookContent.style.display = 'none';
}

function showWelcome() {
  if (DOM.loadingState) DOM.loadingState.style.display = 'none';
  if (DOM.welcomeScreen) DOM.welcomeScreen.style.display = 'block';
  if (DOM.bookContent) DOM.bookContent.style.display = 'none';
}

function showBookContent() {
  if (DOM.loadingState) DOM.loadingState.style.display = 'none';
  if (DOM.welcomeScreen) DOM.welcomeScreen.style.display = 'none';
  if (DOM.bookContent) {
    DOM.bookContent.style.display = 'block';
    DOM.bookContent.classList.add('fade-in');
    setTimeout(() => DOM.bookContent.classList.remove('fade-in'), 400);
  }
}

function showError(msg) {
  if (DOM.loadingState) {
    DOM.loadingState.innerHTML = `
      <div class="loading-text" style="color:var(--status-red);max-width:300px;text-align:center;line-height:1.6">${msg}</div>
    `;
    DOM.loadingState.style.display = 'flex';
  }
}

// ── FONT SIZE CONTROLS ────────────────────────────
function setupFontControls() {
  const sizes = ['font-sm', 'font-md', 'font-lg', 'font-xl'];
  let current = 1;

  const btnIncrease = document.getElementById('font-increase');
  const btnDecrease = document.getElementById('font-decrease');

  if (btnIncrease) {
    btnIncrease.addEventListener('click', () => {
      if (current < sizes.length - 1) {
        document.body.classList.remove(sizes[current]);
        current++;
        document.body.classList.add(sizes[current]);
        State.fontSizeClass = sizes[current];
      }
    });
  }

  if (btnDecrease) {
    btnDecrease.addEventListener('click', () => {
      if (current > 0) {
        document.body.classList.remove(sizes[current]);
        current--;
        document.body.classList.add(sizes[current]);
        State.fontSizeClass = sizes[current];
      }
    });
  }
}

// ── MOBILE CONTROLS ───────────────────────────────
function setupMobileControls() {
  if (DOM.mobileNavBtn) {
    DOM.mobileNavBtn.addEventListener('click', () => {
      const isOpen = DOM.mobileNavDrawer.classList.contains('open');
      closeMobileDrawers();
      if (!isOpen) {
        DOM.mobileNavDrawer.classList.add('open');
        DOM.drawerOverlay.classList.add('visible');
        DOM.mobileNavBtn.classList.add('active');
      }
    });
  }

  if (DOM.mobileInvBtn) {
    DOM.mobileInvBtn.addEventListener('click', () => {
      const isOpen = DOM.mobileInvDrawer.classList.contains('open');
      closeMobileDrawers();
      if (!isOpen) {
        DOM.mobileInvDrawer.classList.add('open');
        DOM.drawerOverlay.classList.add('visible');
        DOM.mobileInvBtn.classList.add('active');
      }
    });
  }

  if (DOM.drawerOverlay) {
    DOM.drawerOverlay.addEventListener('click', closeMobileDrawers);
  }
}

function closeMobileDrawers() {
  if (DOM.mobileNavDrawer) DOM.mobileNavDrawer.classList.remove('open');
  if (DOM.mobileInvDrawer) DOM.mobileInvDrawer.classList.remove('open');
  if (DOM.drawerOverlay) DOM.drawerOverlay.classList.remove('visible');
  if (DOM.mobileNavBtn) DOM.mobileNavBtn.classList.remove('active');
  if (DOM.mobileInvBtn) DOM.mobileInvBtn.classList.remove('active');
}

// ── KEYBOARD NAVIGATION ───────────────────────────
document.addEventListener('keydown', (e) => {
  // Arrow keys for book navigation
  if (e.altKey && e.key === 'ArrowRight' && State.currentBookIndex < State.books.length - 1) {
    loadBook(State.currentBookIndex + 1);
  }
  if (e.altKey && e.key === 'ArrowLeft' && State.currentBookIndex > 0) {
    loadBook(State.currentBookIndex - 1);
  }
  // Escape closes mobile drawers
  if (e.key === 'Escape') {
    closeMobileDrawers();
  }
});

// ── WELCOME SCREEN BOOK ROW CLICK ─────────────────
function initWelcomeScreen(books) {
  const grid = document.getElementById('welcome-series-grid');
  if (!grid) return;
  grid.innerHTML = books.map((book, i) => `
    <div class="welcome-book-row" onclick="loadBook(${i})">
      <div class="wb-num">${String(i+1).padStart(2,'0')}</div>
      <div class="wb-title">${book.title}</div>
      <div class="wb-arrow">→</div>
    </div>
  `).join('');
}

// ── GLOBAL EXPOSE ─────────────────────────────────
window.loadBook = loadBook;
window.scrollToChapter = scrollToChapter;

// ── START ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  init().then(() => {
    initWelcomeScreen(State.books);
  });
});

/* ══════════════════════════════════════════════════════════
   DELTA ENERGY — Main Script
   ══════════════════════════════════════════════════════════ */

/* ── Hero image entrance ── */
window.addEventListener('load', () => {
  document.getElementById('hero')?.classList.add('loaded');

  // Stagger hero reveals
  document.querySelectorAll('#hero .reveal-up').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 300 + i * 160);
  });
});

/* ── Navbar scroll ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Mobile burger ── */
const burger      = document.getElementById('burger');
const mobileMenu  = document.getElementById('mobileMenu');
burger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
document.querySelectorAll('.mm-link').forEach(l =>
  l.addEventListener('click', () => mobileMenu.classList.remove('open'))
);

/* ── Smooth anchor scrolling ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ════════════════════════════════════════════
   SCROLL REVEAL
   ════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
  }),
  { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
);
document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right')
        .forEach(el => revealObserver.observe(el));

/* ════════════════════════════════════════════
   SERVICE SCENES — cinematic activation
   ════════════════════════════════════════════ */
const scenes = document.querySelectorAll('.service-scene');

const sceneObserver = new IntersectionObserver(
  entries => entries.forEach(e =>
    e.target.classList.toggle('scene-active', e.isIntersecting)
  ),
  { threshold: 0, rootMargin: '-32% 0px -32% 0px' }
);
scenes.forEach(s => sceneObserver.observe(s));

/* Dot nav for scenes */
(function buildSceneDots() {
  if (!scenes.length) return;
  const labels = ['Μείωση Κόστους', 'Διαχείριση', 'Φωτοβολταϊκά', 'Ηλεκτροκίνηση'];
  const nav = document.createElement('div');
  nav.className = 'scene-nav-dots';
  nav.innerHTML = [...scenes].map((_, i) =>
    `<button class="scene-dot" data-i="${i}" title="${labels[i] || i+1}"></button>`
  ).join('');
  document.body.appendChild(nav);

  nav.querySelectorAll('.scene-dot').forEach(d =>
    d.addEventListener('click', () =>
      scenes[d.dataset.i].scrollIntoView({ behavior: 'smooth', block: 'center' })
    )
  );

  const dotObs = new IntersectionObserver(
    entries => entries.forEach(e => {
      const idx = [...scenes].indexOf(e.target);
      nav.querySelector(`[data-i="${idx}"]`)?.classList.toggle('active', e.isIntersecting);
    }),
    { threshold: 0, rootMargin: '-32% 0px -32% 0px' }
  );
  scenes.forEach(s => dotObs.observe(s));

  // show/hide with services section
  const svc = document.getElementById('services');
  if (svc) {
    new IntersectionObserver(([e]) => nav.classList.toggle('visible', e.isIntersecting), { threshold: 0.02 })
      .observe(svc);
  }
})();

// Dot styles
const dotStyle = document.createElement('style');
dotStyle.textContent = `
  .scene-nav-dots{position:fixed;right:24px;top:50%;transform:translateY(-50%);z-index:500;
    display:flex;flex-direction:column;gap:10px;opacity:0;pointer-events:none;transition:opacity .4s}
  .scene-nav-dots.visible{opacity:1;pointer-events:all}
  .scene-dot{width:7px;height:7px;border-radius:50%;border:1.5px solid rgba(137,234,95,.35);
    background:transparent;cursor:pointer;transition:.3s;padding:0}
  .scene-dot.active{background:#89EA5F;border-color:#89EA5F;transform:scale(1.5)}
  .scene-dot:hover{border-color:#89EA5F;transform:scale(1.2)}
  @media(max-width:768px){.scene-nav-dots{display:none}}
`;
document.head.appendChild(dotStyle);

/* ════════════════════════════════════════════
   PROJECT FILTER TABS
   ════════════════════════════════════════════ */
document.querySelectorAll('.pf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      const match = filter === 'all' || card.dataset.cat === filter;
      card.classList.toggle('hidden', !match);
    });
  });
});

/* ════════════════════════════════════════════
   NEWS — fetch from Google News via rss2json
   ════════════════════════════════════════════ */
async function loadNews() {
  const grid  = document.getElementById('newsGrid');

  // Build the Google News RSS URL first (NOT double-encoded)
  const googleRss = 'https://news.google.com/rss/search?q=φωτοβολταϊκά+OR+ηλεκτροκίνηση+OR+εξοικονόμηση+ενέργεια+Ελλάδα&hl=el&gl=GR&ceid=GR:el';
  // rss2json acts as CORS proxy — encode only the rss_url param
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(googleRss)}&count=6`;

  try {
    const res  = await fetch(apiUrl);
    const data = await res.json();

    if (!data.items || !data.items.length) throw new Error('No items');

    grid.innerHTML = '';
    data.items.slice(0, 6).forEach(item => {
      const date    = item.pubDate ? new Date(item.pubDate).toLocaleDateString('el-GR', { day:'numeric', month:'short', year:'numeric' }) : '';
      const source  = item.author || extractSource(item.title) || 'Νέα Ενέργειας';
      const title   = cleanTitle(item.title, source);

      const card = document.createElement('a');
      card.className   = 'news-card reveal-up';
      card.href        = item.link;
      card.target      = '_blank';
      card.rel         = 'noopener noreferrer';
      card.innerHTML   = `
        <div class="news-card-meta">
          <span class="news-source-tag">${escHtml(source)}</span>
          <span>${escHtml(date)}</span>
        </div>
        <div class="news-card-title">${escHtml(title)}</div>
        <div class="news-card-arrow">
          Διαβάστε περισσότερα
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `;
      grid.appendChild(card);

      // trigger reveal
      setTimeout(() => card.classList.add('visible'), 80);
    });

  } catch (err) {
    // Fallback: show curated static articles from the old site
    grid.innerHTML = '';
    const fallback = [
      { title: 'Έναρξη Net Billing – Νέο πλαίσιο για τα φωτοβολταϊκά', date: '9 Νοε 2024', href: 'https://www.deltaenergy.gr/nea/' },
      { title: 'Κατάργηση Net Metering – Τι αλλάζει για τους παραγωγούς', date: '5 Ιουλ 2023', href: 'https://www.deltaenergy.gr/nea/' },
      { title: 'Αύξηση των ορίων ισχύος Net Metering', date: '9 Οκτ 2021', href: 'https://www.deltaenergy.gr/nea/' },
      { title: 'Αύξηση ανώτατου ορίου εγκατάστασης Φ/Β συστημάτων', date: '21 Ιαν 2021', href: 'https://www.deltaenergy.gr/nea/' },
      { title: 'Έναρξη Ελληνικού Χρηματιστηρίου Ενέργειας (ΕΧΕ)', date: '1 Νοε 2020', href: 'https://www.deltaenergy.gr/nea/' },
      { title: 'Εγκαίνια στη διασύνδεση των Κυκλάδων', date: '20 Μαρ 2018', href: 'https://www.deltaenergy.gr/nea/' },
    ];
    fallback.forEach((item, i) => {
      const card = document.createElement('a');
      card.className = 'news-card reveal-up';
      card.href      = item.href;
      card.target    = '_blank';
      card.rel       = 'noopener noreferrer';
      card.innerHTML = `
        <div class="news-card-meta">
          <span class="news-source-tag">Delta Energy</span>
          <span>${item.date}</span>
        </div>
        <div class="news-card-title">${escHtml(item.title)}</div>
        <div class="news-card-arrow">
          Διαβάστε περισσότερα
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `;
      grid.appendChild(card);
      setTimeout(() => card.classList.add('visible'), 80 + i * 60);
    });
  }
}

/* helpers */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function cleanTitle(title, source) {
  // Google News appends " - Source" at the end
  if (source && title.endsWith(' - ' + source)) {
    return title.slice(0, -(source.length + 3));
  }
  const dashIdx = title.lastIndexOf(' - ');
  return dashIdx > 20 ? title.slice(0, dashIdx) : title;
}
function extractSource(title) {
  const dashIdx = title.lastIndexOf(' - ');
  return dashIdx > 20 ? title.slice(dashIdx + 3) : '';
}

loadNews();

/* ════════════════════════════════════════════
   CONTACT FORM handler (demo)
   ════════════════════════════════════════════ */
function handleSubmit(event) {
  event.preventDefault();
  const btn     = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnIcon = document.getElementById('btnIcon');

  btn.disabled = true;
  btnText.textContent = 'Αποστολή…';

  setTimeout(() => {
    btnText.textContent = '✓ Εστάλη! Θα επικοινωνήσουμε σύντομα';
    btnIcon.style.display = 'none';
    btn.style.background = '#5DC832';

    setTimeout(() => {
      document.getElementById('contactForm').reset();
      btnText.textContent    = 'Αποστολή Μηνύματος';
      btnIcon.style.display  = '';
      btn.style.background   = '';
      btn.disabled           = false;
    }, 4500);
  }, 1200);
}

/* ── Parallax on hero orbs ── */
window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  document.querySelector('.orb1')?.style.setProperty('transform', `translateY(${sy * 0.14}px)`);
  document.querySelector('.orb2')?.style.setProperty('transform', `translateY(${sy * -0.09}px)`);
}, { passive: true });

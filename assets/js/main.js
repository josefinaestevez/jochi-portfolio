// Nav: scrolled state
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('nav-links');

toggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Gallery lightbox
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const lightbox     = document.getElementById('lightbox');
const lightboxImg  = document.getElementById('lightbox-img');
const closeBtn     = document.querySelector('.lightbox-close');
const prevBtn      = document.querySelector('.lightbox-prev');
const nextBtn      = document.querySelector('.lightbox-next');

const sources = galleryItems.map(el => el.querySelector('img').src);
let current = 0;

function show(index) {
  current = (index + sources.length) % sources.length;
  lightboxImg.src = sources[current];
}

function openLightbox(index) {
  show(index);
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
  closeBtn.focus();
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  galleryItems[current]?.focus();
}

galleryItems.forEach((item, i) => {
  item.addEventListener('click', () => openLightbox(i));
  item.setAttribute('tabindex', '0');
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
  });
});

closeBtn?.addEventListener('click', closeLightbox);
prevBtn?.addEventListener('click', () => show(current - 1));
nextBtn?.addEventListener('click', () => show(current + 1));
lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lightbox?.classList.contains('active')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  show(current - 1);
  if (e.key === 'ArrowRight') show(current + 1);
});

// ===== RA EVENTS =====
async function fetchEvents(type) {
  const res = await fetch(`/.netlify/functions/ra-events?type=${type}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json?.data?.artist?.events ?? [];
}

function fmtDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

function renderEventList(events, container) {
  if (!events.length) {
    container.innerHTML = '<p class="events-empty">No events to show.</p>';
    return;
  }
  const now = new Date();
  container.innerHTML = events.map(ev => {
    const venue   = ev.venue?.name ?? '';
    const city    = ev.venue?.area?.name ?? '';
    const country = ev.venue?.area?.country?.name ?? '';
    const loc     = [city, country].filter(Boolean).join(', ');
    const href    = ev.contentUrl ? `https://ra.co${ev.contentUrl}` : 'https://ra.co/dj/jochi';
    const name    = ev.title || venue || '—';
    const venueHtml  = venue ? `<span class="event-sep">/</span><span class="event-venue">${venue}</span>` : '';
    const locHtml    = loc   ? `<span class="event-sep">/</span><span class="event-location">${loc}</span>` : '';
    const isPast     = new Date(ev.date) < now;
    return `
      <a class="event-row${isPast ? ' is-past' : ''}" href="${href}" target="_blank" rel="noopener">
        <span class="event-date">${fmtDate(ev.date)}</span>
        <span class="event-sep">/</span>
        <span class="event-name">${name}</span>
        ${venueHtml}
        ${locHtml}
        <span class="event-arrow">↗</span>
      </a>`;
  }).join('');
}

function renderError(container) {
  container.innerHTML = `<p class="events-empty">
    Couldn't load events.
    <a href="https://ra.co/dj/jochi" target="_blank" rel="noopener">View on Resident Advisor →</a>
  </p>`;
}

async function initEvents() {
  const list = document.getElementById('events-list');
  if (!list) return;

  try {
    const [upcoming, past] = await Promise.all([
      fetchEvents('FROMDATE'),
      fetchEvents('PREVIOUS'),
    ]);

    // deduplicate by id
    const seen = new Set();
    const all  = [...upcoming, ...past].filter(ev => {
      if (seen.has(ev.id)) return false;
      seen.add(ev.id);
      return true;
    });

    const now = new Date();
    const future = all.filter(ev => new Date(ev.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
    const done   = all.filter(ev => new Date(ev.date) <  now).sort((a, b) => new Date(b.date) - new Date(a.date));

    renderEventList([...future, ...done], list);
  } catch (err) {
    console.warn('RA events fetch failed:', err.message);
    renderError(list);
  }
}

initEvents();

// ===== MIXES =====
const MIXES = [
  {
    num: '03',
    title: 'Moonrise Sessions Vol. 3',
    meta: 'Macarena · Jan \'25 · 1h30',
    url: 'https://soundcloud.com/jochimusica/moonrise-sessions-vol-3',
    trackId: '2245589858',
    cover: 'assets/images/moonrise-3.jpg',
  },
  {
    num: '02',
    title: 'Moonrise Sessions Vol. 2',
    meta: 'Minimal Deep Tech · 1h',
    url: 'https://soundcloud.com/jochimusica/moonrise-sessions-vol-2',
    trackId: '2152516557',
    cover: 'assets/images/moonrise-2.jpg',
  },
  {
    num: '01',
    title: 'Moonrise Sessions Vol. 1',
    meta: 'Sin Sync · Rouge Cocktail Club',
    url: 'https://soundcloud.com/jochimusica/moonrise-sessions-vol-1',
    trackId: '2113815915',
    cover: 'assets/images/moonrise-1.jpg',
  },
];

function renderMixes() {
  const list = document.getElementById('mixes-list');
  if (!list) return;

  if (!MIXES.length) {
    list.innerHTML = '<p class="mixes-empty">Mixes coming soon.</p>';
    return;
  }

  list.innerHTML = MIXES.map((m) => {
    const thumb = m.cover
      ? `<img class="mix-thumb" src="${m.cover}" alt="${m.title}" loading="lazy" />`
      : `<div class="mix-thumb-placeholder"></div>`;
    return `
      <div class="mix-row" role="button" tabindex="0" data-mix="${m.num}">
        <div class="mix-cover-wrap">
          ${thumb}
          <div class="mix-cover-overlay">
            <span class="mix-play">▶ Play</span>
          </div>
        </div>
        <div class="mix-info">
          <span class="mix-platform">SoundCloud · ${m.num}</span>
          <span class="mix-title">${m.title}</span>
          <span class="mix-meta">${m.meta}</span>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('.mix-row').forEach((row, i) => {
    row.addEventListener('click', () => openPlayer(MIXES[i]));
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayer(MIXES[i]); }
    });
  });
}

// ===== FLOATING PLAYER =====
const playerBar    = document.getElementById('mix-player');
const playerIframe = document.getElementById('mix-player-iframe');
const playerThumb  = document.getElementById('mix-player-thumb');
const playerTitle  = document.getElementById('mix-player-title');
const playerMeta   = document.getElementById('mix-player-meta');
const playerClose  = document.getElementById('mix-player-close');

function openPlayer(mix) {
  playerThumb.src     = mix.cover || '';
  playerThumb.alt     = mix.title;
  playerTitle.textContent = mix.title;
  playerMeta.textContent  = mix.meta;
  playerIframe.src = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${mix.trackId}&color=%239d87c8&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&show_artwork=false`;
  playerBar.classList.add('active');
}

playerClose?.addEventListener('click', () => {
  playerBar.classList.remove('active');
  setTimeout(() => { playerIframe.src = ''; }, 350);
});

renderMixes();

// ===== INSTAGRAM FEED =====
const INSTAGRAM_TOKEN = ''; // Paste your long-lived access token here

async function loadInstagramFeed() {
  const grid = document.getElementById('instagram-grid');
  if (!grid || !INSTAGRAM_TOKEN) return;

  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink&limit=9&access_token=${INSTAGRAM_TOKEN}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();

    grid.innerHTML = data
      .slice(0, 9)
      .map(post => {
        const src = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
        const badge = post.media_type === 'VIDEO' ? '<span class="instagram-video-badge">▶</span>' : '';
        return `<a href="${post.permalink}" target="_blank" rel="noopener" class="instagram-item">
          <img src="${src}" alt="JOCHI on Instagram" loading="lazy" />
          ${badge}
        </a>`;
      })
      .join('');
  } catch (err) {
    console.warn('Instagram feed failed:', err.message);
  }
}

loadInstagramFeed();

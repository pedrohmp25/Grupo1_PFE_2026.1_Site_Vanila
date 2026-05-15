// ════════════════════════════════════════════════════════════
//  ACBrasil — Página de Artigos
//  Consome a REST API do WordPress: acbrasil.org.br/cms/wp-json/wp/v2
// ════════════════════════════════════════════════════════════

const API = 'https://acbrasil.org.br/cms/wp-json/wp/v2';
const PER_PAGE = 6;

// Estado da UI
const state = {
    page: 1,
    categoryId: null,
    search: '',
    featuredId: null,
    totalPages: 1,
    totalPosts: 0,
};

// ─── Utils ───
function stripHtml(html = '') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
}

function formatDate(iso) {
    const d = new Date(iso);
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function readingTime(html) {
    const words = stripHtml(html).split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}

function pickImage(post) {
    const media = post._embedded?.['wp:featuredmedia']?.[0];
    if (!media) return null;
    const sizes = media.media_details?.sizes || {};
    return sizes.medium_large?.source_url
        || sizes.large?.source_url
        || sizes.medium?.source_url
        || media.source_url
        || null;
}

function pickCategoryName(post) {
    // _embedded["wp:term"] é um array de arrays (cats, tags, etc.)
    const terms = post._embedded?.['wp:term']?.[0] || [];
    // ignora a categoria-mãe "Artigos"
    const sub = terms.find(t => t.slug !== 'artigos');
    return (sub || terms[0])?.name || 'Artigo';
}

function escapeHtml(str = '') {
    return str.replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

// ─── Carregamento de categorias ───
async function loadCategories() {
    try {
        const res = await fetch(`${API}/categories?per_page=20&hide_empty=true`);
        const cats = await res.json();
        const others = cats
            .filter(c => c.slug !== 'artigos' && c.count > 0)
            .sort((a, b) => b.count - a.count);
        renderFilterPills(others);
    } catch (err) {
        console.warn('Falha ao carregar categorias:', err);
    }
}

function renderFilterPills(categories) {
    const container = document.getElementById('filter-pills');
    // mantém o "Todos" e adiciona o resto
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-pill';
        btn.dataset.catId = cat.id;
        btn.textContent = cat.name;
        container.appendChild(btn);
    });
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-pill');
        if (!btn) return;
        container.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.categoryId = btn.dataset.catId || null;
        state.page = 1;
        loadPosts();
    });
}

// ─── Featured ───
async function loadFeatured() {
    try {
        const res = await fetch(`${API}/posts?per_page=1&_embed`);
        const posts = await res.json();
        if (posts.length) {
            state.featuredId = posts[0].id;
            renderFeatured(posts[0]);
        }
    } catch (err) {
        console.warn('Falha ao carregar destaque:', err);
    }
}

function renderFeatured(post) {
    const titleEls = document.querySelectorAll('[data-featured-title]');
    titleEls.forEach(el => el.innerHTML = post.title.rendered);

    document.querySelector('[data-featured-cat]').textContent = pickCategoryName(post);
    document.querySelector('[data-featured-excerpt]').textContent = stripHtml(post.excerpt.rendered).slice(0, 220) + '…';
    document.querySelector('[data-featured-meta]').textContent = `${formatDate(post.date)} · ${readingTime(post.content?.rendered || post.excerpt?.rendered)} min de leitura`;
    document.querySelector('[data-featured-link]').href = post.link;

    // imagem de fundo no featured-left
    const img = pickImage(post);
    if (img) {
        const left = document.querySelector('.featured-left');
        left.style.backgroundImage = `linear-gradient(135deg, rgba(15,15,61,0.85) 0%, rgba(30,30,107,0.85) 100%), url(${img})`;
        left.style.backgroundSize = 'cover';
        left.style.backgroundPosition = 'center';
    }
}

// ─── Lista paginada ───
async function loadPosts() {
    const grid = document.getElementById('publications-grid');
    grid.innerHTML = '<div class="grid-state">Carregando artigos…</div>';

    const params = new URLSearchParams({
        per_page: PER_PAGE,
        page: state.page,
        _embed: '1',
    });
    if (state.categoryId) params.append('categories', state.categoryId);
    if (state.search) params.append('search', state.search);
    if (state.featuredId && state.page === 1 && !state.search && !state.categoryId) {
        params.append('exclude', state.featuredId);
    }

    try {
        const res = await fetch(`${API}/posts?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        state.totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
        state.totalPosts = parseInt(res.headers.get('X-WP-Total') || '0', 10);

        const posts = await res.json();
        renderPosts(posts);
        renderPagination();
        updateStat();
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<div class="grid-state grid-state--error">Não foi possível carregar os artigos. Tente novamente em instantes.</div>';
        document.getElementById('pagination').innerHTML = '';
    }
}

function renderPosts(posts) {
    const grid = document.getElementById('publications-grid');
    if (!posts.length) {
        grid.innerHTML = '<div class="grid-state">Nenhum artigo encontrado.</div>';
        return;
    }
    grid.innerHTML = posts.map(cardHTML).join('');
    // re-aplica reveal nos novos cards
    grid.querySelectorAll('.pub-card').forEach((card, i) => {
        card.classList.add('reveal');
        setTimeout(() => card.classList.add('in'), 60 * i);
    });
}

function cardHTML(post) {
    const img = pickImage(post);
    const cat = pickCategoryName(post);
    const title = post.title.rendered;
    const excerpt = stripHtml(post.excerpt.rendered).slice(0, 140) + '…';
    const meta = `${formatDate(post.date)} · ${readingTime(post.content?.rendered || post.excerpt?.rendered)} min de leitura`;

    return `
        <article class="pub-card">
            <div class="pub-image">
                ${img ? `<img src="${img}" alt="${escapeHtml(stripHtml(title))}" loading="lazy">` : ''}
                <span class="pub-cat">${escapeHtml(cat)}</span>
            </div>
            <div class="pub-body">
                <span class="pub-meta">${meta}</span>
                <h3>${title}</h3>
                <p>${escapeHtml(excerpt)}</p>
                <a href="${post.link}" target="_blank" rel="noopener" class="read-link">Ler Artigo →</a>
            </div>
        </article>
    `;
}

// ─── Paginação ───
function renderPagination() {
    const nav = document.getElementById('pagination');
    if (state.totalPages <= 1) {
        nav.innerHTML = '';
        return;
    }

    // limita exibição de páginas (máx 5 + setas)
    const totalToShow = Math.min(state.totalPages, 5);
    let start = Math.max(1, state.page - 2);
    let end = Math.min(state.totalPages, start + totalToShow - 1);
    start = Math.max(1, end - totalToShow + 1);

    let html = '';
    if (state.page > 1) {
        html += `<button class="page-btn page-btn--arrow" data-page="${state.page - 1}" aria-label="Página anterior">←</button>`;
    }
    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === state.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (state.page < state.totalPages) {
        html += `<button class="page-btn page-btn--arrow" data-page="${state.page + 1}" aria-label="Próxima página">→</button>`;
    }
    nav.innerHTML = html;

    nav.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.page = parseInt(btn.dataset.page, 10);
            loadPosts();
            window.scrollTo({
                top: document.querySelector('.publications').offsetTop - 100,
                behavior: 'smooth'
            });
        });
    });
}

function updateStat() {
    const el = document.getElementById('stat-number');
    if (el && state.totalPosts) {
        el.textContent = state.totalPosts;
    }
}

// ─── Busca (com debounce) ───
function setupSearch() {
    const input = document.querySelector('.search-input');
    let timer;
    input?.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            state.search = e.target.value.trim();
            state.page = 1;
            loadPosts();
        }, 350);
    });
}

// ─── Scroll Reveal ───
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
});

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ─── Init ───
loadCategories();
loadFeatured();
loadPosts();
setupSearch();

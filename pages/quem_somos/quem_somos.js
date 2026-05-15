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


// ─── Conselheiros Fundadores: dados reais da API ───
const WP_API = 'https://acbrasil.org.br/cms/wp-json/wp/v2';

function pickPhoto(page) {
    const media = page._embedded?.['wp:featuredmedia']?.[0];
    if (!media) return null;
    const sizes = media.media_details?.sizes || {};
    return sizes.medium_large?.source_url
        || sizes.large?.source_url
        || sizes.medium?.source_url
        || media.source_url
        || null;
}

function escapeHtml(str = '') {
    return str.replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

function founderCardHTML(page) {
    const name = page.title.rendered;
    const photo = pickPhoto(page);
    const link = page.link;

    return `
        <a href="${link}" target="_blank" rel="noopener" class="qs-founder reveal">
            <div class="qs-founder-photo">
                ${photo ? `<img src="${photo}" alt="${escapeHtml(name.replace(/<[^>]+>/g, ''))}" loading="lazy">` : ''}
            </div>
            <span class="qs-founder-name">${name}</span>
            <span class="qs-founder-role">Conselheiro Fundador</span>
        </a>
    `;
}

async function carregarFundadores() {
    const grid = document.querySelector('.qs-founders-grid');
    if (!grid) return;

    try {
        const res = await fetch(`${WP_API}/pages?search=quem+somos&per_page=20&_embed=1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const pages = await res.json();

        // só páginas com foto destacada (são os conselheiros)
        const fundadores = pages.filter(p => p._embedded?.['wp:featuredmedia']?.[0]?.source_url);
        if (!fundadores.length) return;

        grid.innerHTML = fundadores.map(founderCardHTML).join('');

        // re-observa novos cards
        grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    } catch (err) {
        console.warn('Falha ao carregar fundadores:', err);
    }
}

carregarFundadores();

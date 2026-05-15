// ─── Hero Carousel ───
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-dot');
let current = 0;
let autoplay;

function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
}

function startAutoplay() {
    autoplay = setInterval(() => goTo(current + 1), 6000);
}

function resetAutoplay() {
    clearInterval(autoplay);
    startAutoplay();
}

document.querySelector('.hero-arrow--prev')?.addEventListener('click', () => {
    goTo(current - 1);
    resetAutoplay();
});

document.querySelector('.hero-arrow--next')?.addEventListener('click', () => {
    goTo(current + 1);
    resetAutoplay();
});

dots.forEach((dot, i) => dot.addEventListener('click', () => {
    goTo(i);
    resetAutoplay();
}));

startAutoplay();

// ─── Tabs ───
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        document.querySelectorAll('.cards-grid').forEach(grid => grid.classList.add('hidden'));
        document.getElementById('tab-' + tab)?.classList.remove('hidden');

        // re-anima os cards
        document.getElementById('tab-' + tab)?.classList.add('reveal');
        requestAnimationFrame(() => {
            document.getElementById('tab-' + tab)?.classList.add('in');
        });
    });
});



// ─── Mercado & Economia: dados ao vivo com sparklines dinâmicos ───
const BRAPI_TOKEN = 'aQoWsPKZnaKduAQmeybVWe';

// Helpers
function fmtBR(value, decimals = 2) {
    return parseFloat(value).toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function fmtDateShort(input) {
    // aceita unix-seconds (string ou number) ou ISO
    let d;
    if (typeof input === 'number') d = new Date(input * 1000);
    else if (/^\d+$/.test(input)) d = new Date(parseInt(input) * 1000);
    else d = new Date(input);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function setSkeleton(on) {
    document.querySelectorAll('.indicador, .chart-box').forEach(el => {
        el.classList.toggle('is-loading', on);
    });
}

// Renderiza sparkline a partir de valores reais
function renderSparkline(svgSelector, values, dates, positive) {
    const svg = document.querySelector(svgSelector);
    if (!svg || !values || values.length < 2) return;

    const W = 200, H = 60;
    const padY = 8;
    const drawH = H - padY * 2;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * W;
        const y = padY + (1 - (v - min) / range) * drawH;
        return [x, y];
    });

    const linePts = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const areaPts = `${linePts} ${W},${H} 0,${H}`;

    const color = positive ? '#16a34a' : '#dc2626';

    // Update polyline (linha)
    const line = svg.querySelector('polyline');
    if (line) {
        line.setAttribute('points', linePts);
        line.setAttribute('stroke', color);
    }

    // Update polygon (área preenchida)
    const area = svg.querySelector('polygon');
    if (area) area.setAttribute('points', areaPts);

    // Update gradient stops para casar com a cor
    svg.querySelectorAll('stop').forEach(s => s.setAttribute('stop-color', color));

    // Dot no último ponto
    let dot = svg.querySelector('.spark-dot');
    if (!dot) {
        const ns = 'http://www.w3.org/2000/svg';
        dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('class', 'spark-dot');
        dot.setAttribute('r', '3.5');
        dot.setAttribute('stroke', '#ffffff');
        dot.setAttribute('stroke-width', '2');
        svg.appendChild(dot);
    }
    const [lx, ly] = points[points.length - 1];
    dot.setAttribute('cx', lx);
    dot.setAttribute('cy', ly);
    dot.setAttribute('fill', color);

    // Update labels de data
    const labels = svg.parentElement.querySelector('.chart-labels');
    if (labels && dates && dates.length) {
        labels.innerHTML = dates.map(d => `<span>${d}</span>`).join('');
    }
}

function aplicarVariacaoBadge(el, valor) {
    if (!el) return;
    el.classList.remove('positive', 'negative', 'neutral');
    const num = parseFloat(valor);
    if (isNaN(num)) {
        el.classList.add('neutral');
        el.textContent = '—';
        return;
    }
    const str = Math.abs(num).toFixed(2).replace('.', ',');
    if (num > 0) {
        el.classList.add('positive');
        el.textContent = `▲ +${str}%`;
    } else if (num < 0) {
        el.classList.add('negative');
        el.textContent = `▼ -${str}%`;
    } else {
        el.classList.add('neutral');
        el.textContent = `— 0,00%`;
    }
}

async function carregarMercado() {
    try {
        const [usdNow, usdHist, ibovBundle, selicData] = await Promise.all([
            fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL').then(r => r.json()),
            fetch('https://economia.awesomeapi.com.br/json/daily/USD-BRL/7').then(r => r.json()),
            fetch(`https://brapi.dev/api/quote/%5EBVSP?range=5d&interval=1d&token=${BRAPI_TOKEN}`).then(r => r.json()),
            fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json').then(r => r.json()),
        ]);

        // ── USD/BRL ──
        const usd = usdNow.USDBRL;
        const usdPct = parseFloat(usd.pctChange);
        const usdEl = document.querySelectorAll('.indicador')[1];
        if (usdEl) {
            usdEl.querySelector('.ind-value').textContent = `R$ ${fmtBR(usd.bid, 2)}`;
            aplicarVariacaoBadge(usdEl.querySelector('.ind-change'), usdPct);
        }

        // Sparkline USD: histórico mais antigo → mais recente
        const usdValues = usdHist.map(d => parseFloat(d.bid)).reverse();
        const usdDates = usdHist.map(d => fmtDateShort(d.timestamp)).reverse();
        renderSparkline('.sparkline--red', usdValues, usdDates, usdPct >= 0);

        // ── IBOVESPA ──
        const ibov = ibovBundle.results?.[0];
        if (ibov) {
            const ibovEl = document.querySelectorAll('.indicador')[0];
            const ibovValor = Math.round(ibov.regularMarketPrice).toLocaleString('pt-BR');
            const ibovPct = parseFloat(ibov.regularMarketChangePercent);
            if (ibovEl) {
                ibovEl.querySelector('.ind-value').textContent = ibovValor;
                aplicarVariacaoBadge(ibovEl.querySelector('.ind-change'), ibovPct);
            }

            // Sparkline IBOV
            const hist = (ibov.historicalDataPrice || []).filter(h => h.close > 0);
            if (hist.length >= 2) {
                const ibovValues = hist.map(h => h.close);
                const ibovDates = hist.map(h => fmtDateShort(h.date));
                renderSparkline('.sparkline--green', ibovValues, ibovDates, ibovPct >= 0);
            }
        }

        // ── SELIC ──
        const selic = parseFloat(selicData[0].valor);
        const selicEl = document.querySelectorAll('.indicador')[2];
        if (selicEl) {
            selicEl.querySelector('.ind-value').textContent = `${fmtBR(selic, 2)}%`;
            const changeEl = selicEl.querySelector('.ind-change');
            if (changeEl) {
                changeEl.classList.remove('positive', 'negative', 'neutral');
                changeEl.classList.add('neutral');
                changeEl.textContent = 'Meta anual';
            }
        }

        // ── Timestamp ──
        const agora = new Date();
        const updateEl = document.querySelector('.mercado-update');
        if (updateEl) {
            updateEl.textContent = `Atualizado: ${agora.toLocaleDateString('pt-BR')}, ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }

        setSkeleton(false);

    } catch (err) {
        console.error('Erro ao carregar dados de mercado:', err);
        const updateEl = document.querySelector('.mercado-update');
        if (updateEl) updateEl.textContent = 'Indisponível no momento';
    }
}

setSkeleton(true);
carregarMercado();
// Atualiza a cada 5 minutos
setInterval(carregarMercado, 5 * 60 * 1000);


// ─── Artigos da Home: 3 posts mais recentes da API WP ───
const WP_API = 'https://acbrasil.org.br/cms/wp-json/wp/v2';
const CAT_ARTIGOS = 20; // categoria "Artigos" (exclui newsletters/notícias)

function stripTags(html = '') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
}

function pickImg(post) {
    const media = post._embedded?.['wp:featuredmedia']?.[0];
    if (!media) return null;
    const sizes = media.media_details?.sizes || {};
    return sizes.medium_large?.source_url
        || sizes.large?.source_url
        || sizes.medium?.source_url
        || media.source_url
        || null;
}

function pickCat(post) {
    const terms = post._embedded?.['wp:term']?.[0] || [];
    const sub = terms.find(t => t.slug !== 'artigos');
    return (sub || terms[0])?.name || 'Artigo';
}

function atualizarCardArtigo(card, post) {
    const imgUrl = pickImg(post);
    const cat = pickCat(post);
    const title = post.title.rendered;
    const excerpt = stripTags(post.excerpt.rendered).slice(0, 80) + '…';

    const img = card.querySelector('img');
    if (img && imgUrl) {
        img.src = imgUrl;
        img.alt = stripTags(title);
    }

    const tag = card.querySelector('.card-tag');
    if (tag) tag.textContent = cat;

    const h3 = card.querySelector('h3');
    if (h3) h3.innerHTML = title;

    const p = card.querySelector('p');
    if (p) p.textContent = excerpt;

    // torna o card clicável
    if (!card.dataset.linked) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.open(post.link, '_blank', 'noopener');
        });
        card.dataset.linked = '1';
    }
}

async function carregarArtigosHome() {
    const cards = document.querySelectorAll('#tab-artigos .card--photo');
    if (!cards.length) return;

    try {
        // "mais recentes" — qualquer tipo de post (artigos, newsletters, notícias)
        const res = await fetch(`${WP_API}/posts?per_page=3&_embed=1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const posts = await res.json();

        cards.forEach((card, i) => {
            if (posts[i]) atualizarCardArtigo(card, posts[i]);
        });
    } catch (err) {
        console.warn('Falha ao carregar artigos da home:', err);
    }
}

carregarArtigosHome();


// ─── Associados da Home: páginas /quem-somos/ com foto destacada ───
function pickPageImage(page) {
    const media = page._embedded?.['wp:featuredmedia']?.[0];
    if (!media) return null;
    const sizes = media.media_details?.sizes || {};
    return sizes.medium_large?.source_url
        || sizes.large?.source_url
        || sizes.medium?.source_url
        || media.source_url
        || null;
}

function atualizarCardAssociado(card, page) {
    const img = card.querySelector('img');
    const name = page.title.rendered;
    const photo = pickPageImage(page);
    const excerpt = stripTags(page.excerpt?.rendered || '');
    const bioShort = excerpt ? excerpt.slice(0, 90) + '…' : 'Conselheiro associado da ACBrasil';

    if (img && photo) {
        img.src = photo;
        img.alt = name;
    }

    const tag = card.querySelector('.card-tag');
    if (tag) tag.textContent = 'Conselheiro';

    const h3 = card.querySelector('h3');
    if (h3) h3.innerHTML = name;

    const p = card.querySelector('p');
    if (p) p.textContent = bioShort;

    if (!card.dataset.linked) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.open(page.link, '_blank', 'noopener');
        });
        card.dataset.linked = '1';
    }
}

async function carregarAssociadosHome() {
    const cards = document.querySelectorAll('#tab-associados .card--photo');
    if (!cards.length) return;

    try {
        // Páginas dos conselheiros (cada uma tem featured_media = foto real)
        const res = await fetch(`${WP_API}/pages?search=quem+somos&per_page=15&_embed=1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const pages = await res.json();

        // Filtra: precisa ter foto destacada
        const conselheiros = pages
            .filter(p => p._embedded?.['wp:featuredmedia']?.[0]?.source_url)
            .slice(0, 3);

        cards.forEach((card, i) => {
            if (conselheiros[i]) atualizarCardAssociado(card, conselheiros[i]);
        });
    } catch (err) {
        console.warn('Falha ao carregar associados:', err);
    }
}

carregarAssociadosHome();


// ─── Hero da Home: usa imagens reais dos 5 posts mais recentes como slides ───
// limpa srcs quebrados (placeholders inexistentes) antes do fetch carregar
document.querySelectorAll('.hero-image img').forEach(img => {
    if (img.src.includes('hero-')) img.removeAttribute('src');
});

async function carregarHeroImagens() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;

    try {
        const res = await fetch(`${WP_API}/posts?categories=${CAT_ARTIGOS}&per_page=5&_embed=1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const posts = await res.json();

        slides.forEach((slide, i) => {
            const post = posts[i];
            if (!post) return;
            const media = post._embedded?.['wp:featuredmedia']?.[0];
            const sizes = media?.media_details?.sizes || {};
            const url = sizes.large?.source_url
                || sizes.medium_large?.source_url
                || sizes.medium?.source_url
                || media?.source_url;

            const img = slide.querySelector('.hero-image img');
            if (img && url) {
                img.src = url;
                // mantém o alt institucional, mas adiciona contexto
                img.loading = 'lazy';
            }
        });
    } catch (err) {
        console.warn('Falha ao carregar imagens do hero:', err);
    }
}

carregarHeroImagens();
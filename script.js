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

// ─── Header shrink on scroll ───
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled > 20) {
        header?.style.setProperty('box-shadow', '0 1px 0 rgba(255,255,255,0.06), 0 12px 40px rgba(0,0,0,0.25)');
    } else {
        header?.style.setProperty('box-shadow', '0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.12)');
    }
    lastScroll = scrolled;
});

// ─── Mercado & Economia: dados ao vivo ───
async function carregarMercado() {
    try {
        // 1) USD/BRL — AwesomeAPI (sem CORS, sem chave)
        const usdPromise = fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
            .then(r => r.json());

        // 2) IBOVESPA — BrAPI (sem token funciona, com rate limit)
        const ibovPromise = fetch('https://brapi.dev/api/quote/%5EBVSP?token=aQoWsPKZnaKduAQmeybVWe')
            .then(r => r.json());

        // 3) SELIC meta — Banco Central (série 432)
        const selicPromise = fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json')
            .then(r => r.json());

        const [usdData, ibovData, selicData] = await Promise.all([
            usdPromise,
            ibovPromise,
            selicPromise
        
            
        ]);
        console.log('✅ USD/BRL:', usdData);
        console.log('✅ IBOVESPA:', ibovData);
        console.log('✅ SELIC:', selicData);

        // ── USD/BRL ──
        const usd = usdData.USDBRL;
        const usdValor = parseFloat(usd.bid).toFixed(2).replace('.', ',');
        const usdVar = parseFloat(usd.pctChange);
        atualizarIndicador(1, `R$ ${usdValor}`, usdVar);

        // ── IBOVESPA ──
        const ibov = ibovData.results[0];
        const ibovValor = Math.round(ibov.regularMarketPrice).toLocaleString('pt-BR');
        const ibovVar = ibov.regularMarketChangePercent;
        atualizarIndicador(0, ibovValor, ibovVar);

        // ── SELIC ──
        const selic = parseFloat(selicData[0].valor).toFixed(2).replace('.', ',');
        const selicEl = document.querySelectorAll('.indicador')[2];
        if (selicEl) {
            selicEl.querySelector('.ind-value').textContent = `${selic}%`;
        }

        // ── Atualiza o timestamp ──
        const agora = new Date();
        const data = agora.toLocaleDateString('pt-BR');
        const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const updateEl = document.querySelector('.mercado-update');
        if (updateEl) updateEl.textContent = `Atualizado: ${data}, ${hora}`;

    } catch (err) {
        console.error('Erro ao carregar dados de mercado:', err);
    }
}

function atualizarIndicador(idx, valor, variacao) {
    const indicadores = document.querySelectorAll('.indicador');
    const el = indicadores[idx];
    if (!el) return;

    el.querySelector('.ind-value').textContent = valor;

    const changeEl = el.querySelector('.ind-change');
    if (!changeEl) return;

    const varNum = parseFloat(variacao);
    const varStr = Math.abs(varNum).toFixed(2).replace('.', ',');

    changeEl.classList.remove('positive', 'negative', 'neutral');

    if (varNum > 0) {
        changeEl.classList.add('positive');
        changeEl.textContent = `▲ +${varStr}%`;
    } else if (varNum < 0) {
        changeEl.classList.add('negative');
        changeEl.textContent = `▼ -${varStr}%`;
    } else {
        changeEl.classList.add('neutral');
        changeEl.textContent = `— ${varStr}%`;
    }
}

carregarMercado();
// Atualiza a cada 5 minutos
setInterval(carregarMercado, 5 * 60 * 1000);
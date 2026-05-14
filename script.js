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

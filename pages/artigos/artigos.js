// ─── Filter pills ───
document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const cat = pill.dataset.cat;
        document.querySelectorAll('.pub-card').forEach(card => {
            const cardCat = card.querySelector('.pub-cat')?.textContent.toLowerCase();
            card.style.display = (cat === 'todos' || cardCat === cat) ? '' : 'none';
        });
    });
});

// ─── Search ───
const searchInput = document.querySelector('.search-input');
searchInput?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.pub-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
        const match = !term || title.includes(term) || desc.includes(term);
        card.style.display = match ? '' : 'none';
    });
});

// ─── Pagination ───
document.querySelectorAll('.page-btn:not(.page-btn--arrow)').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.scrollTo({ top: document.querySelector('.publications').offsetTop - 100, behavior: 'smooth' });
    });
});

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

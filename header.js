// ─── Hamburger toggle (compartilhado entre páginas) ───
(function () {
    const header = document.querySelector('.header');
    const hamburger = document.querySelector('.hamburger');
    if (!header || !hamburger) return;

    function setOpen(open) {
        header.classList.toggle('menu-open', open);
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        hamburger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    }

    hamburger.addEventListener('click', () => {
        setOpen(!header.classList.contains('menu-open'));
    });

    // Fecha ao clicar em link do drawer
    document.querySelectorAll('.mobile-drawer-nav a').forEach(a => {
        a.addEventListener('click', () => setOpen(false));
    });

    // Fecha com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });

    // Fecha ao redimensionar acima de 1024px
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) setOpen(false);
    });
})();

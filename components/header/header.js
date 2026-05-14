(function() {
    'use strict';

    /* Elementos */
    const hamburger  = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const headerNav  = document.getElementById('headerNav');

    if (!hamburger || !mobileMenu) return; // Verifica se os elementos existem

    /* Toggle do menu mobile */
    hamburger.addEventListener('click', function () {
    const isOpen = mobileMenu.classList.toggle('is-open');

        // Atualiza atributos de acessibilidade
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
        mobileMenu.setAttribute('aria-hidden', !isOpen);

        //Impede scroll quando o menu estiver aberto
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    /* Fechar menu ao clicar em um link */
    mobileMenu.querySelectorAll('.mobile-nav-link, .mobile-cta').forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });
    
    /* Fechar ao redimensionar para desktop*/
    window.addEventListener('resize', function () {
        if (window.innerWidth > 900) {
            closeMenu();
        }
    });

    function closeMenu() {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    /* Destacar link ativo pela URL atual */
    function setActiveLink() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

        // Seleciona links tanto do menu desktop quanto do mobile
        const allLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        
        allLinks.forEach(function (link) {
            const linkPath = link.getAttribute('href').split('/').pop();
            if (linkPath === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }  
        });
    }

    // Chama a função para definir o link ativo ao carregar a página
    setActiveLink();
})();
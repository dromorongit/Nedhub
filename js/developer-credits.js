(function () {
    const credits = document.createElement('div');
    credits.className = 'developer-credits';
    credits.innerHTML = `
        <a href="https://www.dromornarh.com/" target="_blank" rel="noopener noreferrer">
            <img src="assets/images/dhronetechlogo.jpg" alt="DhroneTech Solutions" class="developer-credits-logo">
            <p class="developer-credits-text">Developed by Dromor Narh for DhroneTech Solutions</p>
        </a>
    `;

    const footerBottom = document.querySelector('.footer-bottom');
    if (footerBottom) {
        footerBottom.insertAdjacentElement('afterend', credits);
    } else {
        const footer = document.querySelector('footer.footer');
        if (footer) {
            footer.insertAdjacentElement('beforeend', credits);
        } else {
            document.body.insertAdjacentElement('beforeend', credits);
        }
    }
})();

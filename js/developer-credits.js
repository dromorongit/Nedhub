(function () {
    const style = document.createElement('style');
    style.textContent = `
        .developer-credits {
            text-align: center;
            padding: 28px 16px 16px;
        }
        .developer-credits a {
            text-decoration: none;
            color: inherit;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            transition: opacity 0.3s ease;
        }
        .developer-credits a:hover {
            opacity: 0.7;
        }
        .developer-credits-logo {
            height: 36px;
            width: auto;
            border-radius: 4px;
            display: block;
        }
        .developer-credits-text {
            margin: 0;
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 500;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        @media (max-width: 375px) {
            .developer-credits-logo {
                height: 32px;
            }
            .developer-credits-text {
                font-size: 11px;
            }
        }
    `;
    document.head.appendChild(style);

    const credits = document.createElement('div');
    credits.className = 'developer-credits';
    credits.innerHTML = `
        <a href="https://www.dromornarh.com/" target="_blank" rel="noopener noreferrer">
            <img src="assets/images/dhronetechlogo.jpg" alt="DhroneTech Solutions" class="developer-credits-logo">
            <p class="developer-credits-text">Developed by Dromor Narh for DhroneTech Solutions</p>
        </a>
    `;

    const footer = document.querySelector('footer.footer');
    if (footer) {
        footer.insertAdjacentElement('afterend', credits);
    } else {
        document.body.insertAdjacentElement('beforeend', credits);
    }
})();

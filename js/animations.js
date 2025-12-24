export function initAnimations() {
    initHeroAnimations();
    initCardAnimations();
    initButtonAnimations();
    initScrollAnimations();
    initFormAnimations();
}
function initHeroAnimations() {
    const heroElements = document.querySelectorAll('.hero .animate-fade-in-up');
    heroElements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('visible');
        }, 200 * index);
    });
    createHeroParticles();
}
function createHeroParticles() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection)
        return;
    const particleContainer = document.createElement('div');
    particleContainer.className = 'hero-bg-animation';
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'hero-bg-particle';
        const size = Math.random() * 10 + 5;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = Math.random() * 3 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.top = `${top}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        particleContainer.appendChild(particle);
    }
    heroSection.appendChild(particleContainer);
}
function initCardAnimations() {
    const cards = document.querySelectorAll('.card, .service-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('card-hover');
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-hover');
        });
        card.addEventListener('touchstart', () => {
            card.classList.add('card-hover');
        });
        card.addEventListener('touchend', () => {
            setTimeout(() => {
                card.classList.remove('card-hover');
            }, 300);
        });
    });
}
function initButtonAnimations() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            createRippleEffect(button, e);
            button.classList.add('animate-pulse');
            setTimeout(() => {
                button.classList.remove('animate-pulse');
            }, 1000);
        });
        button.addEventListener('mouseenter', () => {
            button.classList.add('btn-hover');
        });
        button.addEventListener('mouseleave', () => {
            button.classList.remove('btn-hover');
        });
    });
}
function createRippleEffect(button, event) {
    const btn = button;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    const rect = btn.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => {
        ripple.remove();
    }, 600);
}
function initScrollAnimations() {
    const scrollElements = document.querySelectorAll('.scroll-animate');
    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend;
    };
    const displayScrollElement = (element) => {
        element.classList.add('visible');
    };
    const handleScrollAnimation = () => {
        scrollElements.forEach((element) => {
            if (elementInView(element, 1.25)) {
                displayScrollElement(element);
            }
        });
    };
    handleScrollAnimation();
    window.addEventListener('scroll', debounce(handleScrollAnimation, 50));
}
function initFormAnimations() {
    const forms = document.querySelectorAll('.form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                const parent = input.parentElement;
                if (parent) {
                    parent.classList.add('focused');
                }
            });
            input.addEventListener('blur', () => {
                const parent = input.parentElement;
                if (parent) {
                    parent.classList.remove('focused');
                }
            });
        });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            form.classList.add('form-submitting');
            setTimeout(() => {
                form.classList.remove('form-submitting');
                form.classList.add('form-success');
                const statusElement = form.querySelector('.form-status');
                if (statusElement) {
                    statusElement.textContent = 'Message sent successfully!';
                    statusElement.style.color = '#48BB78';
                }
                setTimeout(() => {
                    form.classList.remove('form-success');
                    if (statusElement) {
                        statusElement.textContent = '';
                    }
                    form.reset();
                }, 3000);
            }, 1500);
        });
    });
}
function debounce(func, wait = 100) {
    let timeout = null;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = window.setTimeout(later, wait);
    };
}
export { initHeroAnimations, createHeroParticles, initCardAnimations, initButtonAnimations, createRippleEffect, initScrollAnimations, initFormAnimations, debounce };
//# sourceMappingURL=animations.js.map
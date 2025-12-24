// Animations Module for Nedhub Website
// Handles all animations, micro-interactions, and visual effects

export function initAnimations(): void {
    // Initialize hero animations
    initHeroAnimations();

    // Initialize card hover animations
    initCardAnimations();

    // Initialize button ripple effects
    initButtonAnimations();

    // Initialize scroll-based animations
    initScrollAnimations();

    // Initialize form animations
    initFormAnimations();
}

// Hero section animations
function initHeroAnimations(): void {
    const heroElements = document.querySelectorAll('.hero .animate-fade-in-up');

    heroElements.forEach((element, index) => {
        // Stagger animations
        setTimeout(() => {
            element.classList.add('visible');
        }, 200 * index);
    });

    // Add particle background animation
    createHeroParticles();
}

// Create hero background particles
function createHeroParticles(): void {
    const heroSection = document.querySelector('.hero') as HTMLElement | null;
    if (!heroSection) return;

    const particleContainer = document.createElement('div');
    particleContainer.className = 'hero-bg-animation';

    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'hero-bg-particle';

        // Random positioning and sizing
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

// Card hover animations
function initCardAnimations(): void {
    const cards = document.querySelectorAll('.card, .service-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('card-hover');
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-hover');
        });

        // Add touch support for mobile
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

// Button ripple effects
function initButtonAnimations(): void {
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Create ripple effect
            createRippleEffect(button, e as MouseEvent);

            // Add pulse animation
            button.classList.add('animate-pulse');
            setTimeout(() => {
                button.classList.remove('animate-pulse');
            }, 1000);
        });

        // Add hover effects
        button.addEventListener('mouseenter', () => {
            button.classList.add('btn-hover');
        });

        button.addEventListener('mouseleave', () => {
            button.classList.remove('btn-hover');
        });
    });
}

// Create ripple effect on button click
function createRippleEffect(button: Element, event: MouseEvent): void {
    const btn = button as HTMLElement;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';

    // Position ripple at click location
    const rect = btn.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    btn.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Scroll-based animations
function initScrollAnimations(): void {
    const scrollElements = document.querySelectorAll('.scroll-animate');

    const elementInView = (el: HTMLElement, dividend: number = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend;
    };

    const displayScrollElement = (element: HTMLElement) => {
        element.classList.add('visible');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((element) => {
            if (elementInView(element as HTMLElement, 1.25)) {
                displayScrollElement(element as HTMLElement);
            }
        });
    };

    // Run once on load
    handleScrollAnimation();

    // Run on scroll with debounce
    window.addEventListener('scroll', debounce(handleScrollAnimation, 50) as EventListener);
}

// Form animations
function initFormAnimations(): void {
    const forms = document.querySelectorAll('.form');

    forms.forEach(form => {
        // Animate form fields on focus
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

        // Add form submission animation
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            form.classList.add('form-submitting');

            // Simulate form submission
            setTimeout(() => {
                form.classList.remove('form-submitting');
                form.classList.add('form-success');

                // Show success message
                const statusElement = form.querySelector('.form-status') as HTMLElement | null;
                if (statusElement) {
                    statusElement.textContent = 'Message sent successfully!';
                    statusElement.style.color = '#48BB78';
                }

                // Reset form after delay
                setTimeout(() => {
                    form.classList.remove('form-success');
                    if (statusElement) {
                        statusElement.textContent = '';
                    }
                    (form as HTMLFormElement).reset();
                }, 3000);
            }, 1500);
        });
    });
}

// Debounce function for scroll events
function debounce(func: Function, wait: number = 100): Function {
    let timeout: number | null = null;

    return function executedFunction(...args: any[]) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout as number);
        }

        timeout = window.setTimeout(later, wait);
    };
}

// Export animation functions for testing
export {
    initHeroAnimations,
    createHeroParticles,
    initCardAnimations,
    initButtonAnimations,
    createRippleEffect,
    initScrollAnimations,
    initFormAnimations,
    debounce
};
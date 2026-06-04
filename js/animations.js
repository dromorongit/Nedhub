export function initAnimations() {
    initHeroAnimations();
    initCardAnimations();
    initButtonAnimations();
    initScrollAnimations();
    initFormAnimations();
    initAnimatedCounters();
    initTestimonialCarousel();
}
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.counter-number');
    if (counters.length === 0)
        return;
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target') || '0');
                animateCounter(counter, target);
                counterObserver.unobserve(counter);
            }
        });
    }, observerOptions);
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}
function animateCounter(element, target) {
    const duration = 2000;
    const startTime = performance.now();
    const startValue = 0;
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);
        element.textContent = currentValue.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
        else {
            element.textContent = target.toLocaleString();
        }
    }
    requestAnimationFrame(updateCounter);
}
function initTestimonialCarousel() {
    const carousel = document.querySelector('.testimonials-carousel');
    if (!carousel)
        return;
    const track = carousel.querySelector('.testimonial-track');
    const cards = carousel.querySelectorAll('.testimonial-card');
    const prevBtn = carousel.querySelector('.prev-btn');
    const nextBtn = carousel.querySelector('.next-btn');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    if (!track || cards.length === 0)
        return;
    let currentIndex = 0;
    let autoPlayInterval = null;
    cards.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    function updateCarousel() {
        cards.forEach((card, index) => {
            card.classList.remove('active', 'prev');
            if (index === currentIndex) {
                card.classList.add('active');
            }
            else if (index === (currentIndex - 1 + cards.length) % cards.length) {
                card.classList.add('prev');
            }
        });
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }
    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
        resetAutoPlay();
    }
    function nextSlide() {
        currentIndex = (currentIndex + 1) % cards.length;
        updateCarousel();
        resetAutoPlay();
    }
    function prevSlide() {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        updateCarousel();
        resetAutoPlay();
    }
    function startAutoPlay() {
        autoPlayInterval = window.setInterval(nextSlide, 5000);
    }
    function resetAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
        startAutoPlay();
    }
    prevBtn === null || prevBtn === void 0 ? void 0 : prevBtn.addEventListener('click', prevSlide);
    nextBtn === null || nextBtn === void 0 ? void 0 : nextBtn.addEventListener('click', nextSlide);
    carousel.addEventListener('mouseenter', () => {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
    });
    carousel.addEventListener('mouseleave', startAutoPlay);
    let touchStartX = 0;
    let touchEndX = 0;
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            }
            else {
                prevSlide();
            }
        }
    }
    document.addEventListener('keydown', (e) => {
        if (carousel.getBoundingClientRect().top < window.innerHeight &&
            carousel.getBoundingClientRect().bottom > 0) {
            if (e.key === 'ArrowRight') {
                nextSlide();
            }
            else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        }
    });
    startAutoPlay();
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
    let scrollObserver = null;
    
    const handleIntersection = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Once visible, stop observing - never remove visibility
                scrollObserver.unobserve(entry.target);
            }
        });
    };
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    // Initialize IntersectionObserver
    scrollObserver = new IntersectionObserver(handleIntersection, observerOptions);
    
    // Observe all existing scroll-animate elements
    const observeElements = (container = document) => {
        const scrollElements = container.querySelectorAll('.scroll-animate:not(.visible)');
        scrollElements.forEach(element => {
            scrollObserver.observe(element);
        });
    };
    
    // Initial observation
    observeElements();
    
    // MutationObserver to handle dynamically added elements (jobs, API content)
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    // Skip elements that already have visible class (pre-rendered content)
                    if (node.classList && node.classList.contains('scroll-animate') && !node.classList.contains('visible')) {
                        scrollObserver.observe(node);
                    }
                    // Check for scroll-animate elements within added subtrees
                    const scrollElements = node.querySelectorAll && node.querySelectorAll('.scroll-animate:not(.visible)');
                    if (scrollElements) {
                        scrollElements.forEach(el => scrollObserver.observe(el));
                    }
                }
            });
        });
    });
    
    // Observe the entire document for added elements
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
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
export { initHeroAnimations, createHeroParticles, initCardAnimations, initButtonAnimations, createRippleEffect, initScrollAnimations, initFormAnimations, initAnimatedCounters, animateCounter, initTestimonialCarousel, debounce };
//# sourceMappingURL=animations.js.map
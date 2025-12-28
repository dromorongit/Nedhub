/**
 * Cookie Policy Modal
 * Handles the display of cookie policy on first visit
 * Professional implementation with smooth animations
 */

class CookieModal {
    constructor() {
        this.modal = null;
        this.acceptBtn = null;
        this.declineBtn = null;
        this.closeBtn = null;
        this.isVisible = false;
        this.storageKey = 'nedhub_cookie_accepted';
        this.cookieExpiry = 365; // days
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupModal());
        } else {
            this.setupModal();
        }
    }

    setupModal() {
        // Create modal HTML
        this.createModal();
        
        // Get modal elements
        this.modal = document.getElementById('cookieModal');
        this.acceptBtn = document.getElementById('acceptCookies');
        this.declineBtn = document.getElementById('declineCookies');
        this.closeBtn = document.getElementById('closeCookieModal');

        // Add event listeners
        this.addEventListeners();

        // Check if modal should be shown
        this.checkFirstVisit();
    }

    createModal() {
        const modalHTML = `
            <div class="cookie-modal" id="cookieModal">
                <div class="cookie-modal-content">
                    <div class="cookie-modal-header">
                        <h2 class="cookie-modal-title">🍪 Cookie Policy</h2>
                        <p class="cookie-modal-subtitle">We respect your privacy and want to be transparent about our cookie usage</p>
                        <button class="cookie-modal-close" id="closeCookieModal" aria-label="Close cookie policy">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="cookie-modal-body">
                        <div class="cookie-modal-description">
                            <p>This website uses cookies to enhance your browsing experience, analyze site traffic, and provide personalized content. By continuing to use our website, you consent to our use of cookies in accordance with this policy.</p>
                        </div>

                        <div class="cookie-modal-section">
                            <h3>What are cookies?</h3>
                            <p>Cookies are small text files that are stored on your device when you visit our website. They help us understand how you interact with our site and improve your experience.</p>
                        </div>

                        <div class="cookie-modal-section">
                            <h3>How we use cookies</h3>
                            <ul class="cookie-modal-list">
                                <li><strong>Essential cookies:</strong> Required for the website to function properly</li>
                                <li><strong>Analytics cookies:</strong> Help us understand site usage and improve performance</li>
                                <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
                                <li><strong>Marketing cookies:</strong> Used to deliver relevant advertisements</li>
                            </ul>
                        </div>

                        <div class="cookie-modal-section">
                            <h3>Managing your preferences</h3>
                            <p>You can control and manage cookies through your browser settings. However, disabling certain cookies may affect the functionality of our website.</p>
                        </div>
                    </div>

                    <div class="cookie-modal-footer">
                        <div class="cookie-modal-actions">
                            <button class="btn btn-secondary" id="declineCookies">Decline</button>
                            <button class="btn btn-primary" id="acceptCookies">Accept All</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    addEventListeners() {
        // Accept cookies button
        this.acceptBtn?.addEventListener('click', () => this.acceptCookies());

        // Decline cookies button
        this.declineBtn?.addEventListener('click', () => this.declineCookies());

        // Close button
        this.closeBtn?.addEventListener('click', () => this.hideModal());

        // Close on backdrop click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideModal();
            }
        });

        // Prevent body scroll when modal is open
        this.modal?.addEventListener('wheel', (e) => {
            if (this.isVisible) {
                e.preventDefault();
            }
        });
    }

    checkFirstVisit() {
        // Check if user has already made a cookie choice
        const cookieChoice = localStorage.getItem(this.storageKey);
        
        if (!cookieChoice) {
            // Show modal after a short delay for better UX
            setTimeout(() => {
                this.showModal();
            }, 1500);
        }
    }

    showModal() {
        if (this.modal && !this.isVisible) {
            this.modal.classList.add('show');
            this.isVisible = true;
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Focus management for accessibility
            this.acceptBtn?.focus();
            
            // Add animation class for smooth entrance
            setTimeout(() => {
                this.modal.querySelector('.cookie-modal-content')?.classList.add('animate-in');
            }, 100);
        }
    }

    hideModal() {
        if (this.modal && this.isVisible) {
            this.modal.classList.remove('show');
            this.isVisible = false;
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Remove animation class
            this.modal.querySelector('.cookie-modal-content')?.classList.remove('animate-in');
        }
    }

    acceptCookies() {
        this.setCookieChoice(true);
        this.hideModal();
        this.showConfirmation('Cookie preferences saved successfully!');
    }

    declineCookies() {
        this.setCookieChoice(false);
        this.hideModal();
        this.showConfirmation('Essential cookies will still be used for basic functionality.');
    }

    setCookieChoice(accepted) {
        const choiceData = {
            accepted: accepted,
            timestamp: new Date().toISOString(),
            expiry: new Date(Date.now() + (this.cookieExpiry * 24 * 60 * 60 * 1000)).toISOString()
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(choiceData));
        
        // Optional: Set a cookie for server-side tracking
        document.cookie = `nedhub_cookie_accepted=${accepted}; max-age=${this.cookieExpiry * 24 * 60 * 60}; path=/; SameSite=Strict`;
    }

    showConfirmation(message) {
        // Create a small toast notification
        const toast = document.createElement('div');
        toast.className = 'cookie-toast';
        toast.innerHTML = `
            <div class="cookie-toast-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;

        // Add toast styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, var(--accent-orange), #e67000)',
            color: 'var(--neutral-white)',
            padding: 'var(--space-md) var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            zIndex: '10001',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            transform: 'translateX(400px)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            backdropFilter: 'blur(10px)',
            maxWidth: '350px'
        });

        toast.querySelector('.cookie-toast-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: var(--space-sm);
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // Public method to reset cookie choice (for testing)
    resetChoice() {
        localStorage.removeItem(this.storageKey);
        document.cookie = 'nedhub_cookie_accepted=; max-age=0; path=/';
    }

    // Public method to check if cookies were accepted
    getCookieChoice() {
        try {
            const choice = localStorage.getItem(this.storageKey);
            return choice ? JSON.parse(choice) : null;
        } catch (e) {
            console.warn('Error reading cookie choice:', e);
            return null;
        }
    }
}

// Initialize cookie modal when script loads
const cookieModal = new CookieModal();

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CookieModal;
}
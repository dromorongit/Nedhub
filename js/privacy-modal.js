/**
 * Privacy Policy Modal
 * Handles the display of privacy policy when users click the footer link
 * Professional implementation with smooth animations and comprehensive content
 */

class PrivacyPolicyModal {
    constructor() {
        this.modal = null;
        this.closeBtn = null;
        this.isVisible = false;
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
        this.modal = document.getElementById('privacyPolicyModal');
        this.closeBtn = document.getElementById('closePrivacyModal');

        // Add event listeners
        this.addEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div class="privacy-modal" id="privacyPolicyModal">
                <div class="privacy-modal-content">
                    <div class="privacy-modal-header">
                        <h2 class="privacy-modal-title">🔒 Privacy Policy</h2>
                        <p class="privacy-modal-subtitle">Your privacy is important to us. Learn how we collect, use, and protect your information.</p>
                        <button class="privacy-modal-close" id="closePrivacyModal" aria-label="Close privacy policy">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="privacy-modal-body">
                        <div class="privacy-modal-section">
                            <h3>Last Updated: December 28, 2025</h3>
                            <p>This Privacy Policy describes how Nedhub Ghana ("we," "our," or "us") collects, uses, and protects your information when you visit our website or use our services.</p>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>Information We Collect</h3>
                            <ul class="privacy-modal-list">
                                <li><strong>Personal Information:</strong> Name, email address, phone number, and other contact details you provide</li>
                                <li><strong>Business Information:</strong> Company details, job titles, and professional information</li>
                                <li><strong>Website Usage Data:</strong> Pages visited, time spent on site, and browsing behavior</li>
                                <li><strong>Technical Information:</strong> IP address, browser type, device information, and cookies</li>
                            </ul>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>How We Use Your Information</h3>
                            <ul class="privacy-modal-list">
                                <li>To provide and improve our services</li>
                                <li>To communicate with you about our services and respond to inquiries</li>
                                <li>To send you marketing communications (with your consent)</li>
                                <li>To analyze website usage and improve user experience</li>
                                <li>To comply with legal obligations and protect our rights</li>
                            </ul>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>Information Sharing</h3>
                            <p>We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:</p>
                            <ul class="privacy-modal-list">
                                <li><strong>Service Providers:</strong> Trusted partners who help us operate our business</li>
                                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                                <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
                            </ul>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>Data Security</h3>
                            <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:</p>
                            <ul class="privacy-modal-list">
                                <li>SSL encryption for data transmission</li>
                                <li>Secure servers and databases</li>
                                <li>Regular security assessments</li>
                                <li>Access controls and authentication</li>
                                <li>Employee training on data protection</li>
                            </ul>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>Your Rights</h3>
                            <p>You have the following rights regarding your personal information:</p>
                            <ul class="privacy-modal-list">
                                <li><strong>Access:</strong> Request copies of your personal data</li>
                                <li><strong>Rectification:</strong> Request correction of inaccurate information</li>
                                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                                <li><strong>Objection:</strong> Object to processing of your personal data</li>
                                <li><strong>Restriction:</strong> Request limitation of processing</li>
                            </ul>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>Cookies and Tracking</h3>
                            <p>Our website uses cookies and similar tracking technologies to enhance your browsing experience. You can manage your cookie preferences through your browser settings. For more details, please see our <a href="#" id="viewCookiePolicy">Cookie Policy</a>.</p>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>Data Retention</h3>
                            <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. We will securely delete or anonymize your data when it is no longer needed.</p>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>International Transfers</h3>
                            <p>Your information may be transferred to and processed in countries other than Ghana. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.</p>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>Children's Privacy</h3>
                            <p>Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.</p>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>Changes to This Policy</h3>
                            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our services after any changes constitutes acceptance of the updated policy.</p>
                        </div>

                        <div class="privacy-modal-section">
                            <h3>Contact Us</h3>
                            <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
                            <div class="contact-info">
                                <p><strong>Nedhub Ghana</strong></p>
                                <p>📧 Email: privacy@nedhub.com</p>
                                <p>📞 Phone: +233 271 177 321</p>
                                <p>📍 Address: Roman Ridge, Accra, Ghana</p>
                            </div>
                        </div>
                    </div>

                    <div class="privacy-modal-footer">
                        <div class="privacy-modal-actions">
                            <button class="btn btn-primary" id="closePrivacyBtn">I Understand</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    addEventListeners() {
        // Close button
        this.closeBtn?.addEventListener('click', () => this.hideModal());

        // Close button in footer
        const closeBtnFooter = document.getElementById('closePrivacyBtn');
        closeBtnFooter?.addEventListener('click', () => this.hideModal());

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

        // View cookie policy link
        const cookiePolicyLink = document.getElementById('viewCookiePolicy');
        cookiePolicyLink?.addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger cookie modal if available
            if (window.cookieModal && typeof window.cookieModal.showModal === 'function') {
                this.hideModal();
                setTimeout(() => {
                    window.cookieModal.showModal();
                }, 300);
            }
        });

        // Prevent body scroll when modal is open
        this.modal?.addEventListener('wheel', (e) => {
            if (this.isVisible) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    showModal() {
        if (this.modal && !this.isVisible) {
            this.modal.classList.add('show');
            this.isVisible = true;
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Focus management for accessibility
            this.closeBtn?.focus();
            
            // Add animation class for smooth entrance
            setTimeout(() => {
                this.modal.querySelector('.privacy-modal-content')?.classList.add('animate-in');
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
            this.modal.querySelector('.privacy-modal-content')?.classList.remove('animate-in');
        }
    }
}

// Initialize privacy policy modal when script loads
const privacyPolicyModal = new PrivacyPolicyModal();

// Make it globally available
window.privacyPolicyModal = privacyPolicyModal;

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrivacyPolicyModal;
}
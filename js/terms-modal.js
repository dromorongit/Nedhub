/**
 * Terms of Service Modal
 * Handles the display of Terms of Service when users click the footer link
 * Professional implementation with smooth animations and comprehensive content
 */

class TermsOfServiceModal {
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
        this.modal = document.getElementById('termsOfServiceModal');
        this.closeBtn = document.getElementById('closeTermsModal');

        // Add event listeners
        this.addEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div class="terms-modal" id="termsOfServiceModal">
                <div class="terms-modal-content">
                    <div class="terms-modal-header">
                        <h2 class="terms-modal-title">📜 Terms of Service</h2>
                        <p class="terms-modal-subtitle">Please read these terms carefully before using our services.</p>
                        <button class="terms-modal-close" id="closeTermsModal" aria-label="Close Terms of Service">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="terms-modal-body">
                        <div class="terms-modal-section">
                            <h3>Last Updated: December 28, 2025</h3>
                            <p>These Terms of Service ("Terms") govern your access to and use of Nedhub Ghana's website and services. By accessing or using our services, you agree to be bound by these Terms.</p>
                        </div>

                        <div class="terms-modal-section">
                            <h3>1. Acceptance of Terms</h3>
                            <p>By accessing and using our website and services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.</p>
                        </div>

                        <div class="terms-modal-section">
                            <h3>2. Description of Services</h3>
                            <p>Nedhub Ghana provides the following corporate solutions:</p>
                            <ul class="terms-modal-list">
                                <li><strong>Recruitment & Talent Acquisition:</strong> Comprehensive recruitment services to help you find the right talent</li>
                                <li><strong>Staff Outsourcing & Placement:</strong> Professional staffing solutions for your business needs</li>
                                <li><strong>Training & Capacity Building:</strong> Customized training programs for skill development</li>
                                <li><strong>Career Guidance & Coaching:</strong> Professional career development services</li>
                                <li><strong>Data Analytics:</strong> Advanced data analysis and business intelligence</li>
                                <li><strong>Bulk SMS & Communication:</strong> Business communication solutions</li>
                            </ul>
                        </div>

                        <div class="terms-modal-section">
                            <h3>3. User Responsibilities</h3>
                            <p>When using our services, you agree to:</p>
                            <ul class="terms-modal-list">
                                <li>Provide accurate and complete information when requested</li>
                                <li>Use our services only for lawful purposes</li>
                                <li>Respect the intellectual property rights of Nedhub and third parties</li>
                                <li>Maintain the confidentiality of any account credentials</li>
                                <li>Not engage in any activity that may harm our systems or other users</li>
                                <li>Comply with all applicable laws and regulations</li>
                            </ul>
                        </div>

                        <div class="terms-modal-section">
                            <h3>4. Intellectual Property</h3>
                            <p>All content on our website, including but not limited to text, graphics, logos, images, and software, is the property of Nedhub Ghana and is protected by copyright, trademark, and other intellectual property laws. You may not:</p>
                            <ul class="terms-modal-list">
                                <li>Copy, modify, or distribute our content without permission</li>
                                <li>Use our trademarks or logos without written consent</li>
                                <li>Reverse engineer or attempt to extract source code</li>
                                <li>Create derivative works based on our content</li>
                            </ul>
                        </div>

                        <div class="terms-modal-section">
                            <h3>5. Service Agreements</h3>
                            <p>Specific services may be subject to additional terms and conditions outlined in separate service agreements. These additional terms will be provided to you before you engage our services and will form part of your contractual relationship with Nedhub Ghana.</p>
                        </div>

                        <div class="terms-modal-section">
                            <h3>6. Payment Terms</h3>
                            <p>For paid services:</p>
                            <ul class="terms-modal-list">
                                <li>Payment terms will be specified in your service agreement</li>
                                <li>All fees are quoted in Ghanaian Cedis (GHS) unless otherwise specified</li>
                                <li>Late payments may incur additional charges as outlined in your agreement</li>
                                <li>Refund policies are governed by individual service agreements</li>
                            </ul>
                        </div>

                        <div class="terms-modal-section">
                            <h3>7. Confidentiality</h3>
                            <p>We understand the importance of confidentiality in business relationships. Both parties agree to:</p>
                            <ul class="terms-modal-list">
                                <li>Protect confidential information shared during the course of services</li>
                                <li>Use confidential information only for agreed purposes</li>
                                <li>Not disclose confidential information to third parties without consent</li>
                                <li>Return or destroy confidential materials upon request</li>
                            </ul>
                        </div>

                        <div class="terms-modal-section">
                            <h3>8. Limitation of Liability</h3>
                            <p>To the maximum extent permitted by law:</p>
                            <ul class="terms-modal-list">
                                <li>Nedhub Ghana shall not be liable for any indirect, incidental, special, or consequential damages</li>
                                <li>Our total liability shall not exceed the fees paid for the specific service in question</li>
                                <li>We make no warranties regarding the outcomes of our services</li>
                                <li>You use our services at your own risk</li>
                            </ul>
                        </div>

                        <div class="terms-modal-section">
                            <h3>9. Indemnification</h3>
                            <p>You agree to indemnify, defend, and hold harmless Nedhub Ghana, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our services or violation of these Terms.</p>
                        </div>

                        <div class="terms-modal-section">
                            <h3>10. Termination</h3>
                            <p>Either party may terminate the service relationship:</p>
                            <ul class="terms-modal-list">
                                <li>With written notice as specified in the service agreement</li>
                                <li>Immediately upon material breach by the other party</li>
                                <li>Upon mutual agreement</li>
                            </ul>
                            <p>Termination does not affect any rights or obligations accrued prior to termination.</p>
                        </div>

                        <div class="terms-modal-section">
                            <h3>11. Dispute Resolution</h3>
                            <p>Any disputes arising from these Terms or our services shall be:</p>
                            <ul class="terms-modal-list">
                                <li>First attempted to be resolved through good faith negotiation</li>
                                <li>If unresolved, submitted to mediation in Accra, Ghana</li>
                                <li>If still unresolved, subject to the exclusive jurisdiction of the courts of Ghana</li>
                            </ul>
                        </div>

                        <div class="terms-modal-section">
                            <h3>12. Governing Law</h3>
                            <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of Ghana, without regard to its conflict of law provisions.</p>
                        </div>

                        <div class="terms-modal-section">
                            <h3>13. Changes to Terms</h3>
                            <p>Nedhub Ghana reserves the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on our website. Your continued use of our services after such changes constitutes acceptance of the new Terms.</p>
                        </div>

                        <div class="terms-modal-section">
                            <h3>14. Severability</h3>
                            <p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall continue in full force and effect.</p>
                        </div>

                        <div class="terms-modal-section">
                            <h3>15. Contact Information</h3>
                            <p>For questions about these Terms of Service, please contact us:</p>
                            <div class="terms-contact-info">
                                <p><strong>Nedhub Ghana</strong></p>
                                <p>📧 Email: legal@nedhub.com</p>
                                <p>📞 Phone: +233 271 177 321</p>
                                <p>📍 Address: Roman Ridge, Accra, Ghana</p>
                            </div>
                        </div>
                    </div>

                    <div class="terms-modal-footer">
                        <div class="terms-modal-actions">
                            <button class="btn btn-primary" id="closeTermsBtn">I Accept</button>
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
        const closeBtnFooter = document.getElementById('closeTermsBtn');
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

        // Listen for Terms of Service link clicks in footer
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.textContent.trim() === 'Terms of Service') {
                e.preventDefault();
                this.showModal();
            }
        });
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
                this.modal.querySelector('.terms-modal-content')?.classList.add('animate-in');
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
            this.modal.querySelector('.terms-modal-content')?.classList.remove('animate-in');
        }
    }
}

// Initialize Terms of Service modal when script loads
const termsOfServiceModal = new TermsOfServiceModal();

// Make it globally available
window.termsOfServiceModal = termsOfServiceModal;

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TermsOfServiceModal;
}

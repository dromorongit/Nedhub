// Contact Page Enhanced Functionality
// Modern, professional contact page interactions

class ContactPage {
    constructor() {
        this.init();
    }

    init() {
        this.initFAQ();
        this.initFormEnhancements();
        this.initScrollAnimations();
        this.initContactCardInteractions();
        this.initMapInteractions();
    }

    // FAQ Section Functionality
    initFAQ() {
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            const icon = item.querySelector('.faq-icon');

            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other FAQ items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        const otherIcon = otherItem.querySelector('.faq-icon');
                        otherAnswer.style.display = 'none';
                        otherIcon.style.transform = 'rotate(0deg)';
                    }
                });

                // Toggle current item
                if (isActive) {
                    item.classList.remove('active');
                    answer.style.display = 'none';
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    item.classList.add('active');
                    answer.style.display = 'block';
                    icon.style.transform = 'rotate(45deg)';
                }
            });

            // Add hover effects
            question.addEventListener('mouseenter', () => {
                if (!item.classList.contains('active')) {
                    question.style.background = 'linear-gradient(135deg, rgba(247, 127, 0, 0.08), rgba(11, 19, 43, 0.03))';
                }
            });

            question.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) {
                    question.style.background = 'linear-gradient(135deg, rgba(247, 127, 0, 0.02), rgba(11, 19, 43, 0.01))';
                }
            });
        });
    }

    // Form Enhancement Features
    initFormEnhancements() {
        const form = document.getElementById('contactForm');
        const inputs = form.querySelectorAll('input, textarea');
        const submitBtn = form.querySelector('.btn-submit');

        // Enhanced input focus effects
        inputs.forEach(input => {
            // Add floating label effect
            const label = form.querySelector(`label[for="${input.id}"]`);
            
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
                this.addInputAnimation(input);
            });

            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
                if (input.value === '') {
                    input.parentElement.classList.remove('has-value');
                } else {
                    input.parentElement.classList.add('has-value');
                }
            });

            // Real-time validation
            input.addEventListener('input', () => {
                this.validateField(input);
                this.updateInputStyle(input);
            });
        });

        // Enhanced form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission(form, submitBtn);
        });
    }

    // Input validation and styling
    validateField(input) {
        const value = input.value.trim();
        const fieldGroup = input.parentElement;
        let isValid = true;
        let errorMessage = '';

        // Remove existing error styles
        fieldGroup.classList.remove('error', 'success');

        // Required field validation
        if (input.hasAttribute('required') && value === '') {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (input.type === 'email' && value !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        // Phone validation (if provided)
        if (input.type === 'tel' && value !== '') {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        // Apply validation styles
        if (isValid && value !== '') {
            fieldGroup.classList.add('success');
            this.showFieldMessage(fieldGroup, '✓', 'success');
        } else if (!isValid) {
            fieldGroup.classList.add('error');
            this.showFieldMessage(fieldGroup, errorMessage, 'error');
        }

        return isValid;
    }

    // Show field validation messages
    showFieldMessage(fieldGroup, message, type) {
        let messageElement = fieldGroup.querySelector('.field-message');
        
        if (!messageElement) {
            messageElement = document.createElement('span');
            messageElement.className = 'field-message';
            fieldGroup.appendChild(messageElement);
        }

        messageElement.textContent = message;
        messageElement.className = `field-message ${type}`;
    }

    // Add input focus animations
    addInputAnimation(input) {
        input.style.transform = 'translateY(-2px)';
        input.style.boxShadow = '0 8px 25px rgba(247, 127, 0, 0.15)';
    }

    // Update input styling based on validation
    updateInputStyle(input) {
        const fieldGroup = input.parentElement;
        
        if (fieldGroup.classList.contains('error')) {
            input.style.borderColor = '#EF4444';
            input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        } else if (fieldGroup.classList.contains('success')) {
            input.style.borderColor = '#10B981';
            input.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
        } else {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }
    }

    // Handle form submission
    async handleFormSubmission(form, submitBtn) {
        const formData = new FormData(form);
        const formObject = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            formObject[key] = value;
        }

        // Validate all fields
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showFormMessage(form, 'Please fix the errors above', 'error');
            return;
        }

        // Show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Sending...';
        submitBtn.disabled = true;

        try {
            // Simulate form submission (replace with actual endpoint)
            await this.simulateFormSubmission(formObject);
            
            this.showFormMessage(form, 'Thank you! Your message has been sent successfully.', 'success');
            form.reset();
            
            // Reset all field states
            inputs.forEach(input => {
                input.parentElement.classList.remove('error', 'success', 'has-value');
                input.style.borderColor = '';
                input.style.boxShadow = '';
                const messageElement = input.parentElement.querySelector('.field-message');
                if (messageElement) {
                    messageElement.remove();
                }
            });

        } catch (error) {
            this.showFormMessage(form, 'Sorry, there was an error sending your message. Please try again.', 'error');
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Simulate form submission (replace with actual implementation)
    simulateFormSubmission(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate success (you can add random failure for testing)
                if (Math.random() > 0.1) { // 90% success rate
                    resolve({ success: true });
                } else {
                    reject(new Error('Submission failed'));
                }
            }, 2000);
        });
    }

    // Show form-level messages
    showFormMessage(form, message, type) {
        let statusElement = document.getElementById('form-status');
        
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'form-status';
            form.appendChild(statusElement);
        }

        statusElement.textContent = message;
        statusElement.className = `form-status ${type}`;
        statusElement.style.display = 'block';

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }
    }

    // Scroll animations for contact elements
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animateElements = document.querySelectorAll(`
            .contact-item,
            .social-card,
            .faq-item,
            .benefit-card,
            .map-container,
            .contact-form,
            .contact-info
        `);

        animateElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 0.1}s`;
            observer.observe(el);
        });

        // Add CSS for animation
        const style = document.createElement('style');
        style.textContent = `
            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
            
            .field-message {
                font-size: 0.875rem;
                margin-top: 0.5rem;
                display: block;
                transition: all 0.3s ease;
            }
            
            .field-message.success {
                color: #10B981;
            }
            
            .field-message.error {
                color: #EF4444;
            }
            
            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .form-group.focused label {
                color: var(--accent-orange);
                transform: translateY(-2px);
            }
            
            .form-group.has-value label {
                font-size: 0.875rem;
                color: var(--text-light);
            }
        `;
        document.head.appendChild(style);
    }

    // Enhanced contact card interactions
    initContactCardInteractions() {
        const contactItems = document.querySelectorAll('.contact-item');
        
        contactItems.forEach(item => {
            const icon = item.querySelector('.contact-icon');
            
            item.addEventListener('mouseenter', () => {
                // Add ripple effect
                this.createRippleEffect(item, event);
            });

            // Add click handlers for interactive elements
            const links = item.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    if (link.href.startsWith('tel:')) {
                        this.trackPhoneClick(link.textContent.trim());
                    } else if (link.href.startsWith('mailto:')) {
                        this.trackEmailClick(link.textContent.trim());
                    }
                });
            });
        });
    }

    // Create ripple effect on contact items
    createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
        
        // Add ripple CSS
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                .contact-item {
                    position: relative;
                    overflow: hidden;
                }
                
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(247, 127, 0, 0.2);
                    transform: scale(0);
                    animation: ripple-animation 0.6s linear;
                    pointer-events: none;
                }
                
                @keyframes ripple-animation {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Map interaction enhancements
    initMapInteractions() {
        const mapContainer = document.querySelector('.map-container');
        const mapPlaceholder = document.querySelector('.map-placeholder');
        
        if (mapPlaceholder) {
            mapPlaceholder.addEventListener('mouseenter', () => {
                const mapIcon = mapPlaceholder.querySelector('.map-icon');
                if (mapIcon) {
                    mapIcon.style.transform = 'scale(1.2) rotate(15deg)';
                }
            });
            
            mapPlaceholder.addEventListener('mouseleave', () => {
                const mapIcon = mapPlaceholder.querySelector('.map-icon');
                if (mapIcon) {
                    mapIcon.style.transform = 'scale(1) rotate(0deg)';
                }
            });
            
            // Add click handler for map interaction
            mapPlaceholder.addEventListener('click', () => {
                this.handleMapClick();
            });
        }
    }

    // Handle map click interactions
    handleMapClick() {
        // You can integrate with actual map services here
        const address = 'Roman Ridge, Accra, Ghana';
        const encodedAddress = encodeURIComponent(address);
        
        // Open in Google Maps (you can customize this)
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        window.open(googleMapsUrl, '_blank');
        
        // Track map interaction
        this.trackMapClick(address);
    }

    // Analytics tracking methods
    trackPhoneClick(phoneNumber) {
        console.log('Phone number clicked:', phoneNumber);
        // Add your analytics tracking here
    }

    trackEmailClick(email) {
        console.log('Email clicked:', email);
        // Add your analytics tracking here
    }

    trackMapClick(address) {
        console.log('Map clicked for address:', address);
        // Add your analytics tracking here
    }

    trackFormSubmission(formData) {
        console.log('Form submitted with data:', formData);
        // Add your analytics tracking here
    }
}

// Initialize contact page functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactPage();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContactPage;
}
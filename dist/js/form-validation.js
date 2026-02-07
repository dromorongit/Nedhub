// Form Validation Module for Nedhub Website
// Handles client-side form validation with TypeScript

export function initFormValidation(): void {
    const contactForm = document.getElementById('contactForm') as HTMLFormElement | null;
    if (!contactForm) return;

    // Set up form validation
    setupFormValidation(contactForm);

    // Set up real-time field validation
    setupRealTimeValidation(contactForm);
}

// Set up form validation
function setupFormValidation(form: HTMLFormElement): void {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (validateForm(form)) {
            // Form is valid, show success and submit
            showFormSuccess(form);
            
            // In a real application, you would send the data to a server here
            // For this demo, we'll just show a success message
            console.log('Form data:', getFormData(form));
        }
    });
}

// Validate entire form
function validateForm(form: HTMLFormElement): boolean {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        const fieldElement = field as HTMLInputElement | HTMLTextAreaElement;
        if (!validateField(fieldElement)) {
            isValid = false;
            showFieldError(fieldElement, getErrorMessage(fieldElement));
        } else {
            clearFieldError(fieldElement);
        }
    });

    // Validate email format specifically
    const emailField = form.querySelector('input[type="email"]') as HTMLInputElement | null;
    if (emailField && emailField.value) {
        if (!validateEmail(emailField.value)) {
            isValid = false;
            showFieldError(emailField, 'Please enter a valid email address');
        }
    }

    return isValid;
}

// Validate individual field
function validateField(field: HTMLInputElement | HTMLTextAreaElement): boolean {
    if (field.hasAttribute('required') && !field.value.trim()) {
        return false;
    }

    if (field.type === 'email' && field.value && !validateEmail(field.value)) {
        return false;
    }

    return true;
}

// Validate email format
function validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
}

// Get appropriate error message for field
function getErrorMessage(field: HTMLInputElement | HTMLTextAreaElement): string {
    if (field.hasAttribute('required') && !field.value.trim()) {
        return 'This field is required';
    }

    if (field.type === 'email') {
        return 'Please enter a valid email address';
    }

    return 'Please fill in this field correctly';
}

// Show field error
function showFieldError(field: HTMLInputElement | HTMLTextAreaElement, message: string): void {
    const formGroup = field.closest('.form-group') as HTMLElement | null;
    if (!formGroup) return;

    formGroup.classList.add('error');
    
    const errorElement = formGroup.querySelector('.error-message') as HTMLElement | null;
    if (errorElement) {
        errorElement.textContent = message;
    }

    // Add aria-invalid attribute for accessibility
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', `${field.id}-error`);
}

// Clear field error
function clearFieldError(field: HTMLInputElement | HTMLTextAreaElement): void {
    const formGroup = field.closest('.form-group') as HTMLElement | null;
    if (!formGroup) return;

    formGroup.classList.remove('error');
    
    const errorElement = formGroup.querySelector('.error-message') as HTMLElement | null;
    if (errorElement) {
        errorElement.textContent = '';
    }

    // Remove aria-invalid attribute
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
}

// Set up real-time validation
function setupRealTimeValidation(form: HTMLFormElement): void {
    const fields = form.querySelectorAll('input, textarea');

    fields.forEach(field => {
        const fieldElement = field as HTMLInputElement | HTMLTextAreaElement;

        fieldElement.addEventListener('input', () => {
            validateField(fieldElement);
            if (validateField(fieldElement)) {
                clearFieldError(fieldElement);
            }
        });

        fieldElement.addEventListener('blur', () => {
            if (fieldElement.hasAttribute('required') && !fieldElement.value.trim()) {
                showFieldError(fieldElement, getErrorMessage(fieldElement));
            } else if (fieldElement.type === 'email' && fieldElement.value && !validateEmail(fieldElement.value)) {
                showFieldError(fieldElement, 'Please enter a valid email address');
            } else {
                clearFieldError(fieldElement);
            }
        });

        // Add focus animation
        fieldElement.addEventListener('focus', () => {
            fieldElement.style.transform = 'translateY(-2px)';
            fieldElement.style.boxShadow = '0 0 0 2px rgba(247, 127, 0, 0.1)';
        });

        fieldElement.addEventListener('blur', () => {
            fieldElement.style.transform = '';
            fieldElement.style.boxShadow = '';
        });
    });
}

// Show form success state
function showFormSuccess(form: HTMLFormElement): void {
    const statusElement = form.querySelector('.form-status') as HTMLElement | null;
    const submitButton = form.querySelector('.btn-submit') as HTMLButtonElement | null;

    if (statusElement) {
        statusElement.textContent = 'Sending your message...';
        statusElement.style.color = '#48BB78';
        statusElement.classList.add('visible');
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
    }

    // Simulate successful submission
    setTimeout(() => {
        if (statusElement) {
            statusElement.textContent = 'Message sent successfully! We will get back to you soon.';
            statusElement.style.color = '#48BB78';
        }

        if (submitButton) {
            submitButton.textContent = 'Message Sent';
        }

        // Reset form after delay
        setTimeout(() => {
            form.reset();
            if (statusElement) {
                statusElement.textContent = '';
                statusElement.classList.remove('visible');
            }
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Send Message';
            }
        }, 5000);
    }, 1500);
}

// Get form data as object
function getFormData(form: HTMLFormElement): Record<string, string> {
    const formData = new FormData(form);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
        data[key] = value as string;
    });

    return data;
}

// Export validation functions for testing
export {
    validateForm,
    validateField,
    validateEmail,
    showFieldError,
    clearFieldError,
    getFormData
};
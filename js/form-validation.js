export function initFormValidation() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm)
        return;
    setupFormValidation(contactForm);
    setupRealTimeValidation(contactForm);
}
function setupFormValidation(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateForm(form)) {
            showFormSuccess(form);
            console.log('Form data:', getFormData(form));
        }
    });
}
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        const fieldElement = field;
        if (!validateField(fieldElement)) {
            isValid = false;
            showFieldError(fieldElement, getErrorMessage(fieldElement));
        }
        else {
            clearFieldError(fieldElement);
        }
    });
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value) {
        if (!validateEmail(emailField.value)) {
            isValid = false;
            showFieldError(emailField, 'Please enter a valid email address');
        }
    }
    return isValid;
}
function validateField(field) {
    if (field.hasAttribute('required') && !field.value.trim()) {
        return false;
    }
    if (field.type === 'email' && field.value && !validateEmail(field.value)) {
        return false;
    }
    return true;
}
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
}
function getErrorMessage(field) {
    if (field.hasAttribute('required') && !field.value.trim()) {
        return 'This field is required';
    }
    if (field.type === 'email') {
        return 'Please enter a valid email address';
    }
    return 'Please fill in this field correctly';
}
function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    if (!formGroup)
        return;
    formGroup.classList.add('error');
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = message;
    }
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', `${field.id}-error`);
}
function clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup)
        return;
    formGroup.classList.remove('error');
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = '';
    }
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
}
function setupRealTimeValidation(form) {
    const fields = form.querySelectorAll('input, textarea');
    fields.forEach(field => {
        const fieldElement = field;
        fieldElement.addEventListener('input', () => {
            validateField(fieldElement);
            if (validateField(fieldElement)) {
                clearFieldError(fieldElement);
            }
        });
        fieldElement.addEventListener('blur', () => {
            if (fieldElement.hasAttribute('required') && !fieldElement.value.trim()) {
                showFieldError(fieldElement, getErrorMessage(fieldElement));
            }
            else if (fieldElement.type === 'email' && fieldElement.value && !validateEmail(fieldElement.value)) {
                showFieldError(fieldElement, 'Please enter a valid email address');
            }
            else {
                clearFieldError(fieldElement);
            }
        });
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
function showFormSuccess(form) {
    const statusElement = form.querySelector('.form-status');
    const submitButton = form.querySelector('.btn-submit');
    if (statusElement) {
        statusElement.textContent = 'Sending your message...';
        statusElement.style.color = '#48BB78';
        statusElement.classList.add('visible');
    }
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
    }
    setTimeout(() => {
        if (statusElement) {
            statusElement.textContent = 'Message sent successfully! We will get back to you soon.';
            statusElement.style.color = '#48BB78';
        }
        if (submitButton) {
            submitButton.textContent = 'Message Sent';
        }
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
function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    return data;
}
export { validateForm, validateField, validateEmail, showFieldError, clearFieldError, getFormData };
//# sourceMappingURL=form-validation.js.map
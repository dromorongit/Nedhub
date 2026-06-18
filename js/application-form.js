/**
 * Application Form Module
 * Handles job application submission with Cloudinary integration and Brevo email backend
 */

// Configuration
const CONFIG = {
    cloudinary: {
        cloudName: 'ddohto2tl',
        uploadPreset: 'nedhub_careers_unsigned'
    },
    maxFileSize: 5 * 1024 * 1024, // 5MB
    validTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    // API endpoint for career applications
    // Update this to your backend URL when deploying
    apiEndpoint: 'https://nedhub-production.up.railway.app/api/careers/apply'
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initApplicationForm();
});

// Initialize application form
function initApplicationForm() {
    // Setup file uploads
    setupFileUpload('cvFile', 'cvDropZone', 'cvPreview', 'cvFileName', 'cvFileSize');
    setupFileUpload('coverFile', 'coverDropZone', 'coverPreview', 'coverFileName', 'coverFileSize');
    
    // Setup form validation
    setupCareerFormValidation();
    
    // Setup form submission
    const form = document.getElementById('careerForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// Setup file upload functionality
function setupFileUpload(inputId, dropZoneId, previewId, fileNameId, fileSizeId) {
    const input = document.getElementById(inputId);
    const dropZone = document.getElementById(dropZoneId);
    if (!input || !dropZone) return;
    
    // Click to upload
    dropZone.addEventListener('click', () => input.click());
    
    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            handleFileSelect(input.files[0], previewId, fileNameId, fileSizeId, inputId);
        }
    });
    
    // File selection
    input.addEventListener('change', () => {
        if (input.files.length) {
            handleFileSelect(input.files[0], previewId, fileNameId, fileSizeId, inputId);
        }
    });
}

// Handle file selection and validation
function handleFileSelect(file, previewId, fileNameId, fileSizeId, inputId) {
    const preview = document.getElementById(previewId);
    const nameEl = document.getElementById(fileNameId);
    const sizeEl = document.getElementById(fileSizeId);
    
    // Validate file size
    if (file.size > CONFIG.maxFileSize) {
        showFieldError(document.getElementById(inputId), 'File size must be less than 5MB');
        return;
    }
    
    // Validate file type
    if (!CONFIG.validTypes.includes(file.type)) {
        showFieldError(document.getElementById(inputId), 'Please upload a PDF, DOC, or DOCX file');
        return;
    }
    
    // Show preview
    nameEl.textContent = file.name;
    sizeEl.textContent = formatFileSize(file.size);
    preview.classList.add('active');
    
    // Clear any errors
    clearFieldError(document.getElementById(inputId));
}

// Remove uploaded file
function removeFile(type) {
    if (type === 'cv') {
        const input = document.getElementById('cvFile');
        const preview = document.getElementById('cvPreview');
        if (input) input.value = '';
        if (preview) preview.classList.remove('active');
    } else if (type === 'cover') {
        const input = document.getElementById('coverFile');
        const preview = document.getElementById('coverPreview');
        if (input) input.value = '';
        if (preview) preview.classList.remove('active');
    }
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Setup form validation
function setupCareerFormValidation() {
    const form = document.getElementById('careerForm');
    if (!form) return;
    
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
        // Real-time validation on input
        field.addEventListener('input', () => {
            validateField(field);
        });
        
        // Validation on blur
        field.addEventListener('blur', () => {
            if (field.hasAttribute('required') && !field.value.trim()) {
                showFieldError(field, 'This field is required');
            } else if (field.type === 'email' && field.value && !validateEmail(field.value)) {
                showFieldError(field, 'Please enter a valid email address');
            } else if (field.type === 'tel' && field.value && !validatePhone(field.value)) {
                showFieldError(field, 'Please enter a valid phone number');
            } else {
                clearFieldError(field);
            }
        });
    });
}

// Validate single field
function validateField(field) {
    if (field.hasAttribute('required') && !field.value.trim()) {
        return false;
    }
    if (field.type === 'email' && field.value && !validateEmail(field.value)) {
        return false;
    }
    if (field.type === 'tel' && field.value && !validatePhone(field.value)) {
        return false;
    }
    return true;
}

// Email validation
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
}

// Phone validation
function validatePhone(phone) {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    return re.test(phone);
}

// Show field error
function showFieldError(field, message) {
    const formGroup = field.closest('.form-group') || field.closest('.file-upload-group');
    if (!formGroup) return;
    
    formGroup.classList.add('error');
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = message;
    }
    field.setAttribute('aria-invalid', 'true');
}

// Clear field error
function clearFieldError(field) {
    const formGroup = field.closest('.form-group') || field.closest('.file-upload-group');
    if (!formGroup) return;
    
    formGroup.classList.remove('error');
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = '';
    }
    field.removeAttribute('aria-invalid');
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const statusEl = document.getElementById('careerFormStatus');
    const submitBtn = form.querySelector('.btn-submit');
    
    // Get form values
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const position = document.getElementById('position')?.value;
    const experience = document.getElementById('experience')?.value;
    const linkedin = document.getElementById('linkedin')?.value.trim();
    const coverLetter = document.getElementById('coverLetter')?.value.trim();
    const additionalInfo = document.getElementById('additionalInfo')?.value.trim();
    const cvFile = document.getElementById('cvFile')?.files[0];
    const coverFile = document.getElementById('coverFile')?.files[0];
    
    // Validate required fields
    let isValid = true;
    
    if (!fullName) {
        showFieldError(document.getElementById('fullName'), 'Full name is required');
        isValid = false;
    }
    
    if (!email) {
        showFieldError(document.getElementById('email'), 'Email address is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError(document.getElementById('email'), 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!position) {
        showFieldError(document.getElementById('position'), 'Please select a position');
        isValid = false;
    }
    
    if (!experience) {
        showFieldError(document.getElementById('experience'), 'Please select your experience level');
        isValid = false;
    }
    
    if (!cvFile) {
        showFieldError(document.getElementById('cvFile'), 'Please upload your CV/Resume');
        isValid = false;
    }
    
    if (!isValid) {
        statusEl.textContent = 'Please fill in all required fields.';
        statusEl.className = 'form-status error';
        return;
    }
    
    // Show loading state
    statusEl.textContent = 'Submitting your application...';
    statusEl.className = 'form-status info';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">Submitting...</span><span class="btn-icon">↻</span>';
    
    try {
        // Upload CV to Cloudinary
        const cvUrl = await uploadToCloudinary(cvFile);
        const coverUrl = coverFile ? await uploadToCloudinary(coverFile) : null;
        
        // Submit application to backend API
        const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                phone,
                position,
                experience,
                linkedin,
                coverLetter,
                additionalInfo,
                cvUrl,
                coverUrl
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to submit application');
        }
        
        // Show success modal
        showSuccessModal();
        
        // Reset form
        form.reset();
        removeFile('cv');
        removeFile('cover');
        
    } catch (error) {
        console.error('Application submission error:', error);
        statusEl.textContent = 'Submission failed. Please try again or contact us directly at careers@nedhubgh.com';
        statusEl.className = 'form-status error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Submit Application</span><span class="btn-icon">→</span>';
    }
}

// Upload file to Cloudinary
function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/auto/upload`;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CONFIG.cloudinary.uploadPreset);
        
        fetch(uploadUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.secure_url) {
                resolve(data.secure_url);
            } else {
                reject(new Error('No URL returned from upload'));
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}

// Show success modal
function showSuccessModal() {
    const successModal = document.getElementById('successModal');
    if (!successModal) return;
    
    successModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Close modal on button click
    const closeBtn = document.getElementById('successModalClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSuccessModal);
    }
    
    // Close modal on overlay click
    const overlay = successModal.querySelector('.success-modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeSuccessModal);
    }
    
    // Close modal on escape key
    const handleEscapeKey = (e) => {
        if (e.key === 'Escape') {
            closeSuccessModal();
            document.removeEventListener('keydown', handleEscapeKey);
        }
    };
    document.addEventListener('keydown', handleEscapeKey);
}

// Close success modal
function closeSuccessModal() {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Scroll to jobs section when modal is closed
        const jobsSection = document.getElementById('jobs');
        if (jobsSection) {
            jobsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally for inline handlers
window.selectJob = function(jobTitle) {
    const positionSelect = document.getElementById('position');
    if (positionSelect) {
        positionSelect.value = jobTitle;
        const applySection = document.getElementById('apply');
        if (applySection) {
            applySection.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

window.removeFile = removeFile;
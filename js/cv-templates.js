// CV Templates Page - Payment and Download Functionality

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const paymentModal = document.getElementById('payment-modal');
    const successModal = document.getElementById('success-modal');
    const previewModal = document.getElementById('preview-modal');
    const downloadNotification = document.getElementById('download-notification');
    const closePaymentModalBtn = document.getElementById('close-payment-modal');
    const closePreviewModalBtn = document.getElementById('close-preview-modal');
    const paymentForm = document.getElementById('payment-form');
    const paymentMethodInputs = document.querySelectorAll('input[name="payment-method"]');
    const cardDetails = document.getElementById('card-details');
    const completePaymentBtn = document.getElementById('complete-payment-btn');
    const downloadTemplateBtn = document.getElementById('download-template-btn');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const templateSearch = document.getElementById('template-search');
    const searchBtn = document.querySelector('.search-btn');

    // Template data (in production, this would come from a server)
    const templates = {
        1: { name: 'Modern Pro', price: 9.99, image: 'https://via.placeholder.com/400x500/4a90a4/ffffff?text=Modern+Pro+CV' },
        2: { name: 'Classic Elegance', price: 7.99, image: 'https://via.placeholder.com/400x500/2c3e50/ffffff?text=Classic+Elegance+CV' },
        3: { name: 'Creative Studio', price: 12.99, image: 'https://via.placeholder.com/400x500/e74c3c/ffffff?text=Creative+Studio+CV' },
        4: { name: 'Professional Standard', price: 0.00, image: 'https://via.placeholder.com/400x500/27ae60/ffffff?text=Professional+Standard+CV' },
        5: { name: 'Minimal Design', price: 8.99, image: 'https://via.placeholder.com/400x500/9b59b6/ffffff?text=Minimal+Design+CV' },
        6: { name: 'Executive Premium', price: 14.99, image: 'https://via.placeholder.com/400x500/34495e/ffffff?text=Executive+Premium+CV' },
        7: { name: 'Dynamic Flow', price: 11.99, image: 'https://via.placeholder.com/400x500/e67e22/ffffff?text=Dynamic+Flow+CV' },
        8: { name: 'Basic Resume', price: 0.00, image: 'https://via.placeholder.com/400x500/16a085/ffffff?text=Basic+Resume+CV' }
    };

    // Current purchase state
    let currentTemplate = null;
    let purchasedTemplates = JSON.parse(localStorage.getItem('purchasedTemplates')) || [];

    // Initialize
    init();

    function init() {
        // Add event listeners to buy buttons
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', handleBuyClick);
        });

        // Add event listeners to free download buttons
        document.querySelectorAll('.download-free-btn').forEach(btn => {
            btn.addEventListener('click', handleFreeDownload);
        });

        // Add event listeners to preview buttons
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', handlePreviewClick);
        });

        // Modal close buttons
        if (closePaymentModalBtn) {
            closePaymentModalBtn.addEventListener('click', closePaymentModal);
        }
        if (closePreviewModalBtn) {
            closePreviewModalBtn.addEventListener('click', closePreviewModal);
        }

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeAllModals();
                }
            });
        });

        // Payment method change handler
        paymentMethodInputs.forEach(input => {
            input.addEventListener('change', handlePaymentMethodChange);
        });

        // Form submission
        if (paymentForm) {
            paymentForm.addEventListener('submit', handlePaymentSubmit);
        }

        // Download button
        if (downloadTemplateBtn) {
            downloadTemplateBtn.addEventListener('click', handleDownload);
        }

        // Card number formatting
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                let formattedValue = '';
                for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) {
                        formattedValue += ' ';
                    }
                    formattedValue += value[i];
                }
                e.target.value = formattedValue;
            });
        }

        // Expiry date formatting
        const cardExpiryInput = document.getElementById('card-expiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2);
                }
                e.target.value = value;
            });
        }

        // Filter functionality
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterTemplates);
        }
        if (priceFilter) {
            priceFilter.addEventListener('change', filterTemplates);
        }
        if (templateSearch) {
            templateSearch.addEventListener('input', filterTemplates);
        }
        if (searchBtn) {
            searchBtn.addEventListener('click', filterTemplates);
        }

        // Check for purchased templates
        updateTemplateButtons();
    }

    // Handle buy button click
    function handleBuyClick(e) {
        const templateId = e.target.closest('.buy-btn').dataset.template;
        currentTemplate = templates[templateId];
        
        if (!currentTemplate) return;

        // Update modal content
        document.getElementById('modal-template-img').src = currentTemplate.image;
        document.getElementById('modal-template-name').textContent = currentTemplate.name;
        document.getElementById('modal-template-price').textContent = currentTemplate.price.toFixed(2);
        document.getElementById('pay-amount').textContent = currentTemplate.price.toFixed(2);

        // Open payment modal
        openPaymentModal();
    }

    // Handle free template download
    function handleFreeDownload(e) {
        const btn = e.target.closest('.download-free-btn');
        const templateId = btn.dataset.template;
        const templateName = btn.dataset.name;

        // Generate a simple download
        downloadTemplate(templateId, templateName, 0);

        // Show notification
        showNotification('Downloading "' + templateName + '"...');
    }

    // Handle preview button click
    function handlePreviewClick(e) {
        const templateId = e.target.closest('.preview-btn').dataset.template;
        const template = templates[templateId];
        
        if (!template) return;

        document.getElementById('preview-full-img').src = template.image;
        openPreviewModal();
    }

    // Handle payment method change
    function handlePaymentMethodChange(e) {
        const method = e.target.value;
        
        if (method === 'card') {
            cardDetails.style.display = 'block';
        } else {
            cardDetails.style.display = 'none';
        }
    }

    // Handle payment form submission
    function handlePaymentSubmit(e) {
        e.preventDefault();

        // Validate form
        const customerName = document.getElementById('customer-name').value;
        const customerEmail = document.getElementById('customer-email').value;
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

        if (!customerName || !customerEmail) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Validate card details if card payment
        if (paymentMethod === 'card') {
            const cardNumber = document.getElementById('card-number').value;
            const cardExpiry = document.getElementById('card-expiry').value;
            const cardCvc = document.getElementById('card-cvc').value;

            if (!cardNumber || !cardExpiry || !cardCvc) {
                showNotification('Please fill in all card details', 'error');
                return;
            }
        }

        // Simulate payment processing
        completePaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        completePaymentBtn.disabled = true;

        setTimeout(function() {
            // Payment successful
            const transactionId = generateTransactionId();
            
            // Add to purchased templates
            if (currentTemplate) {
                purchasedTemplates.push({
                    id: currentTemplate.id,
                    name: currentTemplate.name,
                    price: currentTemplate.price,
                    transactionId: transactionId,
                    date: new Date().toISOString()
                });
                localStorage.setItem('purchasedTemplates', JSON.stringify(purchasedTemplates));
            }

            // Update success modal
            document.getElementById('success-template-name').textContent = currentTemplate.name;
            document.getElementById('transaction-id').textContent = transactionId;

            // Close payment modal and open success modal
            closePaymentModal();
            openSuccessModal();

            // Reset button
            completePaymentBtn.innerHTML = '<i class="fas fa-lock"></i> Pay $' + currentTemplate.price.toFixed(2);
            completePaymentBtn.disabled = false;

            // Clear form
            paymentForm.reset();

            // Update template buttons
            updateTemplateButtons();

        }, 2000);
    }

    // Handle template download
    function handleDownload() {
        if (currentTemplate) {
            downloadTemplate(currentTemplate.id, currentTemplate.name, currentTemplate.price);
            closeSuccessModal();
        }
    }

    // Download template (simulated)
    function downloadTemplate(templateId, templateName, price) {
        // Create a simple HTML file as a placeholder for the actual template
        const templateContent = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>' + templateName + ' - CV Template</title>\n    <style>\n        body {\n            font-family: Arial, sans-serif;\n            max-width: 800px;\n            margin: 40px auto;\n            padding: 20px;\n            color: #333;\n        }\n        h1 { color: #4a90a4; border-bottom: 2px solid #4a90a4; padding-bottom: 10px; }\n        .section { margin: 30px 0; }\n        .section h2 { color: #2c3e50; font-size: 1.3em; }\n        .contact-info { background: #f5f5f5; padding: 20px; border-radius: 5px; }\n        .experience-item, .education-item { margin: 20px 0; padding-left: 20px; border-left: 3px solid #4a90a4; }\n        .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }\n        .skill { background: #4a90a4; color: white; padding: 5px 15px; border-radius: 20px; }\n        .instructions { background: #fff3cd; padding: 20px; border-radius: 5px; margin-bottom: 30px; }\n        .instructions h3 { color: #856404; margin-top: 0; }\n    </style>\n</head>\n<body>\n    <div class="instructions">\n        <h3>Instructions for Editing</h3>\n        <p>This is your downloaded CV template. To edit:</p>\n        <ul>\n            <li>Open this file in any text editor (Notepad, TextEdit, VS Code)</li>\n            <li>Replace the placeholder text with your own information</li>\n            <li>For a fully editable Word document, contact us at support@nedhub.com</li>\n            <li>Save your changes and export to PDF when finished</li>\n        </ul>\n    </div>\n\n    <h1>Your Name</h1>\n    <div class="contact-info">\n        <p>Email: your.email@example.com | Phone: (123) 456-7890 | Location: City, Country</p>\n        <p>LinkedIn: linkedin.com/in/yourprofile | Portfolio: yourwebsite.com</p>\n    </div>\n\n    <div class="section">\n        <h2>Professional Summary</h2>\n        <p>A brief summary of your professional background, key achievements, and career objectives. This section should highlight your most relevant skills and experiences.</p>\n    </div>\n\n    <div class="section">\n        <h2>Work Experience</h2>\n        <div class="experience-item">\n            <h3>Job Title</h3>\n            <p><strong>Company Name</strong> | City, Country</p>\n            <p><em>Start Date - End Date</em></p>\n            <ul>\n                <li>Key responsibility or achievement #1</li>\n                <li>Key responsibility or achievement #2</li>\n                <li>Key responsibility or achievement #3</li>\n            </ul>\n        </div>\n        <div class="experience-item">\n            <h3>Job Title</h3>\n            <p><strong>Company Name</strong> | City, Country</p>\n            <p><em>Start Date - End Date</em></p>\n            <ul>\n                <li>Key responsibility or achievement #1</li>\n                <li>Key responsibility or achievement #2</li>\n                <li>Key responsibility or achievement #3</li>\n            </ul>\n        </div>\n    </div>\n\n    <div class="section">\n        <h2>Education</h2>\n        <div class="education-item">\n            <h3>Degree Name</h3>\n            <p><strong>University Name</strong> | City, Country</p>\n            <p><em>Graduation Year</em></p>\n        </div>\n    </div>\n\n    <div class="section">\n        <h2>Skills</h2>\n        <div class="skills-list">\n            <span class="skill">Skill 1</span>\n            <span class="skill">Skill 2</span>\n            <span class="skill">Skill 3</span>\n            <span class="skill">Skill 4</span>\n            <span class="skill">Skill 5</span>\n        </div>\n    </div>\n\n    <div class="section">\n        <h2>Certifications (Optional)</h2>\n        <ul>\n            <li>Certification Name - Issuing Organization | Year</li>\n        </ul>\n    </div>\n\n    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666;">\n        <p>Template: ' + templateName + ' | Downloaded from Nedhub</p>\n    </footer>\n</body>\n</html>';

        // Create download link
        const blob = new Blob([templateContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = templateName.replace(/\s+/g, '_') + '_CV_Template.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show notification
        showNotification('"' + templateName + '" downloaded successfully!');
    }

    // Generate unique transaction ID
    function generateTransactionId() {
        return 'TXN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Open modals
    function openPaymentModal() {
        if (paymentModal) {
            paymentModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function openSuccessModal() {
        if (successModal) {
            successModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function openPreviewModal() {
        if (previewModal) {
            previewModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Close modals
    function closePaymentModal() {
        if (paymentModal) {
            paymentModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function closeSuccessModal() {
        if (successModal) {
            successModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function closePreviewModal() {
        if (previewModal) {
            previewModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function closeAllModals() {
        closePaymentModal();
        closeSuccessModal();
        closePreviewModal();
    }

    // Show notification
    function showNotification(message, type) {
        const notification = document.getElementById('download-notification');
        if (notification) {
            notification.querySelector('span').textContent = message;
            if (type === 'error') {
                notification.style.background = '#e74c3c';
            } else {
                notification.style.background = '#27ae60';
            }
            notification.classList.add('show');
            
            setTimeout(function() {
                notification.classList.remove('show');
            }, 3000);
        }
    }

    // Filter templates
    function filterTemplates() {
        const category = categoryFilter ? categoryFilter.value : 'all';
        const price = priceFilter ? priceFilter.value : 'all';
        const search = templateSearch ? templateSearch.value.toLowerCase() : '';

        document.querySelectorAll('.template-card').forEach(function(card) {
            const cardCategory = card.dataset.category;
            const cardPrice = card.dataset.price;
            const cardName = card.querySelector('h3').textContent.toLowerCase();

            let showCard = true;

            if (category !== 'all' && cardCategory !== category) {
                showCard = false;
            }

            if (price !== 'all' && cardPrice !== price) {
                showCard = false;
            }

            if (search && cardName.indexOf(search) === -1) {
                showCard = false;
            }

            card.style.display = showCard ? '' : 'none';
        });
    }

    // Update template buttons for purchased templates
    function updateTemplateButtons() {
        purchasedTemplates.forEach(function(purchased) {
            const btn = document.querySelector('.buy-btn[data-template="' + purchased.id + '"]');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-download"></i> Download Again';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
                btn.dataset.name = purchased.name;
            }
        });

        // Add click handlers for re-download
        document.querySelectorAll('.btn-secondary').forEach(function(btn) {
            if (btn.dataset.template && !btn.classList.contains('download-free-btn')) {
                btn.removeEventListener('click', handleBuyClick);
                btn.addEventListener('click', function() {
                    const template = templates[this.dataset.template];
                    if (template) {
                        downloadTemplate(template.id, template.name, template.price);
                    }
                });
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
});

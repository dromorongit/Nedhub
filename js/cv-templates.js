// CV Templates Page - Hubtel Payment Integration
// Supports: Mobile Money, Bank Card, Hubtel Wallet, GhQR

// API Configuration
const API_BASE_URL = 'https://nedhub-production.up.railway.app/api';
const FRONTEND_URL = window.location.origin + window.location.pathname.replace('cv-templates.html', '');

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

    // Template data (will be fetched from backend)
    let templates = {};

    // Current purchase state
    let currentTemplate = null;
    let currentClientReference = null;
    let purchasedTemplates = JSON.parse(localStorage.getItem('purchasedTemplates')) || [];

    // Check for payment callback result in URL
    checkPaymentCallback();

    // Initialize
    init();

    async function init() {
        // Fetch templates from backend
        await fetchTemplates();

        // Add event listeners
        setupEventListeners();

        // Update purchased template buttons
        updateTemplateButtons();
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Buy buttons
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', handleBuyClick);
        });

        // Free download buttons
        document.querySelectorAll('.download-free-btn').forEach(btn => {
            btn.addEventListener('click', handleFreeDownload);
        });

        // Preview buttons
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
        setupCardFormatting();

        // Filter functionality
        setupFilters();

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });
    }

    // Fetch templates from backend API
    async function fetchTemplates() {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            const data = await response.json();
            
            if (data.success) {
                data.data.products.forEach(product => {
                    const id = product.id.replace('cv-', '');
                    templates[id] = {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        downloadUrl: product.downloadUrl,
                        isFree: product.isFree
                    };
                });
                console.log('Templates loaded from backend');
            }
        } catch (error) {
            console.warn('Backend not available, using fallback data');
            useFallbackTemplates();
        }
    }

    // Fallback templates when backend is unavailable
    function useFallbackTemplates() {
        templates = {
            1: { name: 'Modern Pro', price: 9.99, image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80' },
            2: { name: 'Classic Elegance', price: 7.99, image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80' },
            3: { name: 'Creative Studio', price: 12.99, image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80' },
            4: { name: 'Professional Standard', price: 0.00, image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80' },
            5: { name: 'Minimal Design', price: 8.99, image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&q=80' },
            6: { name: 'Executive Premium', price: 14.99, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80' },
            7: { name: 'Dynamic Flow', price: 11.99, image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80' },
            8: { name: 'Basic Resume', price: 0.00, image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80' }
        };
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

        // Show/hide card details based on payment method
        handlePaymentMethodChange({ target: document.querySelector('input[name="payment-method"]:checked') });

        openPaymentModal();
    }

    // Handle free template download
    async function handleFreeDownload(e) {
        const btn = e.target.closest('.download-free-btn');
        const templateId = btn.dataset.template;
        const templateName = btn.dataset.name;

        try {
            const customerEmail = prompt('Please enter your email for the download link:');
            if (!customerEmail) return;

            const response = await fetch(`${API_BASE_URL}/orders/free-download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: `cv-${templateId}`,
                    customerEmail: customerEmail,
                    customerName: ''
                })
            });

            const data = await response.json();

            if (data.success) {
                purchasedTemplates.push({
                    id: templateId,
                    name: templateName,
                    price: 0,
                    orderId: data.data.orderId,
                    date: new Date().toISOString()
                });
                localStorage.setItem('purchasedTemplates', JSON.stringify(purchasedTemplates));

                showNotification('Free template ordered! Check your email.');
                updateTemplateButtons();
            }
        } catch (error) {
            downloadTemplate(templateId, templateName);
            showNotification(`"${templateName}" downloaded successfully!`);
        }
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
        const method = e.target?.value || 'hubtel';
        
        if (method === 'card') {
            cardDetails.style.display = 'block';
        } else {
            cardDetails.style.display = 'none';
        }
    }

    // Handle payment form submission with Hubtel
    async function handlePaymentSubmit(e) {
        e.preventDefault();

        // Validate form
        const customerName = document.getElementById('customer-name').value;
        const customerEmail = document.getElementById('customer-email').value;

        if (!customerName || !customerEmail) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Show processing state
        completePaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting to Hubtel...';
        completePaymentBtn.disabled = true;

        try {
            // Initiate Hubtel payment
            const response = await fetch(`${API_BASE_URL}/payments/hubtel/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: currentTemplate.price,
                    productId: currentTemplate.id,
                    customerEmail: customerEmail,
                    customerName: customerName,
                    description: `CV Template: ${currentTemplate.name}`
                })
            });

            const data = await response.json();

            if (data.success) {
                // Store client reference for status checking
                currentClientReference = data.data.clientReference;
                
                console.log('[PAYMENT] Initiated:', data.data.clientReference);
                console.log('[PAYMENT] Redirecting to:', data.data.checkoutUrl);

                // Show redirect message
                completePaymentBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Redirecting to Payment...';
                
                // Redirect to Hubtel checkout
                setTimeout(() => {
                    window.location.href = data.data.checkoutUrl;
                }, 1500);
            } else {
                throw new Error(data.error || 'Failed to initiate payment');
            }

        } catch (error) {
            console.error('[PAYMENT ERROR]:', error);
            
            // Fallback to simulated payment
            completePaymentBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gateway Error - Using Demo Mode';
            
            setTimeout(() => {
                simulatePayment(customerName, customerEmail);
            }, 2000);
        }
    }

    // Simulate payment (fallback when backend unavailable)
    function simulatePayment(customerName, customerEmail) {
        const transactionId = 'SIM-' + Date.now().toString(36).toUpperCase();
        
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

        document.getElementById('success-template-name').textContent = currentTemplate.name;
        document.getElementById('transaction-id').textContent = transactionId + ' (Demo)';

        closePaymentModal();
        openSuccessModal();

        completePaymentBtn.innerHTML = '<i class="fas fa-lock"></i> Pay $' + currentTemplate.price.toFixed(2);
        completePaymentBtn.disabled = false;

        paymentForm.reset();
        updateTemplateButtons();
    }

    // Check payment callback from URL
    async function checkPaymentCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        const clientRef = urlParams.get('ref');

        if (paymentStatus && clientRef) {
            console.log('[PAYMENT CALLBACK] Status:', paymentStatus, 'Reference:', clientRef);

            if (paymentStatus === 'success') {
                showNotification('Payment successful! Your template is ready.');
                
                // Poll for payment status to confirm
                await pollPaymentStatus(clientRef);
            } else if (paymentStatus === 'cancelled') {
                showNotification('Payment was cancelled. Please try again.', 'error');
            }

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // Poll payment status
    async function pollPaymentStatus(clientReference, maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(`${API_BASE_URL}/payments/hubtel/status/${clientReference}`);
                const data = await response.json();

                if (data.success && data.data.status === 'paid') {
                    showNotification('Payment confirmed! You can now download your template.');
                    
                    // Refresh page to update purchased templates
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                    
                    return;
                }

                if (data.success && data.data.status === 'failed') {
                    showNotification('Payment failed. Please try again.', 'error');
                    return;
                }

                // Wait 2 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error('[POLL ERROR]:', error);
                break;
            }
        }
    }

    // Handle template download
    function handleDownload() {
        if (currentTemplate) {
            downloadTemplate(currentTemplate.id, currentTemplate.name, currentTemplate.price);
            closeSuccessModal();
        }
    }

    // Download template
    function downloadTemplate(templateId, templateName, price) {
        const templateContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateName} - CV Template</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; line-height: 1.6; }
        h1 { color: #0B132B; border-bottom: 3px solid #10B981; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin: 30px 0; }
        .section h2 { color: #1a2342; font-size: 1.4em; border-left: 4px solid #F77F00; padding-left: 15px; margin-bottom: 20px; }
        .contact-info { background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 30px; }
        .experience-item, .education-item { margin: 25px 0; padding-left: 25px; border-left: 3px solid #10B981; }
        .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill { background: #10B981; color: white; padding: 8px 18px; border-radius: 25px; font-size: 0.9em; }
        .instructions { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #f59e0b; }
        .instructions h3 { color: #856404; margin-top: 0; }
        footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; }
    </style>
</head>
<body>
    <div class="instructions">
        <h3>Instructions for Editing</h3>
        <p>This is your downloaded CV template. To edit:</p>
        <ul>
            <li>Open in Microsoft Word or Google Docs</li>
            <li>Replace placeholder text with your information</li>
            <li>Export to PDF when finished</li>
        </ul>
    </div>

    <h1>YOUR FULL NAME</h1>
    <div class="contact-info">
        <p><strong>Email:</strong> your.email@example.com | <strong>Phone:</strong> +233 XXX XXX XXX</p>
        <p><strong>Location:</strong> City, Country</p>
        <p><strong>LinkedIn:</strong> linkedin.com/in/yourprofile</p>
    </div>

    <div class="section">
        <h2>Professional Summary</h2>
        <p>A compelling summary of your professional background, key achievements, and career objectives.</p>
    </div>

    <div class="section">
        <h2>Work Experience</h2>
        <div class="experience-item">
            <h3>Job Title</h3>
            <p><strong>Company Name</strong> | City, Country</p>
            <p><em>Start Date - End Date</em></p>
            <ul>
                <li>Key responsibility or achievement #1</li>
                <li>Key responsibility or achievement #2</li>
                <li>Key responsibility or achievement #3</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>Education</h2>
        <div class="education-item">
            <h3>Degree Name</h3>
            <p><strong>University Name</strong> | City, Country</p>
            <p><em>Graduation Year</em></p>
        </div>
    </div>

    <div class="section">
        <h2>Skills</h2>
        <div class="skills-list">
            <span class="skill">Skill 1</span>
            <span class="skill">Skill 2</span>
            <span class="skill">Skill 3</span>
        </div>
    </div>

    <footer>
        <p>Template: ${templateName} | Downloaded from <strong>Nedhub Ghana</strong></p>
        <p>nedhubgh.com/cv-templates</p>
    </footer>
</body>
</html>`;

        const blob = new Blob([templateContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = templateName.replace(/\s+/g, '_') + '_CV_Template.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Modal functions
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
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('download-notification');
        if (notification) {
            notification.querySelector('span').textContent = message;
            
            if (type === 'error') {
                notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            } else {
                notification.style.background = 'linear-gradient(135deg, #10B981, #059669)';
            }
            
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 5000);
        }
    }

    // Setup card number formatting
    function setupCardFormatting() {
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                let formattedValue = '';
                for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) formattedValue += ' ';
                    formattedValue += value[i];
                }
                e.target.value = formattedValue;
            });
        }

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
    }

    // Setup filters
    function setupFilters() {
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
    }

    // Filter templates
    function filterTemplates() {
        const category = categoryFilter?.value || 'all';
        const price = priceFilter?.value || 'all';
        const search = templateSearch?.value.toLowerCase() || '';

        document.querySelectorAll('.cv-template-card').forEach(function(card) {
            const cardCategory = card.dataset.category;
            const cardPrice = card.dataset.price;
            const cardName = card.querySelector('h3').textContent.toLowerCase();

            let showCard = true;

            if (category !== 'all' && cardCategory !== category) showCard = false;
            if (price !== 'all' && cardPrice !== price) showCard = false;
            if (search && cardName.indexOf(search) === -1) showCard = false;

            card.style.display = showCard ? '' : 'none';
            if (showCard) card.classList.add('visible');
            else card.classList.remove('visible');
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
});

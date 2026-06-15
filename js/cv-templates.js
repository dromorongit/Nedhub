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
    const templatesGrid = document.querySelector('.templates-grid');

// Template data (will be fetched from backend)
     let templates = [];

     // Current purchase state
     let currentTemplate = null;
     let currentClientReference = null;
     let purchasedTemplates = JSON.parse(localStorage.getItem('purchasedTemplates')) || [];

     // Initialize
     init();

     async function init() {
         // Fetch templates from database
         const fetched = await fetchTemplatesFromDB();

         if (!fetched) {
             showErrorState();
             return;
         }

         // Update the templates grid dynamically from database
         await updateTemplatesGrid();

         // Add event listeners
         setupEventListeners();

         // Check if we should process a returning payment
         await checkPaymentReturn();

         // Update purchased template buttons
         updateTemplateButtons();
     }

// Fetch templates from database API
     async function fetchTemplatesFromDB() {
         try {
             const response = await fetch(`${API_BASE_URL}/careers/cv-templates`);
             const data = await response.json();

             if (data.success) {
                 templates = data.data.map(template => ({
                     id: template.id,
                     name: template.name,
                     price: template.price || 0,
                     image: template.thumbnailUrl || template.image,
                     downloadUrl: template.templateFileUrl || template.downloadUrl,
                     isFree: !template.isPremium && template.price === 0,
                     category: template.category,
                     description: template.description,
                     downloadCount: template.downloadCount || 0,
                     isPremium: template.price > 0,
                     featured: template.featured || false
                 }));
                 console.log('Templates loaded from database:', templates.length);
                 return true;
             }
             return false;
         } catch (error) {
             console.error('Failed to fetch templates from database:', error);
             return false;
         }
     }

     // Show empty state when no templates exist
     function showEmptyState() {
         if (!templatesGrid) return;

         templatesGrid.innerHTML = `
             <div class="cv-empty-state" style="grid-column: 1/-1; text-align: center; padding: 80px 20px; background: #fff; border-radius: 16px; border: 1px dashed #e2e8f0;">
                 <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                     <i class="fas fa-folder-open" style="font-size: 2.5rem; color: #10B981;"></i>
                 </div>
                 <h3 style="font-size: 1.5rem; color: #0B132B; margin-bottom: 12px; font-weight: 600;">No CV Templates Available</h3>
                 <p style="color: #64748b; max-width: 500px; margin: 0 auto 24px; line-height: 1.6;">We're currently updating our template collection. Please check back soon or contact us to request a specific template design.</p>
                 <a href="contact.html" class="btn btn-primary btn-large">Contact Us</a>
             </div>
         `;
     }

     // Show error state when API request fails
     function showErrorState() {
         if (!templatesGrid) return;

         templatesGrid.innerHTML = `
             <div class="cv-error-state" style="grid-column: 1/-1; text-align: center; padding: 80px 20px; background: #fff; border-radius: 16px; border: 1px solid #fee2e2;">
                 <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                     <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #ef4444;"></i>
                 </div>
                 <h3 style="font-size: 1.5rem; color: #0B132B; margin-bottom: 12px; font-weight: 600;">Unable to Load Templates</h3>
                 <p style="color: #64748b; max-width: 500px; margin: 0 auto 24px; line-height: 1.6;">We're experiencing technical difficulties. Please refresh the page or try again later.</p>
                 <button onclick="location.reload()" class="btn btn-primary btn-large">Retry</button>
             </div>
         `;
     }

// Update the templates grid dynamically from database
     async function updateTemplatesGrid() {
         if (!templatesGrid) return;

         if (templates.length === 0) {
             showEmptyState();
             return;
         }

         templatesGrid.innerHTML = templates.map(template => {
             const priceLabel = template.isFree ? 'Free' : `₵${template.price}`;
             const badgeClass = template.isFree ? 'free' : 'premium';
             const badgeText = template.isFree ? 'FREE' : 'Premium';
             const btnClass = template.isFree ? 'download-free-btn' : 'buy-btn';
             const btnIcon = template.isFree ? 'fa-download' : 'fa-shopping-cart';
             const btnText = template.isFree ? 'Download Free' : `Buy Now - ₵${template.price}`;

             return `
                 <div class="cv-template-card scroll-animate" data-category="${template.category?.toLowerCase() || 'other'}" data-price="${template.isFree ? 'free' : 'paid'}" data-id="${template.id}">
                     <div class="template-preview">
                         <img loading="lazy" src="${template.image}" alt="${template.name}">
                         <div class="template-overlay">
                             <button class="preview-btn" data-template="${template.id}"><i class="fas fa-eye"></i> Preview</button>
                         </div>
                         <span class="template-badge ${badgeClass}">${badgeText}</span>
                     </div>
                     <div class="template-info">
                         <h3>${template.name}</h3>
                         <p class="template-desc">${template.description || ''}</p>
                         <div class="template-meta">
                             <span class="price">${priceLabel}</span>
                             <span class="rating"><i class="fas fa-star"></i> 4.9</span>
                         </div>
                         <button class="${btnClass}" data-template="${template.id}" data-name="${template.name}" data-price="${template.price}">
                             <i class="fas ${btnIcon}"></i> ${btnText}
                         </button>
                     </div>
                 </div>
             `;
         }).join('');
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

    // Check if returning from payment
    async function checkPaymentReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        const checkoutId = urlParams.get('checkoutid');
        
        if (ref || checkoutId) {
            window.history.replaceState({}, document.title, window.location.pathname);
            
            const pendingTemplateId = localStorage.getItem('pendingTemplateId');
            const pendingTemplateName = localStorage.getItem('pendingTemplateName');
            
            if (pendingTemplateId && pendingTemplateName) {
                const cleanTemplateId = pendingTemplateId.replace('cv-', '');
                const alreadyPurchased = purchasedTemplates.some(t => t.id === cleanTemplateId);
                
                if (!alreadyPurchased) {
                    purchasedTemplates.push({
                        id: cleanTemplateId,
                        name: pendingTemplateName,
                        price: parseFloat(localStorage.getItem('pendingAmount')) || 0,
                        transactionId: ref || checkoutId || 'NED-' + Date.now().toString().slice(-8),
                        date: new Date().toISOString()
                    });
                    localStorage.setItem('purchasedTemplates', JSON.stringify(purchasedTemplates));
                    showNotification('Payment successful! You can now download your template.');
                }
                
                localStorage.removeItem('pendingTemplateId');
                localStorage.removeItem('pendingTemplateName');
                localStorage.removeItem('pendingAmount');
                localStorage.removeItem('pendingClientReference');
            }
        }
    }

// Handle buy button click
     function handleBuyClick(e) {
         const btn = e.target.closest('.buy-btn');
         const templateId = btn.dataset.template;
         currentTemplate = templates.find(t => t.id === templateId) || {
             id: templateId,
             name: btn.dataset.name,
             price: parseFloat(btn.dataset.price),
             image: btn.closest('.cv-template-card').querySelector('.template-preview img').src,
             isFree: false
         };

         if (!currentTemplate) return;

         const modalImg = document.getElementById('modal-template-img');
         const modalName = document.getElementById('modal-template-name');
         const modalPrice = document.getElementById('modal-template-price');
         const payAmount = document.getElementById('pay-amount');

         if (modalImg) modalImg.src = currentTemplate.image;
         if (modalName) modalName.textContent = currentTemplate.name;
         if (modalPrice) modalPrice.textContent = '₵' + currentTemplate.price.toFixed(2);
         if (payAmount) payAmount.textContent = currentTemplate.price.toFixed(2);

         handlePaymentMethodChange({ target: document.querySelector('input[name="payment-method"]:checked') });
         openPaymentModal();
     }

// Handle free template download
     async function handleFreeDownload(e) {
         const btn = e.target.closest('.download-free-btn');
         const templateId = btn.dataset.template;
         const template = templates.find(t => t.id === templateId);

         if (!template) {
             showNotification('Template not found. Please refresh the page.', 'error');
             return;
         }

         try {
             const customerEmail = prompt('Please enter your email for the download link:');
             if (!customerEmail) return;

             const response = await fetch(`${API_BASE_URL}/careers/cv-templates/${templateId}/download`, {
                 method: 'POST'
             });

             const data = await response.json();

             if (data.success) {
                 purchasedTemplates.push({
                     id: templateId,
                     name: template.name,
                     price: template.price || 0,
                     transactionId: data.data.orderId || 'FREE-' + Date.now().toString(36).toUpperCase(),
                     date: new Date().toISOString()
                 });
                 localStorage.setItem('purchasedTemplates', JSON.stringify(purchasedTemplates));
                 showNotification('Template downloaded! Your download has been counted.');
                 updateTemplateButtons();
             } else {
                 throw new Error(data.message || 'Download failed');
             }
         } catch (error) {
             console.error('Download error:', error);
             showNotification('Unable to process download. Please try again later.', 'error');
         }
     }

// Handle preview button click
     function handlePreviewClick(e) {
         const btn = e.target.closest('.preview-btn');
         const templateId = btn.dataset.template;
         const template = templates.find(t => t.id === templateId);

         const previewImg = document.getElementById('preview-full-img');
         if (previewImg) previewImg.src = template?.image || btn.closest('.cv-template-card').querySelector('.template-preview img').src;
         openPreviewModal();
     }

    // Handle payment method change
    function handlePaymentMethodChange(e) {
        const method = e.target?.value || 'hubtel';
        if (cardDetails) {
            cardDetails.style.display = method === 'card' ? 'block' : 'none';
        }
    }

    // Handle payment form submission with Hubtel
    async function handlePaymentSubmit(e) {
        e.preventDefault();

        const customerName = document.getElementById('customer-name').value;
        const customerEmail = document.getElementById('customer-email').value;

        if (!customerName || !customerEmail) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        localStorage.setItem('pendingTemplateName', currentTemplate.name);
        localStorage.setItem('pendingAmount', currentTemplate.price.toString());
        localStorage.setItem('pendingTemplateId', currentTemplate.id);

        if (completePaymentBtn) {
            completePaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting to Hubtel...';
            completePaymentBtn.disabled = true;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/careers/cv-templates/purchase/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: currentTemplate.id,
                    customerEmail: customerEmail,
                    customerName: customerName,
                    description: `CV Template: ${currentTemplate.name}`
                })
            });

            const data = await response.json();

            if (data.success) {
                currentClientReference = data.data.clientReference;
                localStorage.setItem('pendingClientReference', currentClientReference);
                
                if (completePaymentBtn) {
                    completePaymentBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Redirecting to Payment...';
                }

                closePaymentModal();

                setTimeout(() => {
                    window.location.href = data.data.checkoutUrl;
                }, 1000);
            } else {
                throw new Error(data.error || 'Failed to initiate payment');
            }

        } catch (error) {
            console.error('[PAYMENT ERROR]:', error);
            
            if (completePaymentBtn) {
                completePaymentBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gateway Error';
                completePaymentBtn.disabled = false;
            }

            setTimeout(() => {
                if (completePaymentBtn) {
                    completePaymentBtn.innerHTML = '<i class="fas fa-lock"></i> Pay ₵' + (currentTemplate?.price?.toFixed(2) || '0.00');
                }
            }, 3000);

            showNotification('Payment gateway error. Please try again.', 'error');
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
         purchasedTemplates = JSON.parse(localStorage.getItem('purchasedTemplates')) || [];

         purchasedTemplates.forEach(function(purchased) {
             const btn = document.querySelector('.buy-btn[data-template="' + purchased.id + '"]');
             if (btn) {
                 btn.innerHTML = '<i class="fas fa-download"></i> Download Again';
                 btn.classList.remove('btn-primary');
                 btn.classList.add('btn-secondary');
                 btn.dataset.name = purchased.name;

                 const newBtn = btn.cloneNode(true);
                 btn.parentNode.replaceChild(newBtn, btn);

                 newBtn.addEventListener('click', function() {
                     const template = templates.find(t => t.id === this.dataset.template);
                     if (template) {
                         downloadTemplate(template.id, template.name, template.price);
                     } else {
                         downloadTemplate(this.dataset.template, this.dataset.name, parseFloat(this.dataset.price || 0));
                     }
                 });
             }
         });
     }
});
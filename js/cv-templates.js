// CV Templates Page - Hubtel Payment Integration (server-verified downloads)
const API_BASE_URL = 'https://nedhub-production.up.railway.app/api';
const FRONTEND_URL = window.location.origin + window.location.pathname.replace('cv-templates.html', '');

document.addEventListener('DOMContentLoaded', function() {
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

    let templates = [];
    let currentTemplate = null;
    let currentClientReference = null;
    let templatePurchases = JSON.parse(localStorage.getItem('templatePurchases')) || {};

    init();

    async function init() {
        const fetched = await fetchTemplatesFromDB();
        if (!fetched) { showErrorState(); return; }
        await updateTemplatesGrid();
        setupEventListeners();
        await checkPaymentReturn();
        await updateTemplateButtons();
        injectRecoveryForm();
    }

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
                    downloadUrl: '',
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

    async function updateTemplatesGrid() {
        if (!templatesGrid) return;
        if (templates.length === 0) { showEmptyState(); return; }
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

    function setupEventListeners() {
        document.querySelectorAll('.buy-btn').forEach(btn => btn.addEventListener('click', handleBuyClick));
        document.querySelectorAll('.download-free-btn').forEach(btn => btn.addEventListener('click', handleFreeDownload));
        document.querySelectorAll('.preview-btn').forEach(btn => btn.addEventListener('click', handlePreviewClick));
        if (closePaymentModalBtn) closePaymentModalBtn.addEventListener('click', closePaymentModal);
        if (closePreviewModalBtn) closePreviewModalBtn.addEventListener('click', closePreviewModal);
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', function(e) { if (e.target === this) closeAllModals(); });
        });
        paymentMethodInputs.forEach(input => input.addEventListener('change', handlePaymentMethodChange));
        if (paymentForm) paymentForm.addEventListener('submit', handlePaymentSubmit);
        if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', handleDownloadSuccessModal);
        setupCardFormatting();
        setupFilters();
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeAllModals(); });
    }

    async function checkPaymentReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref') || urlParams.get('clientReference');
        const checkoutId = urlParams.get('checkoutid');
        if (ref || checkoutId) {
            window.history.replaceState({}, document.title, window.location.pathname);
            const pendingTemplateId = localStorage.getItem('pendingTemplateId');
            const pendingTemplateName = localStorage.getItem('pendingTemplateName');
            const pendingClientReference = localStorage.getItem('pendingClientReference') || ref || checkoutId;
            const pendingEmail = localStorage.getItem('pendingCustomerEmail') || '';
            if (pendingTemplateId && pendingTemplateName && pendingClientReference) {
                const cleanTemplateId = pendingTemplateId.replace('cv-', '');
                templatePurchases[cleanTemplateId] = {
                    clientReference: pendingClientReference,
                    email: pendingEmail,
                    name: pendingTemplateName
                };
                localStorage.setItem('templatePurchases', JSON.stringify(templatePurchases));
            }
            localStorage.removeItem('pendingTemplateId');
            localStorage.removeItem('pendingTemplateName');
            localStorage.removeItem('pendingAmount');
            localStorage.removeItem('pendingClientReference');
            localStorage.removeItem('pendingCustomerEmail');
        }
    }

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

    async function handleFreeDownload(e) {
        const btn = e.target.closest('.download-free-btn');
        const templateId = btn.dataset.template;
        const template = templates.find(t => t.id === templateId);
        if (!template) { showNotification('Template not found. Please refresh the page.', 'error'); return; }
        try {
            const url = await requestDownloadLink(template, {});
            triggerDownload(url);
            showNotification('Your download has started.');
        } catch (error) {
            console.error('Download error:', error);
            showNotification(error.message || 'Unable to process download. Please try again later.', 'error');
        }
    }

    function handlePreviewClick(e) {
        const btn = e.target.closest('.preview-btn');
        const templateId = btn.dataset.template;
        const template = templates.find(t => t.id === templateId);
        const previewImg = document.getElementById('preview-full-img');
        if (previewImg) previewImg.src = template?.image || btn.closest('.cv-template-card').querySelector('.template-preview img').src;
        openPreviewModal();
    }

    function handlePaymentMethodChange(e) {
        const method = e.target?.value || 'hubtel';
        if (cardDetails) cardDetails.style.display = method === 'card' ? 'block' : 'none';
    }

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
        localStorage.setItem('pendingCustomerEmail', customerEmail);

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
                if (completePaymentBtn) completePaymentBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Redirecting to Payment...';
                closePaymentModal();
                setTimeout(() => { window.location.href = data.data.checkoutUrl; }, 1000);
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
                if (completePaymentBtn) completePaymentBtn.innerHTML = '<i class="fas fa-lock"></i> Pay ₵' + (currentTemplate?.price?.toFixed(2) || '0.00');
            }, 3000);
            showNotification('Payment gateway error. Please try again.', 'error');
        }
    }

    async function handleDownloadSuccessModal() {
        if (currentTemplate) {
            await downloadPaidTemplate(currentTemplate);
            closeSuccessModal();
        }
    }

    async function downloadPaidTemplate(template) {
        const info = templatePurchases[template.id] || {};
        try {
            const url = await requestDownloadLink(template, info);
            triggerDownload(url);
            showNotification('Your download has started.');
        } catch (error) {
            console.error('Download error:', error);
            showNotification('We could not confirm this payment. If you paid, email info@nedhubgh.com with your payment reference.', 'error');
        }
    }

    async function requestDownloadLink(template, info) {
        const response = await fetch(`${API_BASE_URL}/careers/cv-templates/${template.id}/download-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientReference: info.clientReference || '',
                email: info.email || ''
            })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Download failed');
        }
        return data.data.url;
    }

    function triggerDownload(url) {
        const a = document.createElement('a');
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async function updateTemplateButtons() {
        templatePurchases = JSON.parse(localStorage.getItem('templatePurchases')) || templatePurchases;
        for (const template of templates) {
            const info = templatePurchases[template.id];
            const btn = document.querySelector(`.buy-btn[data-template="${template.id}"], .download-free-btn[data-template="${template.id}"]`);
            if (!btn) continue;
            if (template.isFree) {
                btn.innerHTML = '<i class="fas fa-download"></i> Download Free';
                continue;
            }
            if (!info || !info.clientReference) continue;
            try {
                const response = await fetch(`${API_BASE_URL}/careers/cv-templates/purchase/status?ref=${encodeURIComponent(info.clientReference)}`);
                const data = await response.json();
                if (data.success && data.data && data.data.paid && data.data.templateId === template.id) {
                    btn.innerHTML = '<i class="fas fa-download"></i> Download Again';
                    btn.classList.remove('buy-btn');
                    btn.classList.add('download-paid-btn');
                    btn.onclick = async function(ev) {
                        ev.preventDefault();
                        await downloadPaidTemplate(template);
                    };
                }
            } catch (e) {
                // keep Buy
            }
        }
    }

    function openPaymentModal() { if (paymentModal) { paymentModal.classList.add('active'); document.body.style.overflow = 'hidden'; } }
    function openSuccessModal() { if (successModal) { successModal.classList.add('active'); document.body.style.overflow = 'hidden'; } }
    function openPreviewModal() { if (previewModal) { previewModal.classList.add('active'); document.body.style.overflow = 'hidden'; } }
    function closePaymentModal() { if (paymentModal) { paymentModal.classList.remove('active'); document.body.style.overflow = ''; } }
    function closeSuccessModal() { if (successModal) { successModal.classList.remove('active'); document.body.style.overflow = ''; } }
    function closePreviewModal() { if (previewModal) { previewModal.classList.remove('active'); document.body.style.overflow = ''; } }
    function closeAllModals() { closePaymentModal(); closeSuccessModal(); closePreviewModal(); }

    function showNotification(message, type = 'success') {
        const notification = document.getElementById('download-notification');
        if (notification) {
            notification.querySelector('span').textContent = message;
            if (type === 'error') notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            else notification.style.background = 'linear-gradient(135deg, #10B981, #059669)';
            notification.classList.add('show');
            setTimeout(() => notification.classList.remove('show'), 5000);
        }
    }

    function setupCardFormatting() {
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) { if (i > 0 && i % 4 === 0) formattedValue += ' '; formattedValue += value[i]; }
            e.target.value = formattedValue;
        });
        const cardExpiryInput = document.getElementById('card-expiry');
        if (cardExpiryInput) cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2);
            e.target.value = value;
        });
    }

    function setupFilters() {
        if (categoryFilter) categoryFilter.addEventListener('change', filterTemplates);
        if (priceFilter) priceFilter.addEventListener('change', filterTemplates);
        if (templateSearch) templateSearch.addEventListener('input', filterTemplates);
        if (searchBtn) searchBtn.addEventListener('click', filterTemplates);
    }

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
            if (showCard) card.classList.add('visible'); else card.classList.remove('visible');
        });
    }

    function injectRecoveryForm() {
        const modalBody = document.querySelector('#payment-modal .modal-body');
        if (!modalBody || document.getElementById('recovery-download-btn')) return;
        const section = document.createElement('div');
        section.className = 'form-section';
        section.innerHTML = `
            <h3><i class="fas fa-undo"></i> Already paid? Get your download</h3>
            <div class="form-group">
                <label for="recovery-email">Email Address</label>
                <input type="email" id="recovery-email" placeholder="Enter your email">
            </div>
            <div class="form-group">
                <label for="recovery-ref">Payment Reference</label>
                <input type="text" id="recovery-ref" placeholder="Enter your payment reference">
            </div>
            <button type="button" class="btn-full" id="recovery-download-btn">Get download link</button>
            <p class="secure-notice" id="recovery-status"></p>
        `;
        modalBody.appendChild(section);
        const btn = document.getElementById('recovery-download-btn');
        if (btn) btn.addEventListener('click', handleRecoveryDownload);
    }

    async function handleRecoveryDownload() {
        const email = document.getElementById('recovery-email').value.trim();
        const ref = document.getElementById('recovery-ref').value.trim();
        const statusEl = document.getElementById('recovery-status');
        if (!email || !ref) {
            if (statusEl) statusEl.textContent = 'Please enter email and payment reference.';
            return;
        }
        // find template by checking status for each? We need template id. Ask user? For simplicity, try all templates.
        let found = false;
        for (const template of templates) {
            try {
                const response = await fetch(`${API_BASE_URL}/careers/cv-templates/purchase/status?ref=${encodeURIComponent(ref)}`);
                const data = await response.json();
                if (data.success && data.data && data.data.paid && data.data.templateId === template.id) {
                    templatePurchases[template.id] = { clientReference: ref, email: email, name: template.name };
                    localStorage.setItem('templatePurchases', JSON.stringify(templatePurchases));
                    const url = await requestDownloadLink(template, { clientReference: ref, email: email });
                    triggerDownload(url);
                    if (statusEl) statusEl.textContent = 'Download started.';
                    found = true;
                    await updateTemplateButtons();
                    break;
                }
            } catch (e) {}
        }
        if (!found) {
            if (statusEl) statusEl.textContent = 'We could not confirm this payment. If you paid, email info@nedhubgh.com with your payment reference.';
        }
    }
});

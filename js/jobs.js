/**
 * Jobs Management Module
 * Handles dynamic job loading, rendering, and application functionality
 */

// Job data cache
let jobsData = [];

// Initialize jobs system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initJobs();
});

// Initialize jobs system
function initJobs() {
    loadJobs();
    setupJobEventListeners();
}

// API base URL for production deployment
const API_BASE = 'https://nedhub-production.up.railway.app';

// Load jobs from API endpoint
async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE}/api/careers/jobs`);
        if (!response.ok) {
            throw new Error('Failed to load jobs data');
        }
        const result = await response.json();
        jobsData = result.success ? result.data : (result.data || []);
        renderJobs();
        renderHomepageJobs();
        populatePositionDropdown();
        updateHiringWidget();
    } catch (error) {
        console.error('Error loading jobs:', error);
        showJobsError();
    }
}

// Update hiring widget with job count
function updateHiringWidget() {
    const widget = document.getElementById('hiring-widget');
    const countEl = document.getElementById('hiring-count');
    if (!widget || !countEl) return;
    
    const activeJobs = getActiveJobs();
    if (activeJobs.length > 0) {
        countEl.textContent = activeJobs.length;
        widget.style.display = 'block';
    } else {
        widget.style.display = 'none';
    }
}
function getJobTypeClass(type) {
    const typeMap = {
        'Full-Time': 'job-type-full-time',
        'Part-Time': 'job-type-part-time',
        'Remote': 'job-type-remote',
        'Contract': 'job-type-contract',
        'Internship': 'job-type-internship'
    };
    return typeMap[type] || 'job-type-full-time';
}

// Helper function to check if deadline is expired
function isDeadlineExpired(deadline) {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
}

// Check if value looks like an email
function isEmail(value) {
    if (!value) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
}

// Render jobs on careers page
function renderJobs() {
    const jobsGrid = document.querySelector('#jobs-container');
    console.log('renderJobs: jobsGrid element', jobsGrid);
    if (!jobsGrid) return;

    // Filter published jobs and sort by featured first
    const activeJobs = jobsData.filter(job => job.status === 'Published');
    console.log('renderJobs: activeJobs count', activeJobs.length);

    if (activeJobs.length === 0) {
        showEmptyState(jobsGrid);
        return;
    }

    jobsGrid.innerHTML = activeJobs.map((job, index) => {
         const deadlineExpired = isDeadlineExpired(job.deadline);
         const deadlineClass = deadlineExpired ? 'deadline-badge expired' : 'deadline-badge';
         const jobTypeClass = getJobTypeClass(job.type);
         const isExternal = job.applicationMethod === 'external';
         const isEmailApply = isExternal && isEmail(job.applicationUrl);
         
         const applyBtnText = isEmailApply ? 'Apply via Email' : 
             isExternal ? 'Apply Now' : 'View Details & Apply';
         const applyBtnIcon = isExternal ? '<i class="fas fa-external-link-alt"></i>' : '→';
         
         return `
         <div class="job-card scroll-animate visible${index > 0 ? ` delay-${Math.min(index, 5)}` : ''}" data-job-id="${job.id}">
             <div class="job-header">
                 <div class="job-icon">
                     <i class="fas ${job.icon}"></i>
                 </div>
                 <span class="job-badge ${jobTypeClass}">${job.type}</span>
                 ${job.featured ? '<span class="job-badge featured-badge">Featured</span>' : ''}
                 ${isExternal ? '<span class="job-badge external-badge">External</span>' : ''}
             </div>
             <h3 class="job-title">${job.title}</h3>
             ${isExternal && job.companyName ? `
             <div class="company-info" style="margin-bottom: var(--space-sm); color: var(--text-light);">
                 <i class="fas fa-building"></i> ${escapeHtml(job.companyName)}
             </div>
             ` : ''}
             <div class="job-details">
                 <div class="job-detail">
                     <i class="fas fa-map-marker-alt"></i>
                     <span>${job.location}</span>
                 </div>
                 <div class="job-detail">
                     <i class="fas fa-clock"></i>
                     <span>${job.type}</span>
                 </div>
                 <div class="job-detail">
                     <i class="fas fa-money-bill-wave"></i>
                     <span>${job.salary}</span>
                 </div>
                 ${job.deadline ? `
                 <div class="job-detail">
                     <i class="fas fa-calendar-alt"></i>
                     <span>Deadline: ${formatDate(job.deadline)}</span>
                 </div>
                 ` : ''}
             </div>
             <p class="job-description">${job.description}</p>
             ${!isExternal ? `
             <div class="job-requirements">
                 <h4>Key Requirements</h4>
                 <ul>
                     ${(job.requirements || []).map(req => `<li><i class="fas fa-check"></i> ${req}</li>`).join('')}
                 </ul>
             </div>
             ` : ''}
<button class="btn btn-primary view-job-details" data-job-id="${job.id}" data-apply-type="${isEmailApply ? 'email' : isExternal ? 'url' : 'internal'}" style="width: 100%; justify-content: center;">
                  <span class="btn-text">${applyBtnText}</span>
                  <span class="btn-icon">${applyBtnIcon}</span>
              </button>
          </div>
 `;
       }).join('');
         
     console.log('renderJobs: jobs grid populated, child count', jobsGrid.children.length);
         
     // Add event listeners to job detail buttons
     setupJobDetailButtons();
 }

 // Render latest jobs on homepage
function renderHomepageJobs() {
    const homepageJobsContainer = document.getElementById('homepage-jobs');
    if (!homepageJobsContainer) return;
    
    // Get latest 3 published jobs
    const latestJobs = jobsData.filter(job => job.status === 'Published').slice(0, 3);
    
    if (latestJobs.length === 0) {
        homepageJobsContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: var(--space-xxl);">
                <i class="fas fa-briefcase" style="font-size: 3rem; color: var(--accent-orange); margin-bottom: var(--space-md);"></i>
                <h3>No Open Positions</h3>
                <p>We don't have any open positions at the moment. Please check back later.</p>
            </div>
        `;
        return;
    }
    
homepageJobsContainer.innerHTML = latestJobs.map((job, index) => {
         const jobTypeClass = getJobTypeClass(job.type);
         const isExternal = job.applicationMethod === 'external';
         
         return `
         <div class="job-card scroll-animate visible${index > 0 ? ` delay-${index}` : ''}" data-job-id="${job.id}">
            <div class="job-header">
                <div class="job-icon">
                    <i class="fas ${job.icon}"></i>
                </div>
                <span class="job-badge ${jobTypeClass}">${job.type}</span>
            </div>
            <h3 class="job-title">${job.title}</h3>
            <div class="job-details">
                <div class="job-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${job.location}</span>
                </div>
                <div class="job-detail">
                    <i class="fas fa-clock"></i>
                    <span>${job.type}</span>
                </div>
            </div>
            <p class="job-description">${job.description.substring(0, 120)}...</p>
            <button class="btn btn-primary view-job-details" data-job-id="${job.id}" style="width: 100%; justify-content: center;">
                <span class="btn-text">View Details</span>
                <span class="btn-icon">→</span>
            </button>
        </div>
    `;
    }).join('');
    
    // Add event listeners to job detail buttons
    setupJobDetailButtons();
}

// Show empty state
function showEmptyState(container) {
    container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: var(--space-xxl);">
            <i class="fas fa-briefcase" style="font-size: 4rem; color: var(--accent-orange); margin-bottom: var(--space-lg);"></i>
            <h3>No Open Positions</h3>
            <p>We don't have any open positions at the moment. Please check back later or contact us for future opportunities.</p>
            <a href="contact.html" class="btn btn-primary" style="margin-top: var(--space-md);">
                <span class="btn-text">Contact Us</span>
                <span class="btn-icon">→</span>
            </a>
        </div>
    `;
}

// Show error state
function showJobsError() {
    const jobsGrid = document.querySelector('#jobs-container');
    if (jobsGrid) {
        jobsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: var(--space-xxl);">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--accent-orange); margin-bottom: var(--space-lg);"></i>
                <h3>Unable to Load Jobs</h3>
                <p>We're experiencing technical difficulties loading job listings. Please try again later.</p>
            </div>
        `;
    }
}

// Setup job detail modal
function setupJobDetailButtons() {
    const detailButtons = document.querySelectorAll('.view-job-details');
    detailButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const jobId = e.currentTarget.getAttribute('data-job-id');
            openJobModal(jobId);
        });
    });
}

// Open job detail modal
function openJobModal(jobId) {
    const job = jobsData.find(j => j.id === jobId);
    if (!job) return;
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('job-modal');
    if (!modal) {
        modal = createJobModal();
        document.body.appendChild(modal);
    }
    
const isExternal = job.applicationMethod === 'external';
    const isEmailApply = isExternal && isEmail(job.applicationUrl);
    const applyHref = isEmailApply ? `mailto:${job.applicationUrl}` : job.applicationUrl;
    const applyTarget = isEmailApply ? '' : ' target="_blank"';
    const applyText = isEmailApply ? 'Apply via Email' : 'Apply on Company Website';
    
    const applyButton = isExternal 
        ? `<a href="${applyHref}"${applyTarget} class="btn btn-primary btn-large" onclick="trackExternalApplication('${job.id}')">
            <span class="btn-text">${applyText}</span>
            <span class="btn-icon"><i class="fas ${isEmailApply ? 'fa-envelope' : 'fa-external-link-alt'}"></i></span>
        </a>`
        : `<a href="#apply" class="btn btn-primary btn-large" onclick="selectJob('${job.title}')">
            <span class="btn-text">Apply for this Position</span>
            <span class="btn-icon">→</span>
        </a>`;
    
    const companyInfo = isExternal ? `
        <div class="company-info" style="margin-bottom: var(--space-lg); padding: var(--space-md); background: rgba(247, 127, 0, 0.1); border-radius: var(--radius-md);">
            <h4 style="margin-bottom: var(--space-xs);"><i class="fas fa-building"></i> External Opportunity</h4>
            <p style="margin: 0;">This position is posted by <strong>${escapeHtml(job.companyName)}</strong>. ${isEmailApply ? 'Click the button below to apply via email.' : 'Click the button below to apply directly on their website.'}</p>
        </div>
    ` : '';
    
// Populate modal with job data
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <div class="job-icon" style="width: 60px; height: 60px; font-size: 1.5rem;">
                <i class="fas ${job.icon}"></i>
            </div>
            <span class="job-badge">${job.type}</span>
            ${job.featured ? '<span class="job-badge featured-badge">Featured</span>' : ''}
            <button class="modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body">
            <h2 class="job-title" style="font-size: var(--font-size-xxxl); margin-bottom: var(--space-md);">${job.title}</h2>
            ${companyInfo}
            <div class="job-details" style="margin-bottom: var(--space-lg);">
                <div class="job-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${job.location}</span>
                </div>
                <div class="job-detail">
                    <i class="fas fa-clock"></i>
                    <span>${job.type}</span>
                </div>
                <div class="job-detail">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>${job.salary}</span>
                </div>
                ${job.deadline ? `
                <div class="job-detail">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Application Deadline: ${formatDate(job.deadline)}</span>
                </div>
                ` : ''}
            </div>
            <p class="job-description" style="margin-bottom: var(--space-lg);">${job.description}</p>
            ${!isExternal ? `
            <div class="job-requirements">
                <h4 style="margin-bottom: var(--space-sm);">Key Requirements</h4>
                <ul>
                    ${(job.requirements || []).map(req => `<li><i class="fas fa-check"></i> ${req}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        <div class="modal-footer">
            ${applyButton}
            <button class="btn btn-secondary btn-large modal-close">
                <span class="btn-text">Close</span>
            </button>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Setup close handlers
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeJobModal);
    });
    
    // Close on overlay click
    modal.querySelector('.modal-overlay').addEventListener('click', closeJobModal);
    
    // Close on escape key
    document.addEventListener('keydown', handleEscapeKey);
}

// Track external application click
function trackExternalApplication(jobId) {
    // Could log analytics here
    closeJobModal();
}

// Create job modal element
function createJobModal() {
    const modal = document.createElement('div');
    modal.id = 'job-modal';
    modal.className = 'job-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-container">
            <div class="modal-content"></div>
        </div>
    `;
    return modal;
}

// Close job modal
function closeJobModal() {
    const modal = document.getElementById('job-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    document.removeEventListener('keydown', handleEscapeKey);
}

// Handle escape key
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeJobModal();
    }
}

// Setup event listeners
function setupJobEventListeners() {
    // Listen for job data updates (for admin functionality)
    window.addEventListener('jobsUpdated', (e) => {
        jobsData = e.detail;
        renderJobs();
        renderHomepageJobs();
    });
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Get job by ID
function getJobById(id) {
    return jobsData.find(job => job.id === id);
}

// Get all active jobs
function getActiveJobs() {
    return jobsData.filter(job => job.status === 'Published');
}

// Populate position dropdown dynamically
function populatePositionDropdown() {
    const positionSelect = document.getElementById('position');
    if (!positionSelect) return;
    
    // Clear existing options except the first one
    const firstOption = positionSelect.querySelector('option[value=""]');
    positionSelect.innerHTML = '';
    positionSelect.appendChild(firstOption);
    
    // Add only internal job options
    const internalJobs = getActiveJobs().filter(job => job.applicationMethod !== 'external');
    internalJobs.forEach(job => {
        const option = document.createElement('option');
        option.value = job.title;
        option.textContent = job.title;
        positionSelect.appendChild(option);
    });
    
    // Add "Other" option
    const otherOption = document.createElement('option');
    otherOption.value = 'Other';
    otherOption.textContent = 'Other';
    positionSelect.appendChild(otherOption);
}

// Make functions available globally for inline handlers
window.selectJob = function(jobTitle) {
    const positionSelect = document.getElementById('position');
    if (positionSelect) {
        positionSelect.value = jobTitle;
        // Scroll to application form
        const applySection = document.getElementById('apply');
        if (applySection) {
            applySection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    closeJobModal();
};

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
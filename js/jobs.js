/**
 * Jobs Management Module
 * Handles dynamic job loading, rendering, and application functionality
 */

// Job data cache
let jobsData = [];
let activeCategory = null;

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

// All available categories
const ALL_CATEGORIES = [
    'Administration & Office Support',
    'Accounting, Finance & Audit',
    'Banking & Financial Services',
    'Human Resources',
    'Information Technology (IT)',
    'Engineering & Technical',
    'Healthcare & Medical',
    'Education & Training',
    'Sales & Marketing',
    'Customer Service & Call Centre',
    'Procurement, Logistics & Supply Chain',
    'Hospitality, Hotel & Restaurant',
    'Retail & FMCG',
    'Oil & Gas / Fuel Station Jobs',
    'Construction & Real Estate',
    'Manufacturing & Production',
    'Agriculture & Agribusiness',
    'Domestic & Household Services',
    'Drivers & Transportation',
    'Security & Safety',
    'Cleaning & Maintenance',
    'Skilled Trades & Artisans',
    'Legal & Compliance',
    'NGO, Development & Social Impact',
    'Executive & Management',
    'Internships & Graduate Trainee',
    'Remote & Freelance Jobs',
    'Part-Time & Temporary Jobs',
    'Government & Public Sector',
    'Other Jobs'
];

// Load jobs from API endpoint
async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE}/api/careers/jobs`);
        if (!response.ok) {
            throw new Error('Failed to load jobs data');
        }
        const result = await response.json();
        jobsData = result.success ? result.data : (result.data || []);
        renderCategoryFilters();
        renderJobs();
        renderHomepageJobs();
        populatePositionDropdown();
        preselectJobFromUrl();
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

// Render category filter chips
function renderCategoryFilters() {
    const filterContainer = document.getElementById('category-filters');
    if (!filterContainer) return;

    // Get job counts by category
    const publishedJobs = jobsData.filter(job => job.status === 'Published');
    const categoryCounts = {};
    publishedJobs.forEach(job => {
        const cat = job.category || 'Other Jobs';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Build filter HTML
    let html = '<button class="category-chip active" data-category="all">All (' + publishedJobs.length + ')</button>';
    
    ALL_CATEGORIES.forEach(category => {
        if (categoryCounts[category] && categoryCounts[category] > 0) {
            const count = categoryCounts[category];
            const isActive = activeCategory === category;
            html += `<button class="category-chip ${isActive ? 'active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)} (${count})</button>`;
        }
    });

    filterContainer.innerHTML = html;

    // Add event listeners
    const chips = filterContainer.querySelectorAll('.category-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            setActiveCategoryFilter(category);
        });
    });
}

// Set active category and re-render
function setActiveCategoryFilter(category) {
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(c => c.classList.remove('active'));
    
    if (category === 'all') {
        activeCategory = null;
        document.querySelector('.category-chip[data-category="all"]').classList.add('active');
    } else {
        activeCategory = category;
        document.querySelector(`.category-chip[data-category="${CSS.escape(category)}"]`).classList.add('active');
    }
    
    renderJobs();
}

// Render jobs on careers page
function renderJobs() {
    const jobsGrid = document.querySelector('#jobs-container');
    console.log('renderJobs: jobsGrid element', jobsGrid);
    if (!jobsGrid) return;

    // Filter by category first, then by published status
    let filteredJobs = jobsData;
    if (activeCategory) {
        filteredJobs = filteredJobs.filter(job => job.category === activeCategory);
    }
    const activeJobs = filteredJobs.filter(job => job.status === 'Published');
    console.log('renderJobs: activeJobs count', activeJobs.length);

    if (activeJobs.length === 0) {
        showEmptyState(jobsGrid, activeCategory);
        return;
    }

jobsGrid.innerHTML = activeJobs.map((job, index) => {
         const deadlineExpired = isDeadlineExpired(job.deadline);
         const deadlineText = job.deadline ? `Deadline: ${formatDate(job.deadline)}` : 'No deadline';
         const deadlineClass = deadlineExpired ? 'expired' : '';
         const jobTypeClass = getJobTypeClass(job.type);
         const categoryClass = getCategoryClass(job.category);
         const isExternal = job.applicationMethod === 'external';
         const isEmailApply = isExternal && isEmail(job.applicationUrl);
        
         const viewBtnText = 'View Details';
         const applyBtnText = isEmailApply ? 'Apply via Email' : isExternal ? 'Apply Now' : 'Apply';
         const applyBtnClass = isExternal ? 'btn-primary' : 'btn-secondary';
         const applyBtnIcon = isExternal ? '<i class="fas fa-external-link-alt"></i>' : '<i class="fas fa-paper-plane"></i>';
         const applyHref = isExternal 
             ? (isEmailApply ? `mailto:${job.applicationUrl}` : job.applicationUrl) 
             : '#apply';
        
          const descriptionText = job.description.length > 150 ? job.description.substring(0, 150) + '...' : job.description;
          const descriptionHtml = formatDescription(descriptionText);
         
          return `
          <div class="job-card scroll-animate visible${index > 0 ? ` delay-${Math.min(index, 5)}` : ''}${job.featured ? ' featured' : ''}" data-job-id="${job.id}" data-category="${job.category || ''}">
              <div class="job-card-header">
                  ${job.featured ? '<span class="featured-badge"><i class="fas fa-star"></i> Featured</span>' : ''}
                  <a href="job.html?id=${job.id}" class="job-title-link" data-job-id="${job.id}">${escapeHtml(job.title)}</a>
                  ${job.category ? `<span class="category-badge ${categoryClass}"><i class="fas fa-tag"></i> ${escapeHtml(job.category)}</span>` : ''}
              </div>
              
              <div class="job-company">
                  ${isExternal && job.companyName ? `
                      <h4 class="company-name">${escapeHtml(job.companyName)}</h4>
                  ` : ''}
                  <div class="job-location">
                      <i class="fas fa-map-marker-alt"></i>
                      <span>${escapeHtml(job.location)}</span>
                  </div>
              </div>
              
              <div class="job-summary">${descriptionHtml}</div>
             
             <div class="job-metadata-row">
                 <span class="job-chip employment-type"><i class="fas fa-briefcase"></i> ${escapeHtml(job.type)}</span>
                 ${job.remote ? `<span class="job-chip remote-onsite"><i class="fas fa-wifi"></i> ${job.remote}</span>` : ''}
                 <span class="job-chip experience-level"><i class="fas fa-chart-line"></i> ${getExperienceLevel(job)}</span>
             </div>
             
             <div class="job-footer">
                 <div class="job-deadline ${deadlineClass}">
                     <i class="fas fa-calendar-alt"></i>
                     <span>${deadlineText}</span>
                 </div>
                 <div class="job-actions">
                     <a href="job.html?id=${job.id}" class="btn btn-secondary" style="flex: 1;">
                         <span class="btn-text">${viewBtnText}</span>
                     </a>
                     <a href="${applyHref}" class="btn ${applyBtnClass}" ${isExternal && !isEmailApply ? 'target="_blank"' : ''} style="flex: 1;" onclick="${!isExternal ? "selectJob('" + job.title.replace(/'/g, "\\'") + "'); return true;" : ""}">
                         <span class="btn-text">${applyBtnText}</span>
                         <span class="btn-icon">${applyBtnIcon}</span>
                     </a>
                 </div>
             </div>
         </div>
     `;
        }).join('');
           
     console.log('renderJobs: jobs grid populated, child count', jobsGrid.children.length);
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
         const categoryClass = getCategoryClass(job.category);
         const isExternal = job.applicationMethod === 'external';
         
          const descriptionText = job.description.length > 120 ? job.description.substring(0, 120) + '...' : job.description;
          const descriptionHtml = formatDescription(descriptionText);
          
          return `
          <div class="job-card scroll-animate visible${index > 0 ? ` delay-${index}` : ''}" data-job-id="${job.id}">
              <div class="job-card-header">
                  <a href="job.html?id=${job.id}" class="job-title-link" data-job-id="${job.id}">${escapeHtml(job.title)}</a>
                  ${job.category ? `<span class="category-badge ${categoryClass}"><i class="fas fa-tag"></i> ${escapeHtml(job.category)}</span>` : ''}
              </div>
              
              <div class="job-company">
                  ${isExternal && job.companyName ? `<h4 class="company-name">${escapeHtml(job.companyName)}</h4>` : ''}
                  <div class="job-location">
                      <i class="fas fa-map-marker-alt"></i>
                      <span>${escapeHtml(job.location)}</span>
                  </div>
              </div>
              
              <div class="job-summary">${descriptionHtml}</div>
             
             <div class="job-metadata-row">
                 <span class="job-chip employment-type"><i class="fas fa-briefcase"></i> ${escapeHtml(job.type)}</span>
                 <span class="job-chip experience-level"><i class="fas fa-chart-line"></i> ${getExperienceLevel(job)}</span>
             </div>
             
             <div class="job-actions">
                 <a href="job.html?id=${job.id}" class="btn btn-secondary" style="flex: 1;">
                     <span class="btn-text">View Details</span>
                 </a>
                 <a href="job.html?id=${job.id}" class="btn btn-primary" style="flex: 1;">
                     <span class="btn-text">Apply</span>
                     <span class="btn-icon">→</span>
                 </a>
             </div>
         </div>
     `;
     }).join('');
 }

// Show empty state
function showEmptyState(container, category) {
    const message = category ? `No jobs found in "${escapeHtml(category)}" category.` : 'We don\'t have any open positions at the moment.';
    container.innerHTML = `
        <div class="empty-state-jobs scroll-animate visible">
            <i class="fas fa-briefcase"></i>
            <h3>No Open Positions</h3>
            <p>${message} Please check back later or contact us for future opportunities.</p>
            <a href="contact.html" class="btn btn-primary">
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

// Get category class for styling
function getCategoryClass(category) {
    if (!category) return 'category-default';
    const catLower = category.toLowerCase();
    if (catLower.includes('it') || catLower.includes('information technology')) return 'category-it';
    if (catLower.includes('finance') || catLower.includes('accounting')) return 'category-finance';
    if (catLower.includes('healthcare') || catLower.includes('medical')) return 'category-healthcare';
    if (catLower.includes('engineering') || catLower.includes('technical')) return 'category-engineering';
    if (catLower.includes('remote') || catLower.includes('freelance')) return 'category-remote';
    if (catLower.includes('human resource') || catLower.includes('hr')) return 'category-hr';
    if (catLower.includes('executive') || catLower.includes('management')) return 'category-executive';
    if (catLower.includes('intern') || catLower.includes('graduate trainee')) return 'category-intern';
    return 'category-default';
}

// Get experience level from job requirements or type
function getExperienceLevel(job) {
    // Check if job has explicit experienceLevel field
    if (job.experienceLevel) return job.experienceLevel;
    
    // Derive from type or title
    const title = (job.title || '').toLowerCase();
    if (title.includes('senior') || title.includes('lead')) return 'Senior';
    if (title.includes('junior') || title.includes('entry')) return 'Entry';
    return 'Mid';
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

// Filter jobs by category
function filterJobsByCategory(category) {
    activeCategory = category;
    renderJobs();
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
};

// Preselect a job from the URL ?job=JOB_ID parameter, falling back to localStorage
function preselectJobFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job') || urlParams.get('jobId');

    let jobTitleToSelect = null;

    if (jobId) {
        const job = jobsData.find(j => String(j.id) === String(jobId));
        if (job) {
            if (job.applicationMethod !== 'external') {
                jobTitleToSelect = job.title;
            } else {
                console.warn('[Jobs] Job is external, not preselecting in dropdown');
            }
        } else {
            console.warn('[Jobs] Job with ID not found in jobs list:', jobId);
        }
    }

    // Fall back to localStorage if no URL parameter or job not found
    if (!jobTitleToSelect) {
        const selectedJob = localStorage.getItem('selectedJob');
        if (selectedJob) {
            jobTitleToSelect = selectedJob;
        }
        localStorage.removeItem('selectedJob');
        localStorage.removeItem('selectedJobId');
    }

    if (jobTitleToSelect) {
        const positionSelect = document.getElementById('position');
        if (positionSelect) {
            positionSelect.value = jobTitleToSelect;
            const applySection = document.getElementById('apply');
            if (applySection) {
                applySection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    } else if (jobId) {
        console.warn('[Jobs] No job to preselect for jobId:', jobId);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format description text with proper HTML list support
function formatDescription(text) {
    if (!text) return '<p>No description available.</p>';

    const blocks = text.split('\n\n');

    return blocks.map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';

        const lines = trimmed.split('\n').filter(line => line.trim());
        if (lines.length === 0) return '';

        let html = '';
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();
            const unorderedMatch = line.match(/^[•\*\-\+]\s+(.+)$/);
            const orderedMatch = line.match(/^\d+\.\s+(.+)$/);

            if (unorderedMatch) {
                const items = [];
                while (i < lines.length) {
                    const l = lines[i].trim();
                    const m = l.match(/^[•\*\-\+]\s+(.+)$/);
                    if (m) {
                        items.push(m[1]);
                        i++;
                    } else {
                        break;
                    }
                }
                html += '<ul class="job-content-list job-content-list--unordered">' + items.map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>';
            } else if (orderedMatch) {
                const items = [];
                while (i < lines.length) {
                    const l = lines[i].trim();
                    const m = l.match(/^\d+\.\s+(.+)$/);
                    if (m) {
                        items.push(m[1]);
                        i++;
                    } else {
                        break;
                    }
                }
                html += '<ol class="job-content-list job-content-list--ordered">' + items.map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ol>';
            } else {
                const paras = [];
                while (i < lines.length) {
                    const l = lines[i].trim();
                    const um = l.match(/^[•\*\-\+]\s+(.+)$/);
                    const om = l.match(/^\d+\.\s+(.+)$/);
                    if (!um && !om) {
                        paras.push(l);
                        i++;
                    } else {
                        break;
                    }
                }
                if (paras.length > 0) {
                    html += '<p>' + escapeHtml(paras.join(' ')) + '</p>';
                }
            }
        }

        return html;
    }).join('');
}
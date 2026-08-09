/**
 * Job Detail Page Module
 * Handles loading and rendering individual job details
 */

// API base URL for production deployment
const API_BASE = 'https://nedhub-production.up.railway.app';

// Initialize job detail page
document.addEventListener('DOMContentLoaded', function() {
    initJobDetail();
});

// Initialize job detail functionality
function initJobDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');
    
    if (!jobId) {
        showError('No job ID provided');
        return;
    }
    
    loadJobDetails(jobId);
    setupShareButtons();
}

// Load job details from API
async function loadJobDetails(jobId) {
    try {
        const response = await fetch(`${API_BASE}/api/careers/jobs/${jobId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showError('Job not found. The position may have expired or been removed.');
            } else {
                showError('Unable to load job details. Please try again later.');
            }
            return;
        }
        
        const result = await response.json();
        
        if (!result.success) {
            showError(result.message || 'Failed to load job');
            return;
        }
        
        const job = result.data;
        renderJobDetails(job);
        loadRelatedJobs(job.category, jobId);
        updateSEO(job);
        
    } catch (error) {
        console.error('Error loading job details:', error);
        showError('Unable to load job details. Please check your connection and try again.');
    }
}

// Render job details on the page
function renderJobDetails(job) {
    // Hide loading, show content
    document.getElementById('loading-state').style.display = 'none';
    document.querySelector('.job-detail-page').style.display = 'block';
    
    // Update hero section
    document.getElementById('job-title').textContent = job.title || 'Untitled Position';
    
    // Update category badge
    const categoryBadge = document.getElementById('job-category-badge');
    const categorySpan = categoryBadge.querySelector('span');
    if (categorySpan) {
        categorySpan.textContent = job.category || 'Category';
    }
    
    // Update type badge
    const typeBadge = document.getElementById('job-type-badge');
    const typeSpan = typeBadge.querySelector('span');
    if (typeSpan) {
        typeSpan.textContent = job.type || 'Full-Time';
    }
    
    // Handle featured badge
    const featuredBadge = document.getElementById('job-featured-badge');
    if (job.featured) {
        featuredBadge.style.display = 'inline-flex';
    }
    
// Handle company info for external jobs
    const companyInfo = document.getElementById('job-company-info');

    if (job.applicationMethod === 'external' && job.companyName) {
        companyInfo.style.display = 'flex';
        document.getElementById('job-company-name').textContent = job.companyName;

        const logoContainer = document.getElementById('job-company-logo-container');
        const logoImg = document.getElementById('job-company-logo');
        const logoPlaceholder = document.getElementById('job-company-logo-placeholder');

        if (job.companyLogo && isValidImageUrl(job.companyLogo)) {
            logoImg.src = job.companyLogo;
            logoImg.style.display = 'block';
            logoPlaceholder.style.display = 'none';
        } else {
            logoImg.style.display = 'none';
            logoPlaceholder.style.display = 'flex';
            const initials = getCompanyInitials(job.companyName);
            logoPlaceholder.textContent = initials;
        }
    }
    
    // Update meta row
    document.getElementById('job-location-text').textContent = job.location || 'Location not specified';
    
    // Format posted date
    if (job.createdAt) {
        const postedDate = new Date(job.createdAt);
        document.getElementById('job-posted-date').textContent = `Posted: ${formatPostedDate(postedDate)}`;
    }
    
    // Update deadline in hero
    const deadlineHero = document.getElementById('job-deadline-hero');
    const deadlineText = document.getElementById('job-deadline-text');
    if (job.deadline) {
        deadlineHero.style.display = 'flex';
        deadlineText.textContent = `Deadline: ${formatDate(job.deadline)}`;
    }
    
    // Update description
    document.getElementById('job-description').innerHTML = formatDescription(job.description);
    
    // Update responsibilities
    const responsibilitiesSection = document.getElementById('responsibilities-section');
    const responsibilitiesList = document.getElementById('job-responsibilities');
    if (job.responsibilities && job.responsibilities.length > 0) {
        responsibilitiesSection.style.display = 'block';
        responsibilitiesList.innerHTML = job.responsibilities
            .map(item => `<li><i class="fas fa-check"></i> ${escapeHtml(item)}</li>`)
            .join('');
    }
    
    // Update requirements
    const requirementsSection = document.getElementById('requirements-section');
    const requirementsList = document.getElementById('job-requirements');
    if (job.requirements && job.requirements.length > 0) {
        requirementsSection.style.display = 'block';
        requirementsList.innerHTML = job.requirements
            .map(item => `<li><i class="fas fa-check"></i> ${escapeHtml(item)}</li>`)
            .join('');
    }
    
    // Update benefits (derived from job data or default)
    const benefitsSection = document.getElementById('benefits-section');
    const benefitsList = document.getElementById('job-benefits');
    const benefits = getBenefitsFromJob(job);
    if (benefits.length > 0) {
        benefitsSection.style.display = 'block';
        benefitsList.innerHTML = benefits
            .map(item => `<li><i class="fas fa-gift"></i> ${escapeHtml(item)}</li>`)
            .join('');
    }
    
    // Update sidebar details
    document.getElementById('sidebar-job-type').textContent = job.type || 'Not specified';
    document.getElementById('sidebar-job-category').textContent = job.category || 'Not specified';
    document.getElementById('sidebar-job-location').textContent = job.location || 'Not specified';
    
    const applicationMethod = job.applicationMethod === 'external' ? 'External' : 'Internal';
    document.getElementById('sidebar-application-method').textContent = applicationMethod;
    
    // Update deadline in sidebar
    const sidebarDeadline = document.getElementById('sidebar-deadline');
    const sidebarDeadlineValue = document.getElementById('sidebar-deadline-value');
    const sidebarDeadlineStatus = document.getElementById('sidebar-deadline-status');
    
    if (job.deadline) {
        const deadlineDate = new Date(job.deadline);
        const now = new Date();
        sidebarDeadlineValue.textContent = formatDate(job.deadline);
        
        if (deadlineDate < now) {
            sidebarDeadlineStatus.textContent = 'Closed';
            sidebarDeadlineStatus.classList.add('expired');
            sidebarDeadlineStatus.classList.remove('active');
        } else {
            sidebarDeadlineStatus.textContent = 'Open';
            sidebarDeadlineStatus.classList.add('active');
            sidebarDeadlineStatus.classList.remove('expired');
        }
    } else {
        sidebarDeadlineValue.textContent = 'Rolling applications';
        sidebarDeadlineStatus.textContent = 'Ongoing';
        sidebarDeadlineStatus.classList.add('active');
    }
    
    // Update apply button
    const applyButton = document.getElementById('apply-button');
    const mobileApplyButton = document.getElementById('mobile-apply-button');
    const mobileStickyCta = document.getElementById('mobile-sticky-cta');
    
    if (job.applicationMethod === 'external') {
        const isEmailLink = isEmail(job.applicationUrl);
        const applyHref = isEmailLink ? `mailto:${job.applicationUrl}` : job.applicationUrl;
        const applyText = isEmailLink ? 'Apply via Email' : 'Apply on Company Site';
        const applyIcon = isEmailLink ? 'fa-envelope' : 'fa-external-link-alt';
        
        applyButton.href = applyHref;
        applyButton.target = isEmailLink ? '' : '_blank';
        applyButton.innerHTML = `<span class="btn-text">${applyText}</span> <i class="fas ${applyIcon}"></i>`;
        
        if (mobileApplyButton) {
            mobileApplyButton.href = applyHref;
            mobileApplyButton.target = isEmailLink ? '' : '_blank';
            mobileApplyButton.innerHTML = `<span class="btn-text">${applyText}</span> <i class="fas ${applyIcon}"></i>`;
        }
    } else {
        const applyUrl = `careers.html?job=${encodeURIComponent(job.id)}#apply`;
        applyButton.href = applyUrl;
        applyButton.innerHTML = '<span class="btn-text">Apply Now</span> <i class="fas fa-arrow-right"></i>';
        applyButton.addEventListener('click', function() {
            localStorage.setItem('selectedJob', job.title);
            localStorage.setItem('selectedJobId', String(job.id));
        });
        
        if (mobileApplyButton) {
            mobileApplyButton.href = applyUrl;
            mobileApplyButton.innerHTML = '<span class="btn-text">Apply Now</span> <i class="fas fa-arrow-right"></i>';
            mobileApplyButton.addEventListener('click', function() {
                localStorage.setItem('selectedJob', job.title);
                localStorage.setItem('selectedJobId', String(job.id));
            });
        }
    }
    
    // Check if job is expired
    const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;
    
    if (isExpired) {
        const expiredText = 'Applications Closed';
        const expiredIcon = 'fa-ban';
        
        applyButton.href = '#';
        applyButton.classList.add('btn-disabled');
        applyButton.innerHTML = `<span class="btn-text">${expiredText}</span> <i class="fas ${expiredIcon}"></i>`;
        applyButton.style.opacity = '0.6';
        applyButton.style.pointerEvents = 'none';
        
        if (mobileApplyButton) {
            mobileApplyButton.href = '#';
            mobileApplyButton.classList.add('btn-disabled');
            mobileApplyButton.innerHTML = `<span class="btn-text">${expiredText}</span> <i class="fas ${expiredIcon}"></i>`;
            mobileApplyButton.style.opacity = '0.6';
            mobileApplyButton.style.pointerEvents = 'none';
        }
    }
}

// Get benefits from job or return defaults
function getBenefitsFromJob(job) {
    if (job.benefits && job.benefits.length > 0) {
        return job.benefits;
    }
    // Default benefits for internal jobs
    if (job.applicationMethod !== 'external') {
        return [
            'Competitive salary package',
            'Health insurance coverage',
            'Professional development opportunities',
            'Work-life balance',
            'Friendly team environment'
        ];
    }
    return [];
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

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format posted date (relative time)
function formatPostedDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return formatDate(date);
}

// Check if value is email
function isEmail(value) {
    if (!value) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
}

// Load related jobs from same category
async function loadRelatedJobs(category, currentJobId) {
    try {
        const response = await fetch(`${API_BASE}/api/careers/jobs?category=${encodeURIComponent(category)}`);
        
        if (!response.ok) {
            return;
        }
        
        const result = await response.json();
        
        if (!result.success) {
            return;
        }
        
        // Filter out current job and get up to 4 related jobs
        const relatedJobs = result.data.filter(job => job.id !== currentJobId).slice(0, 4);
        
        if (relatedJobs.length === 0) {
            return;
        }
        
        const container = document.getElementById('related-jobs-grid');
        container.innerHTML = relatedJobs.map(job => createRelatedJobCard(job)).join('');
        
        document.getElementById('related-jobs-section').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading related jobs:', error);
    }
}

// Create a premium job card for related jobs
function createRelatedJobCard(job) {
    const deadlineInfo = job.deadline ? formatDate(job.deadline) : 'Rolling applications';
    
    return `
    <div class="related-job-card" data-job-id="${job.id}">
        <div class="related-job-header">
            <h3 class="related-job-title">
                <a href="job.html?id=${job.id}" class="related-job-title-link">${escapeHtml(job.title)}</a>
            </h3>
            ${job.featured ? '<span class="related-job-featured"><i class="fas fa-star"></i> Featured</span>' : ''}
        </div>
        <div class="related-job-meta">
            <div class="related-job-meta-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${escapeHtml(job.location)}</span>
            </div>
            ${job.category ? `<span class="related-job-category"><i class="fas fa-tag"></i> ${escapeHtml(job.category)}</span>` : ''}
            <div class="related-job-deadline">
                <i class="fas fa-hourglass-half"></i>
                <span>Deadline: ${deadlineInfo}</span>
            </div>
        </div>
        <div class="related-job-footer">
            <a href="job.html?id=${job.id}" class="related-job-btn">
                <span>View Job</span>
                <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    </div>
    `;
}

// Update SEO meta tags
function updateSEO(job) {
    // Update document title
    document.title = `${job.title || 'Job'} | ${job.applicationMethod === 'external' ? (job.companyName || '') + ' | ' : ''}Careers | Nedhub`;
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    const description = job.description 
        ? job.description.substring(0, 160) + (job.description.length > 160 ? '...' : '')
        : `View job details for ${job.title} at Nedhub Ghana`;
    if (metaDesc) {
        metaDesc.content = description;
    }
    
    // Update Open Graph tags
    updateMetaTag('property', 'og:title', `${job.title} | Nedhub Careers`);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', window.location.href);
    updateMetaTag('property', 'og:type', 'article');
    
    // Update Twitter cards
    updateMetaTag('name', 'twitter:title', `${job.title} | Nedhub Careers`);
    updateMetaTag('name', 'twitter:description', description);
}

// Helper to update or create meta tags
function updateMetaTag(attrName, attrValue, content) {
    let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (meta) {
        meta.content = content;
    } else {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrValue);
        meta.content = content;
        document.head.appendChild(meta);
    }
}

// Setup share buttons
function setupShareButtons() {
    // Copy link button
    document.getElementById('copy-link-btn').addEventListener('click', async function() {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            showCopyToast('Link copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showCopyToast('Link copied to clipboard!');
        }
    });
    
    // Share button
    document.getElementById('share-btn').addEventListener('click', async function() {
        const jobTitle = document.getElementById('job-title').textContent;
        const url = window.location.href;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${jobTitle} | Nedhub Careers`,
                    text: `Check out this job opportunity at Nedhub Ghana`,
                    url: url
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy link and show message
            await navigator.clipboard.writeText(url);
            showCopyToast('Link copied to share!');
        }
    });
}

// Show copy toast notification
function showCopyToast(message) {
    const toast = document.getElementById('copy-toast');
    const toastText = toast.querySelector('span');
    if (toastText) {
        toastText.textContent = message;
    }
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show error state
function showError(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.querySelector('.job-detail-page').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    document.getElementById('error-message').textContent = message;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check if a URL is a valid image URL
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed === '') return false;
    // Handle relative URLs (e.g., /uploads/logo.png, uploads/logo.png)
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.bmp', '.avif'];
        const lowerTrimmed = trimmed.toLowerCase();
        if (imageExtensions.some(ext => lowerTrimmed.endsWith(ext))) return true;
        // Relative URL without extension but with image path patterns
        const imagePathPatterns = ['/upload/', '/image/', '/photo/', '/asset/'];
        if (imagePathPatterns.some(pattern => trimmed.includes(pattern))) return true;
        // If it's a relative path that looks like an image, assume it is
        return true;
    }
    try {
        const parsed = new URL(trimmed);
        const pathname = parsed.pathname.toLowerCase();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.bmp', '.avif'];
        if (imageExtensions.some(ext => pathname.endsWith(ext))) return true;
        // Cloudinary and similar CDN URLs often don't have file extensions
        // Check for common image CDN patterns
        const imageCdnPatterns = ['/upload/', '/image/', '/photo/', '/asset/', '.cloudinary', 'imgix', 'images.unsplash'];
        if (imageCdnPatterns.some(pattern => trimmed.includes(pattern))) return true;
        // If it's a valid URL with http/https, assume it could be an image
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

// Get company initials for placeholder
function getCompanyInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}
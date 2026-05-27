/**
 * Admin Panel JavaScript
 * Handles authentication, job management, and application viewing
 */

// Configuration
const CONFIG = {
    apiBaseUrl: 'https://nedhub-production.up.railway.app/api',
    tokenKey: 'nedhub_admin_token'
};

// State
let currentToken = null;
let currentSection = 'jobs';
let jobs = [];
let applications = [];
let currentJobId = null;
let currentApplicationId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
});

function initAdmin() {
    // Check if we're on login page or dashboard
    const isLoginPage = document.getElementById('adminLoginForm');
    const isDashboard = document.getElementById('adminSidebar');
    
    if (isLoginPage) {
        initLogin();
    } else if (isDashboard) {
        checkAuth();
        initDashboard();
    }
}

// ==================== LOGIN ====================
function initLogin() {
    const form = document.getElementById('adminLoginForm');
    const errorEl = document.getElementById('loginError');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = document.getElementById('adminPassword').value;
        
        try {
            const response = await fetch(`${CONFIG.apiBaseUrl}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem(CONFIG.tokenKey, result.token);
                window.location.href = 'index.html';
            } else {
                errorEl.textContent = result.message || 'Login failed';
            }
        } catch (error) {
            errorEl.textContent = 'Connection error. Please try again.';
        }
    });
}

// ==================== AUTH CHECK ====================
function checkAuth() {
    const token = localStorage.getItem(CONFIG.tokenKey);
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    currentToken = token;
}

// ==================== DASHBOARD ====================
function initDashboard() {
    // Navigation
    const navItems = document.querySelectorAll('.admin-nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
        });
    });
    
    // Logout
    const logoutBtn = document.getElementById('adminLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Add Job Button
    const addJobBtn = document.getElementById('addJobBtn');
    if (addJobBtn) {
        addJobBtn.addEventListener('click', openJobModal);
    }
    
    // Cancel Job Button
    const cancelJobBtn = document.getElementById('cancelJobBtn');
    if (cancelJobBtn) {
        cancelJobBtn.addEventListener('click', closeJobModal);
    }
    
    // Job Form
    const jobForm = document.getElementById('jobForm');
    if (jobForm) {
        jobForm.addEventListener('submit', handleJobSubmit);
    }
    
    // Modal Close Buttons
    const closeButtons = document.querySelectorAll('.admin-modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.admin-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Delete Modal
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteJob);
    }
    
    // Filters
    const statusFilter = document.getElementById('statusFilter');
    const searchApplications = document.getElementById('searchApplications');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', renderApplications);
    }
    
    if (searchApplications) {
        searchApplications.addEventListener('input', renderApplications);
    }
    
    // Load initial data
    loadJobs();
    loadApplications();
}

// ==================== SECTION SWITCHING ====================
function switchSection(section) {
    currentSection = section;
    
    // Update nav
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.admin-nav-item[data-section="${section}"]`).classList.add('active');
    
    // Update sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}Section`).classList.add('active');
    
    // Update header
    const titles = {
        jobs: 'Job Management',
        applications: 'Application Management',
        settings: 'Settings'
    };
    document.getElementById('adminSectionTitle').textContent = titles[section] || 'Dashboard';
    
    // Show/hide add button
    const addJobBtn = document.getElementById('addJobBtn');
    if (addJobBtn) {
        addJobBtn.style.display = section === 'jobs' ? 'flex' : 'none';
    }
}

// ==================== LOGOUT ====================
function logout() {
    localStorage.removeItem(CONFIG.tokenKey);
    window.location.href = 'login.html';
}

// ==================== JOBS ====================
async function loadJobs() {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/jobs`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load jobs');
        }
        
        const result = await response.json();
        jobs = result.data || [];
        renderJobs();
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('jobsTableBody').innerHTML = `
            <tr>
                <td colspan="8" class="loading-state">
                    <i class="fas fa-exclamation-triangle"></i> Failed to load jobs
                </td>
            </tr>
        `;
    }
}

// Helper function to get job type class
function getJobTypeClass(type) {
    const typeMap = {
        'Full-Time': 'job-type-fulltime',
        'Part-Time': 'job-type-parttime',
        'Remote': 'job-type-remote',
        'Contract': 'job-type-contract',
        'Internship': 'job-type-internship'
    };
    return typeMap[type] || 'job-type-fulltime';
}

function renderJobs() {
    const tbody = document.getElementById('jobsTableBody');
    
    if (jobs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-state">
                    <i class="fas fa-briefcase"></i> No jobs found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = jobs.map(job => `
        <tr data-job-id="${job.id}">
            <td>
                <strong>${escapeHtml(job.title)}</strong>
            </td>
            <td>${escapeHtml(job.department || 'General')}</td>
            <td>${escapeHtml(job.location)}</td>
            <td>
                <span class="status-badge ${getJobTypeClass(job.type)}">
                    ${escapeHtml(job.type)}
                </span>
            </td>
            <td>${job.deadline ? formatDate(job.deadline) : 'No deadline'}</td>
            <td>
                <span class="status-badge ${job.active ? 'status-active' : 'status-inactive'}">
                    ${job.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <span class="status-badge ${job.applicationCount > 0 ? 'status-shortlisted' : 'status-pending'}">
                    ${job.applicationCount || 0}
                </span>
            </td>
            <td>
                <div class="admin-actions">
                    <button class="btn btn-secondary edit-job" data-job-id="${job.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger delete-job" data-job-id="${job.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.edit-job').forEach(btn => {
        btn.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            editJob(jobId);
        });
    });
    
    document.querySelectorAll('.delete-job').forEach(btn => {
        btn.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            openDeleteModal(jobId);
        });
    });
}

function openJobModal() {
    currentJobId = null;
    document.getElementById('jobModalTitle').textContent = 'Add New Job';
    document.getElementById('jobForm').reset();
    document.getElementById('jobActive').checked = true;
    document.getElementById('jobModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function editJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    currentJobId = jobId;
    document.getElementById('jobModalTitle').textContent = 'Edit Job';
    document.getElementById('jobId').value = job.id;
    document.getElementById('jobTitle').value = job.title;
    document.getElementById('jobDepartment').value = job.department || 'General';
    document.getElementById('jobLocation').value = job.location;
    document.getElementById('jobType').value = job.type;
    document.getElementById('jobDescription').value = job.description;
    document.getElementById('jobRequirements').value = job.requirements ? job.requirements.join('\n') : '';
    document.getElementById('jobDeadline').value = job.deadline || '';
    document.getElementById('jobFeatured').checked = job.featured || false;
    document.getElementById('jobActive').checked = job.active;
    
    document.getElementById('jobModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeJobModal() {
    document.getElementById('jobModal').classList.remove('active');
    document.body.style.overflow = '';
}

async function handleJobSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('jobTitle').value,
        department: document.getElementById('jobDepartment').value,
        location: document.getElementById('jobLocation').value,
        type: document.getElementById('jobType').value,
        description: document.getElementById('jobDescription').value,
        requirements: document.getElementById('jobRequirements').value
            .split('\n')
            .map(r => r.trim())
            .filter(r => r),
        deadline: document.getElementById('jobDeadline').value,
        featured: document.getElementById('jobFeatured').checked,
        active: document.getElementById('jobActive').checked
    };
    
    try {
        let response;
        
        if (currentJobId) {
            // Update existing job
            response = await fetch(`${CONFIG.apiBaseUrl}/admin/jobs/${currentJobId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Create new job
            response = await fetch(`${CONFIG.apiBaseUrl}/admin/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(formData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            closeJobModal();
            loadJobs();
        } else {
            alert(result.message || 'Failed to save job');
        }
    } catch (error) {
        console.error('Error saving job:', error);
        alert('Failed to save job. Please try again.');
    }
}

function openDeleteModal(jobId) {
    currentJobId = jobId;
    document.getElementById('deleteModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    document.body.style.overflow = '';
}

async function confirmDeleteJob() {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/jobs/${currentJobId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeDeleteModal();
            loadJobs();
        } else {
            alert(result.message || 'Failed to delete job');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job. Please try again.');
    }
}

// ==================== APPLICATIONS ====================
async function loadApplications() {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/applications`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load applications');
        }
        
        const result = await response.json();
        applications = result.data || [];
        renderApplications();
    } catch (error) {
        console.error('Error loading applications:', error);
        document.getElementById('applicationsTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="loading-state">
                    <i class="fas fa-exclamation-triangle"></i> Failed to load applications
                </td>
            </tr>
        `;
    }
}

function renderApplications() {
    const tbody = document.getElementById('applicationsTableBody');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchApplications');
    
    let filtered = applications;
    
    // Apply status filter
    if (statusFilter && statusFilter.value) {
        filtered = filtered.filter(app => app.status === statusFilter.value);
    }
    
    // Apply search filter
    if (searchInput && searchInput.value) {
        const search = searchInput.value.toLowerCase();
        filtered = filtered.filter(app => 
            (app.fullName && app.fullName.toLowerCase().includes(search)) ||
            (app.email && app.email.toLowerCase().includes(search)) ||
            (app.position && app.position.toLowerCase().includes(search))
        );
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-state">
                    <i class="fas fa-users"></i> No applications found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.map(app => `
        <tr data-app-id="${app.id}">
            <td>
                <strong>${escapeHtml(app.fullName)}</strong>
            </td>
            <td>${escapeHtml(app.email)}</td>
            <td>${escapeHtml(app.positionName || app.position)}</td>
            <td>${escapeHtml(app.experience)}</td>
            <td>${formatDateTime(app.submittedAt)}</td>
            <td>
                <span class="status-badge status-${app.status.toLowerCase()}">
                    ${escapeHtml(app.status)}
                </span>
            </td>
            <td>
                <div class="admin-actions">
                    <button class="btn btn-secondary view-application" data-app-id="${app.id}" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary update-status" data-app-id="${app.id}" data-status="Reviewed" title="Mark Reviewed">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-secondary update-status" data-app-id="${app.id}" data-status="Shortlisted" title="Shortlist">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="btn btn-danger update-status" data-app-id="${app.id}" data-status="Rejected" title="Reject">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.view-application').forEach(btn => {
        btn.addEventListener('click', function() {
            const appId = this.getAttribute('data-app-id');
            viewApplication(appId);
        });
    });
    
    document.querySelectorAll('.update-status').forEach(btn => {
        btn.addEventListener('click', function() {
            const appId = this.getAttribute('data-app-id');
            const status = this.getAttribute('data-status');
            updateApplicationStatus(appId, status);
        });
    });
}

function viewApplication(appId) {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    
    const body = document.getElementById('applicationModalBody');
    body.innerHTML = `
        <div class="application-detail">
            <h3>Applicant Information</h3>
            <p><strong>Name:</strong> ${escapeHtml(app.fullName)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(app.email)}">${escapeHtml(app.email)}</a></p>
            <p><strong>Phone:</strong> ${escapeHtml(app.phone || 'Not provided')}</p>
            
            <h3>Position Details</h3>
            <p><strong>Position:</strong> ${escapeHtml(app.positionName || app.position)}</p>
            <p><strong>Experience Level:</strong> ${escapeHtml(app.experience)}</p>
            ${app.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${escapeHtml(app.linkedin)}" target="_blank">${escapeHtml(app.linkedin)}</a></p>` : ''}
            
            <h3>Documents</h3>
            ${app.cvUrl ? `<a href="${escapeHtml(app.cvUrl)}" target="_blank" class="application-doc-link">
                <i class="fas fa-file-pdf"></i> Download CV
            </a>` : ''}
            ${app.coverUrl ? `<a href="${escapeHtml(app.coverUrl)}" target="_blank" class="application-doc-link">
                <i class="fas fa-file-alt"></i> Download Cover Letter
            </a>` : ''}
            
            <h3>Messages</h3>
            ${app.coverLetter ? `<p><strong>Cover Letter:</strong><br>${escapeHtml(app.coverLetter).replace(/\n/g, '<br>')}</p>` : ''}
            ${app.additionalInfo ? `<p><strong>Additional Info:</strong><br>${escapeHtml(app.additionalInfo).replace(/\n/g, '<br>')}</p>` : ''}
            
            <h3>Status</h3>
            <p><strong>Current Status:</strong> 
                <span class="status-badge status-${app.status.toLowerCase()}">
                    ${escapeHtml(app.status)}
                </span>
            </p>
            <p><strong>Submitted:</strong> ${formatDateTime(app.submittedAt)}</p>
            
            <div class="status-update-buttons">
                <button class="btn btn-secondary" onclick="updateApplicationStatus('${app.id}', 'Pending')">Pending</button>
                <button class="btn btn-secondary" onclick="updateApplicationStatus('${app.id}', 'Reviewed')">Reviewed</button>
                <button class="btn btn-secondary" onclick="updateApplicationStatus('${app.id}', 'Shortlisted')">Shortlisted</button>
                <button class="btn btn-danger" onclick="updateApplicationStatus('${app.id}', 'Rejected')">Rejected</button>
            </div>
        </div>
    `;
    
    document.getElementById('applicationModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function updateApplicationStatus(appId, status) {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/applications/${appId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update local state
            const app = applications.find(a => a.id === appId);
            if (app) {
                app.status = status;
            }
            renderApplications();
            
            // Close modal if open
            const modal = document.getElementById('applicationModal');
            if (modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        } else {
            alert(result.message || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error updating application status:', error);
        alert('Failed to update status. Please try again.');
    }
}

// ==================== UTILITIES ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Make functions available globally
window.updateApplicationStatus = updateApplicationStatus;
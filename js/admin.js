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
let currentSection = 'dashboard';
let jobs = [];
let applications = [];
let users = [];
let currentJobId = null;
let currentApplicationId = null;
let currentUserId = null;

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
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        try {
            const response = await fetch(`${CONFIG.apiBaseUrl}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
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
    
    // Profile dropdown
    const profileTrigger = document.getElementById('profileTrigger');
    const profileDropdown = document.getElementById('profileDropdown');
    const headerLogout = document.getElementById('headerLogout');
    
    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }
    
    if (headerLogout) {
        headerLogout.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    document.addEventListener('click', function() {
        if (profileDropdown) profileDropdown.classList.remove('active');
    });
    
    // Add Job Button
    const addJobBtn = document.getElementById('addJobBtn');
    if (addJobBtn) {
        addJobBtn.addEventListener('click', openJobModal);
    }
    
    // Add User Button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', openUserModal);
    }
    
    // Cancel User Button
    const cancelUserBtn = document.getElementById('cancelUserBtn');
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', closeUserModal);
    }
    
    // User Form
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    // Cancel Password Button
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', closePasswordModal);
    }
    
    // Password Form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordSubmit);
    }
    
    // Job Form
    const jobForm = document.getElementById('jobForm');
    if (jobForm) {
        jobForm.addEventListener('submit', handleJobSubmit);
    }
    
    // Application Method Toggle
    const applicationMethodSelect = document.getElementById('applicationMethod');
    if (applicationMethodSelect) {
        applicationMethodSelect.addEventListener('change', function() {
            toggleApplicationMethodFields(this.value);
        });
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
    
    // Profile Form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    // Password Change Form
    const passwordChangeForm = document.getElementById('passwordChangeForm');
    if (passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', handlePasswordChangeSubmit);
    }
    
    // Settings Form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
    }
    
    // Load initial data
    loadDashboardStats();
    loadJobs();
    loadApplications();
    loadUsers();
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
        users: 'User Management',
        settings: 'Platform Settings',
        profile: 'My Profile',
        'change-password': 'Change Password'
    };
    document.getElementById('adminSectionTitle').textContent = titles[section] || 'Dashboard';
    
    // Show/hide add buttons
    const addJobBtn = document.getElementById('addJobBtn');
    const addUserBtn = document.getElementById('addUserBtn');
    if (addJobBtn) {
        addJobBtn.style.display = section === 'jobs' ? 'flex' : 'none';
    }
    if (addUserBtn) {
        addUserBtn.style.display = section === 'users' ? 'flex' : 'none';
    }
    
    // Load section-specific data
    if (section === 'settings') {
        loadSettings();
    }
    if (section === 'profile') {
        loadProfile();
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
                <td colspan="9" class="loading-state">
                    <i class="fas fa-briefcase"></i> No jobs found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = jobs.map(job => {
        const statusClass = job.status === 'Published' ? 'status-active' : 
            job.status === 'Draft' ? 'status-pending' : 'status-inactive';
        const methodBadge = job.applicationMethod === 'external' ? 
            '<span class="status-badge status-external">External</span>' : '';
        const featuredBadge = job.featured ? '<span class="status-badge status-featured">Featured</span>' : '';
        
        return `
        <tr data-job-id="${job.id}">
            <td>
                <strong>${escapeHtml(job.title)}</strong>
                ${featuredBadge}
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
                <span class="status-badge ${statusClass}">
                    ${escapeHtml(job.status)}
                </span>
            </td>
            <td>${methodBadge}</td>
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
                    <button class="btn btn-danger delete-job" data-job-id="${job.id}" title="Archive">
                        <i class="fas fa-archive"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
    
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
    document.getElementById('jobStatus').value = 'Published';
    document.getElementById('applicationMethod').value = 'internal';
    toggleApplicationMethodFields('internal');
    document.getElementById('jobModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function toggleApplicationMethodFields(method) {
    const externalFields = document.getElementById('externalJobFields');
    const internalFields = document.getElementById('internalJobFields');
    
    if (externalFields && internalFields) {
        if (method === 'external') {
            externalFields.style.display = 'block';
            internalFields.style.display = 'none';
            document.getElementById('companyName').required = true;
            document.getElementById('applicationUrl').required = true;
            document.getElementById('jobRequirements').required = false;
        } else {
            externalFields.style.display = 'none';
            internalFields.style.display = 'block';
            document.getElementById('companyName').required = false;
            document.getElementById('applicationUrl').required = false;
            document.getElementById('jobRequirements').required = false;
        }
    }
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
    document.getElementById('jobResponsibilities').value = job.responsibilities ? job.responsibilities.join('\n') : '';
    document.getElementById('jobDeadline').value = job.deadline || '';
    document.getElementById('jobFeatured').checked = job.featured || false;
    document.getElementById('jobStatus').value = job.status || 'Published';
    document.getElementById('applicationMethod').value = job.applicationMethod || 'internal';
    document.getElementById('companyName').value = job.companyName || '';
    document.getElementById('companyLogo').value = job.companyLogo || '';
    document.getElementById('applicationUrl').value = job.applicationUrl || '';
    document.getElementById('source').value = job.source || '';
    
    toggleApplicationMethodFields(job.applicationMethod || 'internal');
    
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
        responsibilities: document.getElementById('jobResponsibilities').value
            .split('\n')
            .map(r => r.trim())
            .filter(r => r),
        deadline: document.getElementById('jobDeadline').value,
        featured: document.getElementById('jobFeatured').checked,
        status: document.getElementById('jobStatus').value,
        applicationMethod: document.getElementById('applicationMethod').value,
        companyName: document.getElementById('companyName').value,
        companyLogo: document.getElementById('companyLogo').value,
        applicationUrl: document.getElementById('applicationUrl').value,
        source: document.getElementById('source').value
    };
    
    try {
        let response;
        
        if (currentJobId) {
            response = await fetch(`${CONFIG.apiBaseUrl}/admin/jobs/${currentJobId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(formData)
            });
        } else {
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
            loadDashboardStats();
            showNotification('Job saved successfully!', 'success');
        } else {
            showNotification(result.message || 'Failed to save job', 'error');
        }
    } catch (error) {
        console.error('Error saving job:', error);
        showNotification('Failed to save job. Please try again.', 'error');
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
            loadDashboardStats();
            showNotification('Job archived successfully!', 'success');
        } else {
            showNotification(result.message || 'Failed to archive job', 'error');
        }
    } catch (error) {
        console.error('Error archiving job:', error);
        showNotification('Failed to archive job. Please try again.', 'error');
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

// ==================== USERS ====================
async function loadUsers() {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        
        const result = await response.json();
        users = result.data || [];
        renderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        const usersTableBody = document.getElementById('usersTableBody');
        if (usersTableBody) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-state">
                        <i class="fas fa-exclamation-triangle"></i> Failed to load users
                    </td>
                </tr>
            `;
        }
    }
}

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-state">
                    <i class="fas fa-user-cog"></i> No users found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr data-user-id="${user.id}">
            <td>
                <strong>${escapeHtml(user.fullName)}</strong>
            </td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>
                <span class="status-badge ${user.role === 'owner' ? 'status-active' : 'status-pending'}">
                    ${escapeHtml(user.role)}
                </span>
            </td>
            <td>
                <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                    ${user.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}</td>
            <td>
                <div class="admin-actions">
                    <button class="btn btn-secondary edit-user" data-user-id="${user.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-secondary reset-password" data-user-id="${user.id}" title="Reset Password">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn btn-secondary toggle-status" data-user-id="${user.id}" data-active="${user.isActive}" title="${user.isActive ? 'Disable' : 'Enable'}">
                        <i class="fas ${user.isActive ? 'fa-ban' : 'fa-check'}"></i>
                    </button>
                    <button class="btn btn-secondary change-role" data-user-id="${user.id}" data-role="${user.role}" title="Change Role">
                        <i class="fas fa-user-tag"></i>
                    </button>
                    <button class="btn btn-danger delete-user" data-user-id="${user.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            editUser(userId);
        });
    });
    
    document.querySelectorAll('.reset-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            openPasswordModal(userId);
        });
    });
    
    document.querySelectorAll('.toggle-status').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            toggleUserStatus(userId);
        });
    });
    
    document.querySelectorAll('.change-role').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            changeUserRole(userId);
        });
    });
    
    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            deleteUser(userId);
        });
    });
}

function openUserModal() {
    currentUserId = null;
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userRole').value = 'admin';
    document.getElementById('userModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    currentUserId = userId;
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('userFullName').value = user.fullName;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userRole').value = user.role;
    
    document.getElementById('userModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
    document.body.style.overflow = '';
}

async function handleUserSubmit(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('userFullName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        username: document.getElementById('userUsername').value.trim(),
        password: document.getElementById('userPassword').value,
        role: document.getElementById('userRole').value
    };
    
    if (!formData.fullName || !formData.email || !formData.username) {
        alert('All fields except password are required.');
        return;
    }
    
    try {
        let response;
        
        if (currentUserId) {
            response = await fetch(`${CONFIG.apiBaseUrl}/admin/users/${currentUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    username: formData.username,
                    role: formData.role
                })
            });
        } else {
            response = await fetch(`${CONFIG.apiBaseUrl}/admin/users`, {
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
            closeUserModal();
            loadUsers();
        } else {
            alert(result.message || 'Failed to save user');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Failed to save user. Please try again.');
    }
}

function openPasswordModal(userId) {
    currentUserId = userId;
    document.getElementById('passwordForm').reset();
    document.getElementById('passwordModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('active');
    document.body.style.overflow = '';
}

async function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const password = document.getElementById('newPassword').value;
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters.');
        return;
    }
    
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        alert('Password must contain uppercase, lowercase, and numeric characters.');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/users/${currentUserId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closePasswordModal();
            alert('Password reset successfully.');
        } else {
            alert(result.message || 'Failed to reset password');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        alert('Failed to reset password. Please try again.');
    }
}

async function toggleUserStatus(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to ${user.isActive ? 'disable' : 'enable'} this user?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadUsers();
        } else {
            alert(result.message || 'Failed to update user status');
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Failed to update user status. Please try again.');
    }
}

async function changeUserRole(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newRole = user.role === 'owner' ? 'admin' : 'owner';
    
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ role: newRole })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadUsers();
        } else {
            alert(result.message || 'Failed to change user role');
        }
    } catch (error) {
        console.error('Error changing user role:', error);
        alert('Failed to change user role. Please try again.');
    }
}

async function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to delete this user? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadUsers();
        } else {
            alert(result.message || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
    }
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
            const app = applications.find(a => a.id === appId);
            if (app) {
                app.status = status;
            }
            renderApplications();
            
            const modal = document.getElementById('applicationModal');
            if (modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            loadDashboardStats();
            showNotification('Application status updated!', 'success');
        } else {
            showNotification(result.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating application status:', error);
        showNotification('Failed to update status. Please try again.', 'error');
    }
}

// ==================== DASHBOARD STATS ====================

async function loadDashboardStats() {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) return;
        
        const result = await response.json();
        const stats = result.data;
        
        document.getElementById('totalJobsCount').textContent = stats.totalJobs || 0;
        document.getElementById('activeJobsCount').textContent = stats.activeJobs || 0;
        document.getElementById('internalJobsCount').textContent = stats.internalJobs || 0;
        document.getElementById('externalJobsCount').textContent = stats.externalJobs || 0;
        document.getElementById('totalApplicationsCount').textContent = stats.totalApplications || 0;
        document.getElementById('pendingApplicationsCount').textContent = stats.pendingApplications || 0;
        document.getElementById('shortlistedApplicationsCount').textContent = stats.shortlistedApplications || 0;
        
        loadRecentApplications();
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentApplications() {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/dashboard/recent-applications`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) return;
        
        const result = await response.json();
        const list = document.getElementById('recentApplicationsList');
        
        if (result.data && result.data.length > 0) {
            list.innerHTML = result.data.map(app => `
                <div class="dashboard-summary-item">
                    <strong>${escapeHtml(app.applicantName)}</strong>
                    <span>${escapeHtml(app.positionName)}</span>
                    <small>${formatDateTime(app.submittedAt)}</small>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p class="loading-state">No recent applications</p>';
        }
    } catch (error) {
        console.error('Error loading recent applications:', error);
    }
}

// ==================== PROFILE MANAGEMENT ====================

async function loadProfile() {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/profile`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) return;
        
        const result = await response.json();
        const admin = result.data;
        
        document.getElementById('profileFullName').value = admin.fullName || '';
        document.getElementById('profileEmail').value = admin.email || '';
        document.getElementById('profileUsername').value = admin.username || '';
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('profileFullName').value,
        email: document.getElementById('profileEmail').value
    };
    
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Profile updated successfully!', 'success');
        } else {
            showNotification(result.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile.', 'error');
    }
}

async function handlePasswordChangeSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Password changed successfully!', 'success');
            document.getElementById('passwordChangeForm').reset();
            switchSection('dashboard');
        } else {
            showNotification(result.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Failed to change password.', 'error');
    }
}

// ==================== SETTINGS MANAGEMENT ====================

async function loadSettings() {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/settings`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) return;
        
        const result = await response.json();
        const settings = result.data;
        
        document.getElementById('settingsCompanyName').value = settings.companyName || '';
        document.getElementById('settingsCompanyLogo').value = settings.companyLogo || '';
        document.getElementById('settingsRecruitmentEmail').value = settings.recruitmentEmail || '';
        document.getElementById('settingsContactNumber').value = settings.contactNumber || '';
        document.getElementById('settingsCompanyAddress').value = settings.companyAddress || '';
        document.getElementById('settingsWebsiteUrl').value = settings.websiteUrl || '';
        document.getElementById('settingsFacebookUrl').value = settings.facebookUrl || '';
        document.getElementById('settingsInstagramUrl').value = settings.instagramUrl || '';
        document.getElementById('settingsLinkedinUrl').value = settings.linkedinUrl || '';
        document.getElementById('settingsTwitterUrl').value = settings.twitterUrl || '';
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function handleSettingsSubmit(e) {
    e.preventDefault();
    
    const formData = {
        companyName: document.getElementById('settingsCompanyName').value,
        companyLogo: document.getElementById('settingsCompanyLogo').value,
        recruitmentEmail: document.getElementById('settingsRecruitmentEmail').value,
        contactNumber: document.getElementById('settingsContactNumber').value,
        companyAddress: document.getElementById('settingsCompanyAddress').value,
        websiteUrl: document.getElementById('settingsWebsiteUrl').value,
        facebookUrl: document.getElementById('settingsFacebookUrl').value,
        instagramUrl: document.getElementById('settingsInstagramUrl').value,
        linkedinUrl: document.getElementById('settingsLinkedinUrl').value,
        twitterUrl: document.getElementById('settingsTwitterUrl').value
    };
    
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/admin/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Settings saved successfully!', 'success');
        } else {
            showNotification(result.message || 'Failed to save settings', 'error');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings.', 'error');
    }
}

// ==================== UTILITIES ====================

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

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
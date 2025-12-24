# Phase 2 SaaS Integration Guide

This document outlines how to integrate the Phase 2 BULK SMS SaaS application with the existing Nedhub platform.

## 🎯 Phase 2 Overview

**Subdomain**: `app.nedhub.com`
**Purpose**: BULK SMS & Business Communication Solutions
**Architecture**: SaaS Multi-tenant Application

## 🔧 Integration Points

### 1. Shared Design System

The Phase 2 application should maintain visual consistency with the Phase 1 platform:

**CSS Variables to Reuse** (from `css/styles.css`):
```css
:root {
    --primary-dark: #0B132B;
    --accent-orange: #F77F00;
    --neutral-white: #FFFFFF;
    --neutral-gray: #F4F6F8;
    --text-dark: #2D3748;
    --text-light: #718096;
}
```

**Component Patterns to Maintain**:
- Card-based layouts with hover effects
- Rounded buttons with ripple animations
- Consistent spacing (8px system)
- Responsive grid layouts
- Accessible form patterns

### 2. Authentication Integration

**Existing Structure Ready for Auth**:
- Navigation system supports logged-in states
- User profile dropdown area reserved
- Session management patterns established

**Implementation Guide**:
```typescript
// Example: Add authentication state to main.ts
interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
}

let currentUser: User | null = null;

function initAuth(): void {
    // Check for existing session
    const savedUser = localStorage.getItem('nedhub_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateNavForAuthState();
    }
}

function updateNavForAuthState(): void {
    const authLinks = document.getElementById('auth-links');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (currentUser) {
        // Show user dropdown
        if (authLinks) authLinks.style.display = 'none';
        if (userDropdown) {
            userDropdown.style.display = 'flex';
            userDropdown.innerHTML = `
                <span>${currentUser.name}</span>
                <img src="avatar.jpg" alt="User avatar" class="user-avatar">
            `;
        }
    } else {
        // Show auth links
        if (authLinks) authLinks.style.display = 'flex';
        if (userDropdown) userDropdown.style.display = 'none';
    }
}
```

### 3. Navigation Integration

**Add SaaS App Link to Navigation**:
```html
<!-- Add to nav-menu in all HTML files -->
<li><a href="https://app.nedhub.com" class="nav-link">BULK SMS App</a></li>
```

**Mobile Menu Considerations**:
- Ensure the new link works in mobile drawer menu
- Test touch targets on mobile devices
- Verify focus states for accessibility

### 4. API Integration Patterns

**TypeScript API Client Template**:
```typescript
// js/api-client.ts
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

class NedhubApiClient {
    private baseUrl: string;
    private authToken: string | null;

    constructor() {
        this.baseUrl = 'https://api.nedhub.com/v1';
        this.authToken = localStorage.getItem('nedhub_auth_token');
    }

    private async request<T>(endpoint: string, method: string = 'GET', body?: any): Promise<ApiResponse<T>> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        return await response.json();
    }

    async login(email: string, password: string): Promise<ApiResponse<{token: string, user: User}>> {
        return this.request('/auth/login', 'POST', { email, password });
    }

    async getSmsCampaigns(): Promise<ApiResponse<SmsCampaign[]>> {
        return this.request('/sms/campaigns');
    }

    async createCampaign(campaign: SmsCampaignCreate): Promise<ApiResponse<SmsCampaign>> {
        return this.request('/sms/campaigns', 'POST', campaign);
    }
}

export const apiClient = new NedhubApiClient();
```

### 5. Dashboard Integration

**Shared Dashboard Components**:
```typescript
// js/dashboard.ts - Can be shared between Phase 1 and Phase 2
interface DashboardWidget {
    id: string;
    title: string;
    type: 'stats' | 'chart' | 'list' | 'cta';
    data: any;
    render(): HTMLElement;
}

class StatsWidget implements DashboardWidget {
    constructor(public id: string, public title: string, public data: {value: number, label: string}) {}

    render(): HTMLElement {
        const widget = document.createElement('div');
        widget.className = 'dashboard-widget stats-widget';
        widget.innerHTML = `
            <h3>${this.title}</h3>
            <div class="stat-value">${this.data.value}</div>
            <div class="stat-label">${this.data.label}</div>
        `;
        return widget;
    }
}

export function initDashboard(container: HTMLElement): void {
    // This can be used in both Phase 1 admin areas and Phase 2 SaaS app
    const widgets: DashboardWidget[] = [
        new StatsWidget('sms-sent', 'SMS Sent', {value: 1500, label: 'This month'}),
        new StatsWidget('delivery-rate', 'Delivery Rate', {value: 98.5, label: 'Percentage'}),
        // Add more widgets as needed
    ];

    widgets.forEach(widget => {
        container.appendChild(widget.render());
    });
}
```

### 6. Data Visualization Consistency

**Shared Chart Styles**:
```css
/* Add to css/styles.css for consistency */
.chart-container {
    background-color: var(--neutral-white);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
}

.chart-title {
    font-size: var(--font-size-lg);
    color: var(--text-dark);
    margin-bottom: var(--space-md);
}

.chart-legend {
    display: flex;
    gap: var(--space-md);
    margin-top: var(--space-sm);
}

.chart-legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
}
```

### 7. Error Handling Patterns

**Consistent Error Display**:
```typescript
// js/error-handling.ts - Shared error handling
interface AppError {
    code: string;
    message: string;
    details?: string;
    severity: 'info' | 'warning' | 'error';
}

export function showError(error: AppError): void {
    const errorContainer = document.getElementById('app-errors') || createErrorContainer();
    
    const errorElement = document.createElement('div');
    errorElement.className = `app-error ${error.severity}`;
    errorElement.innerHTML = `
        <div class="error-header">
            <span class="error-icon"></span>
            <h4>${error.message}</h4>
        </div>
        ${error.details ? `<p>${error.details}</p>` : ''}
    `;
    
    errorContainer.appendChild(errorElement);
    
    // Auto-dismiss after timeout for non-critical errors
    if (error.severity !== 'error') {
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
}

function createErrorContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'app-errors';
    container.className = 'error-container';
    document.body.prepend(container);
    return container;
}
```

### 8. Internationalization (i18n) Readiness

**Language Support Structure**:
```typescript
// js/i18n.ts - Foundation for multi-language support
interface Translations {
    [key: string]: string;
}

interface LanguageConfig {
    code: string;
    name: string;
    translations: Translations;
}

class I18n {
    private currentLanguage: string = 'en';
    private languages: Record<string, LanguageConfig> = {};

    constructor() {
        // Load default language
        this.loadLanguage('en', {
            code: 'en',
            name: 'English',
            translations: {
                'welcome': 'Welcome to Nedhub',
                'login': 'Login',
                'logout': 'Logout',
                // Add more translations...
            }
        });
    }

    loadLanguage(code: string, config: LanguageConfig): void {
        this.languages[code] = config;
    }

    setLanguage(code: string): void {
        if (this.languages[code]) {
            this.currentLanguage = code;
            localStorage.setItem('nedhub_language', code);
            this.updateUI();
        }
    }

    translate(key: string): string {
        const lang = this.languages[this.currentLanguage];
        return lang?.translations[key] || key;
    }

    private updateUI(): void {
        // Update all translatable elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                el.textContent = this.translate(key);
            }
        });
    }
}

export const i18n = new I18n();
```

### 9. Analytics Integration

**Event Tracking Foundation**:
```typescript
// js/analytics.ts - Cross-platform analytics
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
    // Send to analytics service
    console.log('Tracking event:', eventName, properties);
    
    // Example: Google Analytics integration
    if (window.gtag) {
        gtag('event', eventName, properties);
    }
    
    // Example: Custom analytics endpoint
    if (process.env.ANALYTICS_ENABLED) {
        fetch('/api/analytics', {
            method: 'POST',
            body: JSON.stringify({ event: eventName, properties })
        });
    }
}

// Track common events
export function trackPageView(page: string): void {
    trackEvent('page_view', { page });
}

export function trackButtonClick(buttonId: string): void {
    trackEvent('button_click', { button_id: buttonId });
}

export function trackFormSubmit(formId: string): void {
    trackEvent('form_submit', { form_id: formId });
}
```

### 10. Deployment Considerations

**Subdomain Configuration**:
```nginx
# Nginx configuration for app.nedhub.com
server {
    listen 443 ssl;
    server_name app.nedhub.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        root /var/www/nedhub/saas;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**CORS Configuration**:
```json
// For Phase 2 API
{
    "allowedOrigins": [
        "https://nedhub.com",
        "https://www.nedhub.com",
        "https://app.nedhub.com"
    ],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allowedHeaders": ["Content-Type", "Authorization"],
    "credentials": true
}
```

## 🚀 Migration Path

### Step 1: Set Up Development Environment
```bash
# Clone Phase 1 repository
git clone https://github.com/nedhub/platform-phase1.git
cd platform-phase1

# Install dependencies
npm install

# Run development server
npm run dev
```

### Step 2: Create Phase 2 Project Structure
```bash
# Create new directory for SaaS app
mkdir ../platform-phase2
cd ../platform-phase2

# Initialize new project
npm init -y
npm install typescript vite react react-dom @types/react @types/react-dom
```

### Step 3: Share Common Components
```bash
# Copy shared components from Phase 1
cp -r ../platform-phase1/js/shared ./src/shared
cp -r ../platform-phase1/css ./src/styles
```

### Step 4: Implement Authentication Flow
```typescript
// Example: Login page that redirects to SaaS app
function handleLoginSuccess(token: string, user: User): void {
    // Store auth token
    localStorage.setItem('nedhub_auth_token', token);
    localStorage.setItem('nedhub_user', JSON.stringify(user));
    
    // Redirect to SaaS app
    window.location.href = 'https://app.nedhub.com/dashboard';
}
```

### Step 5: Test Integration
1. Test navigation between platforms
2. Verify authentication flow
3. Check design consistency
4. Test responsive behavior
5. Validate accessibility compliance

## 📋 Checklist for Phase 2 Launch

- [ ] Set up `app.nedhub.com` subdomain and SSL
- [ ] Configure CORS for API endpoints
- [ ] Implement shared authentication system
- [ ] Create consistent UI components
- [ ] Set up analytics tracking
- [ ] Configure error monitoring
- [ ] Implement user feedback system
- [ ] Set up automated deployments
- [ ] Create documentation portal
- [ ] Plan user migration strategy

## 🔮 Future Enhancements

1. **Unified Admin Dashboard**: Combine Phase 1 and Phase 2 admin functions
2. **Single Sign-On**: Implement SSO across all Nedhub properties
3. **Micro-frontends**: Share components between platforms at runtime
4. **Design Tokens**: Centralized design system management
5. **Feature Flags**: Control feature rollout across platforms

## 📚 Resources

- **Phase 1 Documentation**: See README.md
- **API Documentation**: (To be created for Phase 2)
- **Design System**: Figma files and CSS variables
- **Brand Guidelines**: Brand book and assets

---

This integration guide provides the foundation for seamless transition from Phase 1 to Phase 2 while maintaining consistency and user experience across the Nedhub digital ecosystem.
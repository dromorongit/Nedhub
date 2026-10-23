# Nedhub Marketing Site — Read-Only Audit

Prepared for premium redesign. Read-only audit; no site files modified. Report only at `reference/site-audit.md`.

**Browser unavailable** — no visual checks performed. Items needing visual verification are marked `needs visual check`.

## Summary table

| Page | Purpose | Interactive features | Risk | Top 3 issues |
|---|---|---|---|---|
| index.html | Home; overview of Nedhub + services | Carousel, counters, FAQ-ish, hiring widget, jobs fetch | Medium | Unverifiable stats; remote Unsplash images; no canonical |
| about.html | Company story, mission/vision, values, industries | Scroll animations only | Low | No nav/footer shared? (uses site-nav/footer) — inconsistent hero stats |
| services.html | Service catalogue (6) | Cards, inline styles, "book now" | Low | Inline heavy; no forms |
| recruitment.html | Service detail | Scroll anims | Low | Hard-coded stats |
| outsourcing.html | Service detail | Scroll anims | Low | Inline heavy |
| training.html | Service detail | Scroll anims | Low | Hard-coded stats |
| career-coaching.html | Service detail | Scroll anims | Low | Hard-coded stats |
| data-analytics.html | Service detail | Scroll anims | Low | Hard-coded stats |
| careers.html | Job board + application | Category filters, file upload, form, modal | **High** | API dependency (Railway); external job links; form only simulates? (real endpoint) |
| job.html | Single job detail | Share buttons, modal-less | Medium | Old navbar/footer (not shared); API dependency |
| cv-templates.html | Sell CV templates | Filters, search, payment modal, Hubtel redirect | **High** | Payment flow; card input UI (Hubtel handles) |
| contact.html | Contact form + info | FAQ accordion, form, map placeholder | Medium | Form does NOT submit (simulated only); duplicate contact emails |
| digital-services.html | Bulk SMS app promo | FAQ accordion, JSON-LD | Low | Inline all CSS; separate design system (Manrope) |
| payment-success/cancelled/error.html | Payment result screens | none | Low | Standalone (no shared nav/footer) |
| test_*.html (5) | QA harnesses | n/a | Low | Should not ship; dead/test code |
| admin/* (3) | Admin panel | login/register/dashboard | Medium | Backend dependency; auth |

---

## Pages

### index.html
- **Purpose:** Home page for prospective clients/employers. Hero, core services grid, "why choose", featured solutions, digital preview, trust/logos, counters, how-it-works, testimonials, latest jobs, CTA.
- **Sections (in order):** Hero (badge, h1 "Transform Your Business...", p, buttons, stats 500+/1200+/98%); Service Highlights (6 image cards → service pages); Why Choose Nedhub (4 image cards + stats); Featured Solutions (2 image cards); Digital Services Platform Preview; Trust & Social Proof (logo carousel empty, counters 500/1200/350/98, badges); How It Works (4 steps); Testimonials carousel (3 quotes: Abena Kofi/TechCorp, Kwame Osei/Prime Industries, Yaw Mensah/GlobalTech); Latest Jobs (fetched into #homepage-jobs); CTA "Ready to Transform".
- **Content to preserve:** headline copy, service card titles, testimonial quotes + authors, counter targets (500, 1200, 350, 98), "Trusted by 200+ Companies" badge.
- **Interactive:** testimonial carousel (prev/next/dots, auto 5s, swipe, keyboard) in js/animations.js; animated counters in js/animations.js; scroll animations; hiring widget (#hiring-widget, count from jobs API) in js/jobs.js; jobs fetch from https://nedhub-production.up.railway.app/api/careers/jobs (js/jobs.js).
- **Data sources:** hard-coded content + remote jobs API (Railway). Remote images (Unsplash). Local images assets/images/lady1.jpg, lady2.jpg, Nedhubsymbol.PNG.
- **Images/media:** Unsplash URLs (w=1920/800) — remote, no local fallback; assets/images/lady1.jpg, lady2.jpg (local, ~57/48 KB). No alt issues except none noted. Needs visual check for load failures.
- **CSS:** css/styles.css, animations.css, responsive.css, privacy-modal.css, terms-modal.css; inline none. Classes: hero, services-image-grid, why-choose-grid, solutions-image-grid, bulk-sms-image-content, trust-section, counters-grid, process-steps, testimonials-carousel.
- **SEO/a11y:** title "Nedhub | Modern Corporate Solutions"; meta description present; no canonical; h1 then h2s. Needs visual check for contrast.
- **Problems:** stats unverifiable (500 clients, 1200 placements, 98%, 350 programs, 50 experts); empty trusted-logos track (no logos); "Award Winning/5-Star Rated" unverified; testimonial authors possibly fabricated.
- **Shared nav/footer:** uses site-nav.js + site-footer.js (injected). noscript fallback nav/footer present.

### about.html
- **Purpose:** About Nedhub for prospects/partners. Company overview, mission/vision, core values, industries.
- **Sections:** Hero (stats 500+/8+/50+); Our Company; Mission & Vision (2 cards); Core Values (Innovation, Integrity, Excellence, Client Focus); Industries We Serve (Technology, Finance, Healthcare, Education, Retail, Manufacturing).
- **Content:** mission "To empower businesses with innovative solutions..."; vision "To be the leading provider..."; values copy.
- **Interactive:** scroll animations only (animations.js).
- **Data:** hard-coded; remote Unsplash images.
- **Images:** all remote Unsplash.
- **CSS:** styles, animations, responsive, privacy-modal, terms-modal.
- **SEO/a11y:** title "About Us | Nedhub"; meta desc; no canonical.
- **Problems:** stats unverifiable (8+ years, 50+ team); no canonical.
- **Shared:** site-nav.js + site-footer.js.

### services.html
- **Purpose:** Service catalogue (6 cards) → detail pages.
- **Sections:** Hero (stats 6/500+/98%); Services grid (Recruitment, Outsourcing, Training, Career Coaching, Data Analytics, BULK SMS); "Why Book Our Services Today?" (4 cards: Fast Results, Expert Team, Value Investment, Satisfaction Guaranteed); CTA.
- **Interactive:** scroll animations; cards link.
- **Data:** hard-coded.
- **CSS:** styles, animations, responsive, privacy, terms. Inline `<style>` for pulseGreen/card-pay-book.
- **SEO:** title "Our Services | Nedhub"; meta desc; no canonical.
- **Problems:** inline style block; "limited slots" urgency copy unverifiable; stats unverifiable.
- **Shared:** site-nav + site-footer.

### recruitment.html / outsourcing.html / training.html / career-coaching.html / data-analytics.html
- **Purpose:** Service detail pages for each offering; funnel to contact.
- **Sections (each):** Hero (service-specific stats) → Service detail (description, "Our ... Services Include" list, "Why/Benefits" list, CTA) → Process steps (4) → Statistics (4) → Related Services (3 cards) → CTA → "Why Book Now" (4 cards).
- **Content to preserve:** service feature lists (e.g. recruitment: Executive Search, Permanent & Contract Staffing, Talent Pipeline, Employer Branding, RPO, Diversity & Inclusion), benefits, process steps, stats.
- **Interactive:** scroll animations only.
- **Data:** hard-coded; remote Unsplash.
- **CSS:** styles, animations, responsive, privacy, terms. Heavy inline styles on sections.
- **SEO:** per-page titles/meta desc; no canonical.
- **Problems:** inconsistent stats across pages (500 placements vs 1000 staff placed); urgency/scarcity copy; inline styles; data-analytics related card links to digital-services.
- **Shared:** site-nav + site-footer.

### careers.html
- **Purpose:** Job board + application form for job seekers.
- **Sections:** Hero (career-hero, clip-path ellipse) → Open Positions (#jobs, category filters + jobs grid) → Why Work With Us (6 benefits) → Apply Now (#apply, application form) → Final CTA.
- **Content:** benefit cards (Career Growth, Work-Life Balance, Health & Wellness, Team Culture, Competitive Package, Innovation); form intro "Send your CV to careers@nedhubgh.com or apply using the form below."
- **Interactive:** category filter chips (ALL_CATEGORIES, 30 categories) in js/jobs.js; jobs fetched from Railway API; file upload (CV required, cover optional) drag/drop in js/application-form.js; form validation; success modal.
- **Form (careerForm):** fields fullName, email, phone, position (select, populated from API jobs), linkedin, experience (select), cvFile (file, required, PDF/DOC/DOCX ≤5MB), coverFile (file), coverLetter (textarea), additionalInfo. Submits POST JSON to https://nedhub-production.up.railway.app/api/careers/apply; files uploaded to Cloudinary (cloud ddohto2tl, preset nedhub_careers_unsigned) → secure_url. Timeout 30s.
- **Data:** jobs from Railway API; Cloudinary for files; backend stores application + emails via Brevo (per .env.example BREVO_API_KEY).
- **Images:** none local except logos.
- **CSS:** styles, animations, responsive, privacy, terms, jobs + large inline `<style>` block (~490 lines) in head.
- **SEO/a11y:** title "Careers | Nedhub"; meta desc; no canonical; job cards have aria? needs visual check.
- **Problems:** API dependency (if Railway down, no jobs); external job application links open new tab; form's success modal always shows even on 202 (email failed); duplicate `window.selectJob` definitions; `isEmail` etc. Potential XSS mitigated via escapeHtml. Mobile nav uses separate system.
- **Shared:** site-nav + site-footer. But also loads js/jobs.js, js/application-form.js (not module). Note careers.html does NOT load site-nav? Let me verify — careers.html head has `<script src="/site-nav.js" defer></script>` yes (line 974 area? Actually careers.html has site-nav in head). Yes.

### job.html
- **Purpose:** Single job detail page (opened via ?id=).
- **Sections:** loading state → job hero (badges, title, company info for external, meta) → content (description, responsibilities, requirements, benefits) → sidebar (apply card, overview grid, deadline) → share section → related jobs → mobile sticky CTA → final CTA.
- **Interactive:** share buttons (copy link, Web Share API) in js/job-detail.js; related jobs fetch; SEO update; apply button logic (internal → careers.html?job=; external → mailto/url).
- **Data:** Railway API /api/careers/jobs/{id} and ?category=.
- **CSS:** styles, animations, responsive, jobs, job-detail + Font Awesome. Uses OLD navbar markup + .footer (not site-nav/site-footer). navigation.js + developer-credits.js.
- **SEO/a11y:** title "Job Details | Nedhub"; meta desc + keywords + OG tags; updated dynamically by JS.
- **Problems:** uses legacy navbar/footer (not shared site-nav/site-footer) → inconsistent with rest of site; no site-footer.js → footer is static .footer (different styling, and site-footer.js not injected, so no developer credit logo? Actually .footer has different layout). Risk of double footer? No site-footer.js, so single static footer. Inconsistent branding. Needs visual check.
- **Shared nav/footer:** NOT using site-nav.js/site-footer.js — this page is the outlier.

### cv-templates.html
- **Purpose:** Sell/download CV templates. Filter by category/price, search, preview, buy (Hubtel) or free download.
- **Sections:** Hero (stats 50+/10K+/4.9) → Filter bar (category, price, search) → Templates grid (dynamic) → Features (4) → CTA. Plus payment modal, success modal, preview modal, download notification.
- **Interactive:** filters/search (js/cv-templates.js); buy button opens payment modal (name+email) → POST /careers/cv-templates/purchase/init → redirect to Hubtel checkoutUrl; free download prompts email then POST /careers/cv-templates/{id}/download; preview modal.
- **Data:** Railway API /api/careers/cv-templates; Hubtel for payment; localStorage for purchasedTemplates.
- **CSS:** styles, animations, responsive, privacy, terms + large inline `<style>` (~1047 lines). Note css/cv-templates.css exists but is NOT loaded here (dead/orphaned stylesheet).
- **Images:** template thumbnails from API (remote).
- **SEO:** title "CV Templates | Nedhub"; meta desc; no canonical.
- **Problems:** card number/expiry/CVV inputs in modal (UI only — Hubtel handles actual payment, but collecting card data in DOM is a risk/PCI concern even if not submitted); localStorage purchase tracking is client-side trust (can be spoofed); price "₵" rendering; API dependency.
- **Shared:** site-nav + site-footer.

### contact.html
- **Purpose:** Contact form + info for prospects.
- **Sections:** Hero (stats 24h/24/7/100%) → Contact section (form + info sidebar: phone, location, LinkedIn, email info@nedhub.com; business hours) → Map placeholder (links Google Maps) → Social cards (Facebook, LinkedIn, WhatsApp) → FAQ accordion (4 Q&A) → Final CTA.
- **Form (contactForm):** name, email, phone, subject, message. Validation via js/form-validation.js (module) AND js/contact-page.js (class). But submission is simulated (setTimeout, no network) — contact form does NOT actually send data anywhere. Duplicate handlers (both preventDefault). Email inconsistency: sidebar says info@nedhub.com, footer/other pages use careers@nedhubgh.com.
- **Interactive:** FAQ accordion (contact-page.js + main.js setupFAQ); form validation (two systems); map click → Google Maps; social cards.
- **Data:** hard-coded; no backend.
- **CSS:** styles, animations, responsive, privacy, terms.
- **SEO:** title "Contact Us | Nedhub"; meta desc; no canonical.
- **Problems:** form not actually submitted (fake success); duplicate validation systems; email inconsistency; map is placeholder only; phone not in sidebar contact method (only location/email/linkedin) — phone shown in info? Actually phone is in contact-methods? Let me check: contact-methods has Phone, Location, LinkedIn, Email — yes phone present. OK.
- **Shared:** site-nav + site-footer.

### digital-services.html (reference/)
- **Purpose:** Promote Bulk SMS + digital services app (app.nedhubgh.com). Separate standalone page with its own design system (Manrope). Note: this is in `reference/` folder but is the approved redesign reference; also linked from nav as "Digital Services App". Also a copy exists at root? No — only reference/digital-services.html. Nav links to digital-services.html (root) which would 404! Wait nav links to "digital-services.html" (root) but file is in reference/. Let me verify there's no root digital-services.html. Earlier glob showed only reference/digital-services.html. So nav link to /digital-services.html is BROKEN (404). Important finding.
- **Sections:** header (top, nav) → hero (h1 "Bulk SMS and everyday payments, from one wallet"; CTA Open platform https://app.nedhubgh.com, WhatsApp) → services (4 cards) → bulk features (6) → getting started (4 steps) → API section → rates/responsible use → FAQ (10) → close CTA → footer.
- **Interactive:** FAQ `<details>` (native) + JSON-LD FAQPage generated by inline script.
- **Data:** hard-coded; remote none; local Nedhublogo.PNG, Nedhubsymbol.PNG.
- **CSS:** inline `<style>` only (whole design system). Uses Manrope font (Google Fonts). No styles.css.
- **SEO:** best on site — canonical, OG, Twitter, FAQ JSON-LD.
- **Problems:** page is in reference/ folder but nav links to root path → broken link; if moved to root, relative asset paths fine. Separate design system (Manrope vs Inter) — redesign should unify. Footer inline (not site-footer.js).
- **Shared nav/footer:** NOT using site-nav/site-footer (has own header/footer inline).

### payment-success.html / payment-cancelled.html / payment-error.html
- **Purpose:** Post-payment result screens for Hubtel CV template flow.
- **Sections:** centered card with icon, title, subtitle, order details, actions.
- **Interactive:** none (static).
- **CSS:** styles + responsive + inline.
- **SEO:** basic meta.
- **Problems:** no shared nav/footer (standalone); payment-success needs visual check for detail rows.
- **Shared:** none.

### test_*.html (5)
- **Purpose:** QA harnesses for navigation, hamburger, mobile dropdown, terms modal, final navigation. Should not ship.
- **Risk:** Low but should be removed from production (or excluded). Needs visual check n/a.

### admin/index.html, login.html, register.html
- **Purpose:** Admin dashboard for managing jobs/applications (backend).
- **Interactive:** admin login form (email/password → backend auth JWT); register.
- **Data:** backend API (Nedhub production Railway) + MongoDB.
- **CSS:** styles + admin.css.
- **Problems:** backend dependency; JWT secret present in .env.example (value shown — flag as secret exposure, without printing value? The .env.example contains a JWT_SECRET value that looks like a real secret. I'll note location backend/.env.example line 14, type JWT secret, without value). Admin panel is part of repo though task says marketing-site only — flag folder map.
- **Shared nav/footer:** no (admin layout).

---

## Site-wide findings

### Design tokens
- **css/styles.css :root:** --primary-dark #0B132B; --accent-orange #F77F00; --neutral-white #FFFFFF; --neutral-gray #F4F6F8; --text-dark #2D3748; --text-light #718096; --border-color #E2E8F0; Inter font; 8px spacing (xs..xxl); shadows; radius sm/md/lg/full; transitions.
- **digital-services.html (approved system) inline:** --navy #0B132B; --navy-2 #1C2541; --orange #F77F00; --orange-d #E56A00; --paper #F4F6F8; Manrope font. Adds navy-2 and orange-d, uses Manrope not Inter, navy text color #0B132B not #2D3748.
- **Comparison:** Core brand colors match (#0B132B, #F77F00, #F4F6F8). Differences: font (Inter vs Manrope), text color (#2D3748 vs #0B132B), missing navy-2/orange-d tokens in styles.css, button styles differ (styles.css rounded-full gradient vs digital-services rounded-10px solid). Redesign should adopt Manrope + navy-2/orange-d and unify.

### Shared files
- **CSS:** css/styles.css (all marketing + admin pages); css/animations.css; css/responsive.css; css/privacy-modal.css; css/terms-modal.css; css/jobs.css (careers, job); css/job-detail.css (job); css/cv-templates.css (orphaned — not loaded by any page); css/admin.css (admin).
- **JS:** site-nav.js (all marketing pages except job.html); site-footer.js (all marketing pages except job.html + payment pages + digital-services); js/main.js (module, most pages); js/animations.js (module); js/nav.js (module, job.html); js/form-validation.js (module, contact); js/privacy-modal.js, js/terms-modal.js (most pages); js/jobs.js (careers); js/application-form.js (careers); js/contact-page.js (contact); js/cv-templates.js (cv-templates); js/job-detail.js (job); js/navigation.js (job); js/developer-credits.js (job); js/admin.js (admin).
- **Dead/duplicated:** css/cv-templates.css orphaned (not referenced); `.footer` CSS in styles.css only used by job.html (legacy); `.top` header CSS only in digital-services.html inline (legacy); three nav systems (site-nav.js, inline navbar+navigation.js, noscript fallback); two footer systems (site-footer.js + noscript inline footer); two form validation systems on contact (form-validation.js + contact-page.js); jobs.json in /data unused (frontend uses Railway API) — static data stale.

### Folder map
- Site (marketing): root *.html, css/, js/, assets/, site-nav.js, site-footer.js, CNAME.
- Not site: backend/ (Express API, models, routes, services including Brevo/Hubtel), admin/ (admin panel), data/ (jobs.json, applications.json), node_modules/, dist/, build.js, package.json (backend's), tsconfig.json, tests (test_*.html), reference/ (digital-services.html approved design), .env.example, LICENSE, README, summary md files.
- Hosting: CNAME (www.nedhubgh.com) present. No vercel.json/netlify.toml/_redirects/web.config. Static hosting assumed (GitHub Pages/Netlify). dist/ and build.js present (custom build). No browser-based deploy config in repo (unclear exact host).

### Forms and integrations
- contactForm (contact.html): no network submission (simulated). Destination: none.
- careerForm (careers.html): POST https://nedhub-production.up.railway.app/api/careers/apply; files to Cloudinary (cloud ddohto2tl, preset nedhub_careers_unsigned); backend emails via Brevo.
- payment-form (cv-templates.html): POST https://nedhub-production.up.railway.app/api/careers/cv-templates/purchase/init → redirect to Hubtel checkoutUrl; download POST /careers/cv-templates/{id}/download.
- admin login (admin/login.html): backend auth (JWT).
- Destination reachability: endpoint names only; reachability not verified from code (needs network check).
- Third-party embeds: Google Fonts (Manrope on digital-services), Font Awesome CDN, Unsplash images, Cloudinary, Hubtel, Railway API, Google Maps link.

### Content gaps / unverifiable claims
- "500+ clients", "1200+ placements", "98% success/satisfaction", "350 training programs", "50 experts", "8+ years", "50+ team", "2000+ trained", "85% productivity", "50+ modules", "1000+ staff placed", "40% cost reduction", "98% retention", "100+ projects", "60% faster decisions", "35% cost reduction", "1500+ coached", "80% advancement", "45 days", "50+ templates", "10K+ downloads", "4.9 rating", "200+ companies", "Trusted by 200+ Companies", "Award Winning", "5-Star Rated", "next training session starts soon", "limited slots". None verifiable from repo.
- Testimonials: Abena Kofi (TechCorp Ghana), Kwame Osei (Prime Industries), Yaw Mensah (GlobalTech Ltd) — unverifiable.
- Client logo carousel on index is empty (no logos).

### Legal pages
- Privacy Policy, Terms of Service, Cookie Policy do NOT exist as pages. Only footer `#` links + JS modals (privacy-modal.js, terms-modal.js) with placeholder content (emails privacy@nedhub.com, legal@nedhub.com). No cookie policy modal (references undefined window.cookieModal).
- Pages collecting personal data: contact.html (form), careers.html (application + CV upload), cv-templates.html (payment form: name/email/card), admin/login.html + register.html.

### Suggested redesign order (business value)
1. index.html — first impression, SEO, conversion; risk medium (animations, counters, jobs fetch).
2. contact.html — lead capture; risk medium (form currently fake — must wire to backend).
3. digital-services.html — revenue product (Bulk SMS app); risk low but separate system; move to root path (nav currently broken).
4. careers.html + job.html — recruitment funnel; risk high (API, filters, file upload, form).
5. cv-templates.html — revenue; risk high (Hubtel payment flow).
6. services.html + 5 service detail pages — content-heavy, low risk, reuse templates.
7. about.html — brand trust; low risk.
8. payment-*.html — low priority, standalone.
9. admin/* — out of marketing scope but keep backend contract.
10. Remove test_*.html from production.

### Risks per page
- careers.html: external API dependency (Railway), Cloudinary, form validation duplication, large inline CSS, mobile nav separate.
- cv-templates.html: Hubtel redirect, client-side purchase tracking (spoofable), card input UI, large inline CSS.
- contact.html: form not wired (simulated only) — biggest functional gap.
- job.html: legacy nav/footer inconsistency.
- digital-services.html: broken root path from nav; separate design system.

### Files read
All HTML pages listed, site-nav.js, site-footer.js, css/styles.css (partial, first 2000 lines + grep), js/*.js (main, animations, navigation, nav, form-validation, jobs, application-form, job-detail, cv-templates, contact-page, privacy-modal, terms-modal), data/jobs.json, data/applications.json, assets/images listing, backend/.env.example, package.json, CNAME, .gitignore, README.md, reference/digital-services.html.

### Files not read / partially
- css/styles.css beyond line 2000 (only grepped for .footer/.top); css/animations.css, responsive.css, privacy-modal.css, terms-modal.css, jobs.css, job-detail.css, cv-templates.css, admin.css — not read individually (referenced but not audited line-by-line); js/admin.js, developer-credits.js, nav.js full (partial); backend source files not read (out of scope, marketing only); dist/ build output not inspected; admin/index.html/register.html full content not read; payment-success/cancelled/error full content not read (only heads); image dimensions not checked; no visual check (no browser).

### Browser
No browser available. Anything requiring visual verification (contrast, layout, broken images at runtime, mobile rendering) marked "needs visual check".

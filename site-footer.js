(function () {
  'use strict';

  var css = [
    '.nf-footer{background:#0B132B;color:#d3dbea;padding:72px 0 32px;font-size:15px}',
    '.nf-wrap{max-width:1200px;margin:0 auto;padding:0 24px}',
    '.nf-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1.2fr;gap:40px}',
    '.nf-chip{background:#ffffff;padding:8px 12px;border-radius:10px;display:inline-block;margin-bottom:16px}',
    '.nf-chip img{height:40px;display:block}',
    '.nf-footer h4{color:#ffffff;margin-bottom:14px;font-size:16px;font-weight:700}',
    '.nf-footer p{color:#d3dbea;max-width:34ch}',
    '.nf-footer ul{list-style:none;margin:0;padding:0}',
    '.nf-footer li{margin-bottom:8px;color:#d3dbea}',
    '.nf-footer a{color:#d3dbea;text-decoration:none;transition:color .2s}',
    '.nf-footer a:hover{color:#F77F00}',
    '.nf-social{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border:1.5px solid #33416b;border-radius:50%;background:transparent;color:#ffffff;text-decoration:none;transition:background-color 150ms,border-color 150ms,color 150ms}',
    '.nf-social svg{width:20px;height:20px;fill:currentColor;display:block}',
    '.nf-social:hover,.nf-social:focus-visible{background:#F77F00;border-color:#F77F00;color:#0B132B;outline:none}',
    '.nf-social:focus-visible{outline:3px solid #F77F00;outline-offset:3px}',
    '.nf-socials{display:flex;gap:12px;flex-wrap:wrap}',
    '.nf-legal{border-top:1px solid #33416b;margin-top:44px;padding-top:22px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:14px;color:#d3dbea}',
    '.nf-credit{text-align:center;padding:22px 16px 10px}',
    '.nf-credit a{text-decoration:none;display:inline-flex;flex-direction:column;align-items:center;gap:10px;color:#d3dbea}',
    '.nf-credit a:hover{color:#F77F00}',
    '.nf-credit-logo{height:36px;width:auto;border-radius:4px;display:block}',
    '.nf-credit-text{margin:0;font-size:14px;letter-spacing:0.08em;color:#d3dbea;font-weight:500}',
    '.nf-credit a:hover .nf-credit-text{color:#F77F00}',
    '@media(max-width:900px){.nf-grid{grid-template-columns:1fr 1fr}}',
    '@media(max-width:560px){.nf-grid{grid-template-columns:1fr}}',
    '@media(prefers-reduced-motion:reduce){.nf-footer a,.nf-credit a,.nf-social{transition:none!important}}'
  ].join('');

  var footerHtml =
    '<footer class="nf-footer">' +
      '<div class="nf-wrap">' +
        '<div class="nf-grid">' +
          '<div class="nf-brand">' +
            '<div class="nf-chip"><img src="/Nedhubsymbol.PNG" alt="Nedhub Ghana"></div>' +
            '<p>Empowering businesses with innovative, data-driven corporate solutions for sustainable growth and success.</p>' +
          '</div>' +
          '<div class="nf-links"><h4>Quick links</h4><ul>' +
            '<li><a href="/index.html">Home</a></li>' +
            '<li><a href="/about.html">About Us</a></li>' +
            '<li><a href="/services.html">Services</a></li>' +
            '<li><a href="/careers.html">Careers</a></li>' +
            '<li><a href="/cv-templates.html">CV Templates</a></li>' +
            '<li><a href="/contact.html">Contact</a></li>' +
          '</ul></div>' +
          '<div class="nf-services"><h4>Our services</h4><ul>' +
            '<li><a href="/recruitment.html">Recruitment</a></li>' +
            '<li><a href="/training.html">Training</a></li>' +
            '<li><a href="/data-analytics.html">Data Analytics</a></li>' +
            '<li><a href="/digital-services.html">Digital Services</a></li>' +
          '</ul></div>' +
          '<div class="nf-contact"><h4>Contact us</h4><ul>' +
            '<li>Phone: <a href="tel:+233271177321">+233 271 177 321</a></li>' +
            '<li>WhatsApp: <a href="https://wa.me/233506288940/">+233 50 628 8940</a></li>' +
            '<li>Roman Ridge, Accra, Ghana</li>' +
            '<li><div class="nf-socials">' +
              '<a href="https://www.facebook.com/profile.php?id=61587433270353" target="_blank" rel="noopener noreferrer" class="nf-social" aria-label="Nedhub on Facebook"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2.16C6.06 2.16 2 6.22 2 12.36c0 5.21 3.91 9.42 8.73 9.86v-6.84H7.2v-2.8h2v-2.7c0-2.5 1.5-3.8 3.9-3.8 1.1 0 2.1.1 2.5.1v2.3l-1.9.1v2.8h3l-.2-1.6h-3c-.1 0-.3 0-.4-.1-.4-.3-.7-1-.7-1.9 0-.2.1-.4.1-.6 1-.1 2-.1 3-.1v-2c0-1.6-.9-2.4-2.3-2.4-2.2 0-3.8 1.7-3.8 3.7v2.3H5.6v2.7h3.5v2.8H5.6v6.84c4.82-.44 8.72-4.65 8.72-9.86 0-6.14-4.06-10.2-10-10.2"/></svg></a>' +
              '<a href="https://www.instagram.com/nedhubgh?igsh=cHRkbjl6anpzZGsz" target="_blank" rel="noopener noreferrer" class="nf-social" aria-label="Nedhub on Instagram"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2.16C6.32 2.16 2 6.48 2 12.36s4.32 10.2 10 10.2 10-4.32 10-10.2S17.68 2.16 12 2.16m0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8m0-16c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4m0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2"/></svg></a>' +
              '<a href="https://www.linkedin.com/company/hr-klinic/" target="_blank" rel="noopener noreferrer" class="nf-social" aria-label="Nedhub on LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M4.98 3.5c0-1.38-1.72-2.53-3.84-2.53S1.26 4.88 1.26 3.5c0-1.38 1.72-2.53 3.84-2.53S4.98 2.12 4.98 3.5m0 21.36h-3.7V14.1h3.7v10.86zm-1.2-21.36c-1.4 0-2.6 1.1-2.6 2.5s1.2 2.5 2.6 2.5 2.6-1.1 2.6-2.5-1.2-2.5-2.6-2.5m7.2 21.36h-3.6v-8.1c0-2.1 0-4-1.2-5.3 0-1.3-1.3-2.4-3-2.4-1.8 0-3.1 1-3.5 2.4v-8h-3.7v13h3.7v-2.4c0-.1 0-.2.1-.3.1-.5.3-.9.7-1.2.5-.5 1.2-.8 1.9-.8 2.5 0 4 1.8 4 4.3v8h3.6z"/></svg></a>' +
            '</div></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="nf-legal">' +
          '<span>© 2026 Nedhub Ghana. All rights reserved.</span>' +
          '<span><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Cookie Policy</a></span>' +
        '</div>' +
        '<div class="nf-credit">' +
          '<a href="https://www.dromornarh.com/" target="_blank" rel="noopener noreferrer">' +
            '<img src="/assets/images/dhronetechlogo.jpg" alt="DhroneTech Solutions" class="nf-credit-logo">' +
            '<p class="nf-credit-text">Developed by Dromor Narh for DhroneTech Solutions</p>' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</footer>';

  var style = document.createElement('style');
  style.textContent = css;

  var wrap = document.createElement('div');
  wrap.innerHTML = footerHtml;
  var footer = wrap.querySelector('.nf-footer');

  function inject() {
    if (document.head) document.head.appendChild(style);
    if (document.body) {
      // Replace the static noscript footer so there is never more than one footer in the DOM.
      document.querySelectorAll('noscript').forEach(function (ns) {
        if (ns.firstElementChild && ns.firstElementChild.tagName === 'FOOTER') {
          ns.remove();
        }
      });
      document.body.appendChild(footer);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

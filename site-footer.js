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
    '.nf-legal{border-top:1px solid #33416b;margin-top:44px;padding-top:22px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:14px;color:#d3dbea}',
    '.nf-credit{text-align:center;padding:22px 16px 10px}',
    '.nf-credit a{text-decoration:none;display:inline-flex;flex-direction:column;align-items:center;gap:10px;color:#d3dbea}',
    '.nf-credit a:hover{color:#F77F00}',
    '.nf-credit-logo{height:36px;width:auto;border-radius:4px;display:block}',
    '.nf-credit-text{margin:0;font-size:14px;letter-spacing:0.08em;color:#d3dbea;font-weight:500}',
    '.nf-credit a:hover .nf-credit-text{color:#F77F00}',
    '@media(max-width:900px){.nf-grid{grid-template-columns:1fr 1fr}}',
    '@media(max-width:560px){.nf-grid{grid-template-columns:1fr}}',
    '@media(prefers-reduced-motion:reduce){.nf-footer a,.nf-credit a{transition:none!important}}'
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
            '<li><a href="https://www.facebook.com/profile.php?id=61587433270353">Facebook</a> · <a href="https://www.instagram.com/nedhubgh?igsh=cHRkbjl6anpzZGsz">Instagram</a> · <a href="https://www.linkedin.com/company/hr-klinic/">LinkedIn</a></li>' +
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

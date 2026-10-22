(function () {
  'use strict';

  var css = [
    '.nh-top{background:#ffffff;border-bottom:1px solid #dde3ec;position:sticky;top:0;z-index:30;backdrop-filter:saturate(180%) blur(8px)}',
    '.nh-top .nh-wrap{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:76px;max-width:1200px;margin:0 auto;padding:0 24px}',
    '.nh-logo{display:block}',
    '.nh-logo img{height:40px;display:block}',
    '.nh-nav{display:flex;gap:20px;align-items:center;flex-wrap:wrap;justify-content:flex-end}',
    '.nh-link{text-decoration:none;font-weight:600;font-size:15px;color:#0B132B;padding:6px 2px;border-bottom:2px solid transparent;transition:color .2s,border-color .2s}',
    '.nh-link:hover{color:#E56A00}',
    '.nh-link.nh-cur{color:#0B132B;border-bottom-color:#F77F00}',
    '@media (max-width:820px){.nh-top .nh-wrap{flex-wrap:wrap;padding-top:10px;padding-bottom:10px;min-height:auto}.nh-nav{width:100%;gap:14px;justify-content:flex-start}.nh-link{font-size:14px}}',
    '@media (max-width:360px){.nh-top .nh-wrap{padding:0 16px}}'
  ].join('');

  var servicePages = { 'recruitment.html':1, 'outsourcing.html':1, 'training.html':1, 'career-coaching.html':1, 'data-analytics.html':1 };

  var current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (servicePages[current]) current = 'services.html';

  var links = [
    ['index.html', 'Home'],
    ['about.html', 'About Us'],
    ['services.html', 'Services'],
    ['careers.html', 'Careers'],
    ['cv-templates.html', 'CV Templates'],
    ['contact.html', 'Contact'],
    ['digital-services.html', 'Digital Services App']
  ];

  var header = document.createElement('header');
  header.className = 'nh-top';
  var navLinks = links.map(function (pair) {
    return '<a href="/' + pair[0] + '" class="nh-link" data-nh="' + pair[0] + '">' + pair[1] + '</a>';
  }).join('');
  header.innerHTML =
    '<div class="nh-wrap">' +
      '<a href="/index.html" class="nh-logo" aria-label="Nedhub Ghana home"><img src="/Nedhublogo.PNG" alt="Nedhub Ghana"></a>' +
      '<nav class="nh-nav" aria-label="Main">' + navLinks + '</nav>' +
    '</div>';

  header.querySelectorAll('.nh-link').forEach(function (link) {
    if (link.getAttribute('data-nh') === current) {
      link.classList.add('nh-cur');
      link.setAttribute('aria-current', 'page');
    }
  });

  var style = document.createElement('style');
  style.textContent = css;

  function inject() {
    if (document.head) document.head.appendChild(style);
    if (document.body) document.body.insertBefore(header, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

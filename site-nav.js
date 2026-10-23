(function () {
  'use strict';

  var css = [
    '.nh-top{background:#ffffff;border-bottom:1px solid #dde3ec;position:sticky;top:0;z-index:1001;backdrop-filter:saturate(180%) blur(8px)}',
    '.nh-top .nh-wrap{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:76px;max-width:1200px;margin:0 auto;padding:0 24px}',
    '.nh-logo{display:block}',
    '.nh-logo img{height:40px;display:block}',
    '.nh-nav{display:flex;gap:20px;align-items:center;flex-wrap:wrap;justify-content:flex-end}',
    '.nh-header .nh-link{text-decoration:none!important;font-weight:600;font-size:15px;color:#0B132B!important;padding:6px 2px;border-bottom:2px solid transparent;transition:color .2s,border-color .2s}',
    '.nh-header .nh-link:hover{color:#E56A00!important}',
    '.nh-header .nh-link.nh-cur{color:#0B132B!important;border-bottom-color:#F77F00!important}',
    '.nh-menu-btn{display:none;align-items:center;justify-content:center;width:44px;height:44px;min-width:44px;min-height:44px;background:transparent;border:none;cursor:pointer;padding:0;color:#0B132B;border-radius:6px}',
    '.nh-menu-btn:focus-visible{outline:3px solid #F77F00;outline-offset:2px}',
    '.nh-burger{display:block;width:22px;height:16px;position:relative}',
    '.nh-bar{position:absolute;left:0;width:100%;height:2px;background:#0B132B;border-radius:2px;transition:transform .18s ease,opacity .18s ease,top .18s ease}',
    '.nh-bar1{top:0}',
    '.nh-bar2{top:7px}',
    '.nh-bar3{top:14px}',
    '.nh-menu-btn.nh-open .nh-bar1{top:7px;transform:rotate(45deg)}',
    '.nh-menu-btn.nh-open .nh-bar2{opacity:0}',
    '.nh-menu-btn.nh-open .nh-bar3{top:7px;transform:rotate(-45deg)}',
    '.nh-panel{position:absolute;top:100%;left:0;right:0;background:#ffffff;border-bottom:1px solid #dde3ec;box-shadow:0 8px 24px rgba(0,0,0,.12);opacity:0;transform:translateY(-8px);visibility:hidden;pointer-events:none;transition:opacity .18s ease,transform .18s ease,visibility .18s ease;max-height:calc(100vh - 76px);overflow-y:auto;z-index:1}',
    '.nh-panel.nh-open{opacity:1;transform:none;visibility:visible;pointer-events:auto}',
    '.nh-panel-list{list-style:none;margin:0;padding:0}',
    '.nh-panel-link{display:flex;align-items:center;min-height:48px;padding:0 16px;border-left:4px solid transparent;font-size:17px;font-weight:600;color:#0B132B;text-decoration:none;border-bottom:1px solid #dde3ec}',
    '.nh-panel-link:last-child{border-bottom:none}',
    '.nh-panel-link.nh-cur{border-left-color:#F77F00;font-weight:700}',
    '.nh-panel-link:hover{background:#f5f7fa}',
    '.nh-platform-btn{display:block;margin:12px 16px;padding:14px 16px;background:#F77F00;color:#0B132B;font-weight:700;font-size:16px;text-align:center;text-decoration:none;border-radius:8px;min-height:48px;line-height:20px}',
    'body.nh-menu-open{overflow:hidden}',
    '@media (prefers-reduced-motion: reduce){.nh-panel{transition:none;transform:none}.nh-bar{transition:none}}',
    '@media (max-width:820px){.nh-top .nh-wrap{flex-wrap:wrap;padding-top:10px;padding-bottom:10px;min-height:auto}.nh-nav{display:none}.nh-menu-btn{display:inline-flex}.nh-panel{display:block}}',
    '@media (min-width:821px){.nh-menu-btn{display:none}.nh-panel{display:none}}',
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

  function linkHtml(pair, cls) {
    var cur = pair[0] === current ? ' nh-cur' : '';
    var aria = pair[0] === current ? ' aria-current="page"' : '';
    return '<a href="/' + pair[0] + '" class="' + cls + cur + '" data-nh="' + pair[0] + '"' + aria + '>' + pair[1] + '</a>';
  }

  var header = document.createElement('header');
  header.className = 'nh-top nh-header';

  var navLinks = links.map(function (pair) { return linkHtml(pair, 'nh-link'); }).join('');
  var panelLinks = links.map(function (pair) { return '<li>' + linkHtml(pair, 'nh-panel-link') + '</li>'; }).join('');

  header.innerHTML =
    '<div class="nh-wrap">' +
      '<a href="/index.html" class="nh-logo" aria-label="Nedhub Ghana home"><img src="/Nedhublogo.PNG" alt="Nedhub Ghana"></a>' +
      '<button type="button" class="nh-menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="nh-menu-panel">' +
        '<span class="nh-burger" aria-hidden="true">' +
          '<span class="nh-bar nh-bar1"></span>' +
          '<span class="nh-bar nh-bar2"></span>' +
          '<span class="nh-bar nh-bar3"></span>' +
        '</span>' +
      '</button>' +
      '<nav class="nh-nav" aria-label="Main">' + navLinks + '</nav>' +
    '</div>' +
    '<nav id="nh-menu-panel" class="nh-panel" aria-label="Mobile menu">' +
      '<ul class="nh-panel-list">' + panelLinks + '</ul>' +
      '<a class="nh-platform-btn" href="https://app.nedhubgh.com">Open the platform</a>' +
    '</nav>';

  var btn = header.querySelector('.nh-menu-btn');
  var panel = header.querySelector('.nh-panel');

  function setMaxHeight() {
    panel.style.maxHeight = (window.innerHeight - header.offsetHeight) + 'px';
  }

  function openMenu() {
    btn.classList.add('nh-open');
    panel.classList.add('nh-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('nh-menu-open');
    setMaxHeight();
  }

  function closeMenu(returnFocus) {
    btn.classList.remove('nh-open');
    panel.classList.remove('nh-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('nh-menu-open');
    if (returnFocus) btn.focus();
  }

  btn.addEventListener('click', function () {
    if (panel.classList.contains('nh-open')) closeMenu(false);
    else openMenu();
  });

  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { closeMenu(false); });
  });

  document.addEventListener('click', function (e) {
    if (panel.classList.contains('nh-open') && !header.contains(e.target)) {
      closeMenu(false);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('nh-open')) {
      closeMenu(true);
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 820 && panel.classList.contains('nh-open')) {
      closeMenu(false);
    }
    setMaxHeight();
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

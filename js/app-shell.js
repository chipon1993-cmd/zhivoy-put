/**
 * App Shell — Tab Bar + Navigation
 * Injects bottom tab bar on app pages (dashboard, navigator, stats, programs)
 */
(function() {
  'use strict';

  var path = window.location.pathname;
  var inSubfolder = path.includes('/pages/');
  var root = inSubfolder ? '../' : '';

  // Determine active tab
  var currentPage = path.split('/').pop() || 'index.html';
  var tabs = [
    { id: 'dashboard', icon: '🏠', label: 'Главная', href: root + 'pages/dashboard.html' },
    { id: 'navigator', icon: '🧘', label: 'Практики', href: root + 'pages/navigator.html' },
    { id: 'mirror', icon: '🪞', label: 'Зеркало', href: root + 'pages/mirror.html' },
    { id: 'programs', icon: '🌀', label: 'Спирали', href: root + 'pages/programs.html' },
    { id: 'stats', icon: '📊', label: 'Наблюдение', href: root + 'pages/stats.html' }
  ];

  var pageToTab = {
    'dashboard.html': 'dashboard',
    'navigator.html': 'navigator',
    'mirror.html': 'mirror',
    'programs.html': 'programs',
    'stats.html': 'stats'
  };

  var activeTab = pageToTab[currentPage] || '';

  // Build tab bar HTML
  var tabBarHTML = '<nav class="app-tab-bar">';
  tabs.forEach(function(tab) {
    var isActive = tab.id === activeTab ? ' active' : '';
    tabBarHTML += '<a href="' + tab.href + '" class="app-tab' + isActive + '">';
    tabBarHTML += '<span class="app-tab-icon">' + tab.icon + '</span>';
    tabBarHTML += '<span class="app-tab-label">' + tab.label + '</span>';
    tabBarHTML += '</a>';
  });
  tabBarHTML += '</nav>';

  // Inject tab bar
  var tabBarEl = document.getElementById('app-tab-bar');
  if (tabBarEl) {
    tabBarEl.innerHTML = tabBarHTML;
  } else {
    // Append to body
    var div = document.createElement('div');
    div.id = 'app-tab-bar';
    div.innerHTML = tabBarHTML;
    document.body.appendChild(div);
  }

  // Add app-page class to main content for padding
  var mainEl = document.querySelector('main');
  if (mainEl) {
    mainEl.classList.add('app-page');
  }
})();

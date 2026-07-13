// Global Layout Injection & UI Helpers

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject App Shell Layout (Sidebar & Header) for Admin Pages
  injectAdminLayout();

  // 2. Setup Mobile Navigation Sidebar Toggle
  setupMobileToggle();
  
  // 3. Setup Modal Dismiss Listeners
  setupModalCloseListeners();
});

/**
 * Dynamically injects the sidebar and header on admin pages
 */
function injectAdminLayout() {
  const container = document.getElementById('layout-wrapper');
  if (!container) return; // Not an admin page with a layout wrapper

  const path = window.location.pathname.toLowerCase();
  
  // Determine if we are on a page inside /pages
  const isInPagesDir = path.includes('/pages/');

  // Injected Sidebar HTML
  const sidebarHtml = `
    <aside class="sidebar" id="app-sidebar">
      <div class="sidebar-brand">
        <svg viewBox="0 0 24 24"><path d="M18 11H6V6h12m-1.5 11a1.5 1.5 0 1 1-1.5-1.5 1.5 1.5 0 0 1 1.5 1.5M9.5 17a1.5 1.5 0 1 1-1.5-1.5 1.5 1.5 0 0 1 1.5 1.5M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V9a7 7 0 0 0-14 0v7z"/></svg>
        <span class="sidebar-brand-name">Smart Bus</span>
      </div>
      <ul class="sidebar-menu">
        <li class="sidebar-menu-item" id="nav-dashboard">
          <a href="dashboard.html">
            <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
            Dashboard
          </a>
        </li>
        <li class="sidebar-menu-item" id="nav-bus">
          <a href="bus.html">
            <svg viewBox="0 0 24 24"><path d="M18 11H6V6h12m-1.5 11a1.5 1.5 0 1 1-1.5-1.5 1.5 1.5 0 0 1 1.5 1.5M9.5 17a1.5 1.5 0 1 1-1.5-1.5 1.5 1.5 0 0 1 1.5 1.5M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V9a7 7 0 0 0-14 0v7z"/></svg>
            Buses
          </a>
        </li>
        <li class="sidebar-menu-item" id="nav-route">
          <a href="route.html">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
            Routes
          </a>
        </li>
        <li class="sidebar-menu-item" id="nav-schedule">
          <a href="schedule.html">
            <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
            Schedules
          </a>
        </li>
        <li class="sidebar-menu-item">
          <a href="passenger.html">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            Passenger Portal
          </a>
        </li>
      </ul>
      <div class="sidebar-footer">
        <button class="btn-logout" id="sidebar-logout-btn">
          <svg viewBox="0 0 24 24"><path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9z"/></svg>
          Logout
        </button>
      </div>
    </aside>
  `;

  // Prepend sidebar to the main layout wrapper
  container.insertAdjacentHTML('afterbegin', sidebarHtml);

  // Set Active Menu Item
  setActiveMenuItem();

  // Inject Header inside the main-content panel
  const mainContent = container.querySelector('.main-content');
  if (mainContent) {
    const adminUser = window.Auth ? window.Auth.getAdmin() : null;
    const adminName = adminUser ? adminUser.name : 'Administrator';
    const initials = adminName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Get current page details for breadcrumb
    let breadcrumbTitle = 'Dashboard';
    let breadcrumbSubtitle = 'Overview of bus operations';
    
    if (path.includes('bus.html')) {
      breadcrumbTitle = 'Buses';
      breadcrumbSubtitle = 'Manage bus fleet and drivers';
    } else if (path.includes('route.html')) {
      breadcrumbTitle = 'Routes';
      breadcrumbSubtitle = 'Manage transit paths and locations';
    } else if (path.includes('schedule.html')) {
      breadcrumbTitle = 'Schedules';
      breadcrumbSubtitle = 'Assign buses to routes and timetables';
    }

    const headerHtml = `
      <header class="top-header">
        <div style="display: flex; align-items: center; gap: 16px;">
          <!-- Mobile Menu Burger Button -->
          <button class="btn-secondary" id="mobile-sidebar-toggle" style="display: none; padding: 8px; border-radius: var(--radius-sm);">
            <svg style="width: 24px; height: 24px; fill: currentColor;" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>
          <div class="header-title-container">
            <h1>${breadcrumbTitle}</h1>
            <p>${breadcrumbSubtitle}</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="user-profile">
            <div class="user-avatar">${initials}</div>
            <div class="user-info">
              <span class="user-name">${adminName}</span>
              <span class="user-role">System Admin</span>
            </div>
          </div>
        </div>
      </header>
    `;

    mainContent.insertAdjacentHTML('afterbegin', headerHtml);
  }

  // Bind Logout Action
  const logoutBtn = document.getElementById('sidebar-logout-btn');
  if (logoutBtn && window.Auth) {
    logoutBtn.addEventListener('click', () => {
      window.Auth.logout();
    });
  }
}

/**
 * Highlights the menu item based on current page URL
 */
function setActiveMenuItem() {
  const path = window.location.pathname.toLowerCase();
  
  // Reset active classes
  const menuItems = document.querySelectorAll('.sidebar-menu-item');
  menuItems.forEach(item => item.classList.remove('active'));

  // Match path
  let activeId = '';
  if (path.includes('dashboard.html')) {
    activeId = 'nav-dashboard';
  } else if (path.includes('bus.html')) {
    activeId = 'nav-bus';
  } else if (path.includes('route.html')) {
    activeId = 'nav-route';
  } else if (path.includes('schedule.html')) {
    activeId = 'nav-schedule';
  }

  if (activeId) {
    const activeEl = document.getElementById(activeId);
    if (activeEl) activeEl.classList.add('active');
  }
}

/**
 * Setup mobile slide-in sidebar toggle
 */
function setupMobileToggle() {
  const toggleBtn = document.getElementById('mobile-sidebar-toggle');
  const sidebar = document.getElementById('app-sidebar');
  if (!toggleBtn || !sidebar) return;

  // Show toggle button in CSS on mobile view widths
  toggleBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  window.addEventListener('resize', () => {
    toggleBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  });

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
  });

  // Close sidebar clicking outside
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggleBtn) {
      sidebar.classList.remove('open');
    }
  });
}

/**
 * Modal visibility control helpers
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden'; // Lock background scroll
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = ''; // Restore scroll
  
  // Clear any errors or alerts in the modal if they exist
  const form = modal.querySelector('form');
  if (form) form.reset();
  
  const alert = modal.querySelector('.alert');
  if (alert) alert.style.display = 'none';
}

function setupModalCloseListeners() {
  const overlays = document.querySelectorAll('.modal-overlay');
  overlays.forEach(overlay => {
    // Close button click
    const closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeModal(overlay.id);
      });
    }

    // Secondary/Cancel buttons inside modals
    const cancelBtns = overlay.querySelectorAll('.btn-close-modal');
    cancelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(overlay.id);
      });
    });

    // Clicking outside modal content panel closes it
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });
}

// Export functions to global scope
window.openModal = openModal;
window.closeModal = closeModal;

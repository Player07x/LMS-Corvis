import { initResizableSidebar } from '/assets/js/sidebar-layout.js';

function parseStoredUser() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return { nome: storedUser };
  }
}

function setText(root, id, value) {
  const element = root.querySelector(`#${id}`);
  if (element) element.textContent = value;
}

function setupAdminProfile(root) {
  const user = parseStoredUser();
  const token = localStorage.getItem('accessToken');

  if (!token || !user) {
    window.location.href = '/login';
    return;
  }

  const name = user?.nome || user?.name || user?.email?.split('@')[0] || 'Admin';
  const email = user?.email || 'admin@corvis.com';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'AD';

  const avatar = root.querySelector('#profileAvatar');
  if (avatar?.firstChild) avatar.firstChild.textContent = initials;
  setText(root, 'adminProfileHeading', name);
  setText(root, 'profileEmail', email);

  root.querySelector('#logoutButton')?.addEventListener('click', () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  });
}

function setupActiveLinks(root) {
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';

  root.querySelectorAll('[data-sidebar-link]').forEach(link => {
    const href = new URL(link.getAttribute('href'), window.location.origin)
      .pathname
      .replace(/\/+$/, '') || '/';
    const isActive = href === currentPath || (href === '/admin' && currentPath === '/admin');

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

async function loadSidebar(container) {
  const componentUrl = container.dataset.sidebarComponent;
  if (!componentUrl) return;

  try {
    const response = await fetch(componentUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    container.innerHTML = await response.text();
    setupAdminProfile(container);
    setupActiveLinks(container);

    const layout = container.closest('.app-layout');
    initResizableSidebar({
      layout,
      sidebarContainer: container,
      storageKey: container.dataset.sidebarStorageKey || 'corvis.admin.sidebar.width',
    });

    document.dispatchEvent(new CustomEvent('corvis:sidebar-loaded', { detail: { container } }));
  } catch (error) {
    console.error('Erro ao carregar sidebar:', error);
    container.innerHTML = '<aside class="admin-sidebar"><p>Erro ao carregar a barra lateral. Atualize a pagina ou verifique os arquivos do componente.</p></aside>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-sidebar-component]').forEach(loadSidebar);
});

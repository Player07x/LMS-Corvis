const token = localStorage.getItem('accessToken');
const user = parseStoredUser();

if (!token || !user) {
  window.location.href = '/login';
}

const state = {
  trails: [],
  query: '',
  category: '',
  sort: 'recent',
  pendingDeleteId: null
};

const icons = {
  modules: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 5h14v14H5z"></path><path d="M8 9h8M8 13h5"></path></svg>`,
  edit: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M9 7l1-2h4l1 2M6 7l1 13h10l1-13"></path></svg>`
};

const $ = id => document.getElementById(id);

let toastTimer;

document.addEventListener('DOMContentLoaded', () => {
  setupProfile();
  bindEvents();
  fetchTrilhas();
});

document.addEventListener('corvis:sidebar-loaded', () => {
  setupProfile();
  setupSummary();
});

async function fetchTrilhas() {
  try {
    const response = await fetch('http://localhost:8080/trilha', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao buscar trilhas');

    const trilhas = await response.json();
    state.trails = (trilhas.content || []).map(mapTrail);
    setupSummary();
    render();
  } catch (error) {
    console.error('Erro:', error);
    $('resultMessage').innerHTML = '<strong>Erro ao carregar trilhas.</strong> Verifique se a API está online.';
    $('emptyResults').classList.add('is-visible');
  }
}

function mapTrail(trilha) {
  const modules = (trilha.modulos || [])
    .slice()
    .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0))
    .map((modulo, index) => ({
      title: `${modulo.ordem || index + 1} - ${modulo.titulo || 'Módulo sem título'}`,
      content: stripHtml(modulo.conteudo || 'Conteúdo não informado.')
    }));

  return {
    id: trilha.id,
    title: trilha.nome || 'Trilha sem nome',
    description: trilha.descricao || 'Sem descrição cadastrada.',
    category: trilha.categoria?.nome || 'Sem categoria',
    modules,
    editHref: `/admin/forms/form-trilha.html?id=${trilha.id}`
  };
}

function setupProfile() {
  if (!$('profileAvatar') || !$('adminProfileHeading') || !$('profileEmail')) return;

  const name = user?.nome || user?.name || user?.email?.split('@')[0] || 'Admin';
  const email = user?.email || 'admin@corvis.com';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'AD';

  $('profileAvatar').firstChild.textContent = initials;
  $('adminProfileHeading').textContent = name;
  $('profileEmail').textContent = email;
}

function bindEvents() {
  $('searchInput').addEventListener('input', event => {
    state.query = event.target.value.trim();
    render();
  });

  $('categoryFilter').addEventListener('change', event => {
    state.category = event.target.value;
    render();
  });

  $('sortSelect').addEventListener('change', event => {
    state.sort = event.target.value;
    render();
  });

  $('focusSearchButton').addEventListener('click', () => {
    $('searchInput').focus();
    $('searchInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $('clearFiltersButton').addEventListener('click', clearFilters);

  $('trailGrid').addEventListener('click', event => {
    const deleteButton = event.target.closest('[data-delete-id]');
    if (!deleteButton) return;

    state.pendingDeleteId = Number(deleteButton.dataset.deleteId);
    $('deleteText').textContent = `Você está prestes a excluir “${deleteButton.dataset.deleteTitle || 'esta trilha'}”. Essa ação não poderá ser desfeita.`;
    $('deleteDialog').showModal();
  });

  $('cancelDeleteButton').addEventListener('click', () => $('deleteDialog').close());
  $('confirmDeleteButton').addEventListener('click', confirmDelete);

  $('logoutButton')?.addEventListener('click', () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  });

  $('collapseButton')?.addEventListener('click', () => {
    showToast('Painel lateral', 'Este painel permanece visível para manter o contexto administrativo da tela.');
  });
}

function setupSummary() {
  const totalModules = state.trails.reduce((sum, trail) => sum + trail.modules.length, 0);
  $('totalTrails').textContent = state.trails.length;
  $('totalModules').textContent = totalModules;
  if ($('sideTrailCount')) {
    $('sideTrailCount').textContent = `${state.trails.length} ${state.trails.length === 1 ? 'trilha disponivel' : 'trilhas disponiveis'}`;
  }
  if ($('sideModuleCount')) {
    $('sideModuleCount').textContent = `${totalModules} ${totalModules === 1 ? 'modulo cadastrado' : 'modulos cadastrados'}`;
  }

  const categories = [...new Set(state.trails.map(trail => trail.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  $('categoryFilter').innerHTML = `<option value="">Todas as categorias</option>${categories.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join('')}`;
}

function filteredTrails() {
  const normalized = state.query.toLocaleLowerCase('pt-BR');
  let result = state.trails.filter(trail => {
    const haystack = [
      trail.title,
      trail.description,
      trail.category,
      ...trail.modules.map(module => `${module.title} ${module.content}`)
    ].join(' ').toLocaleLowerCase('pt-BR');

    return (!normalized || haystack.includes(normalized))
      && (!state.category || trail.category === state.category);
  });

  result = [...result].sort((a, b) => {
    if (state.sort === 'name-asc') return a.title.localeCompare(b.title, 'pt-BR');
    if (state.sort === 'name-desc') return b.title.localeCompare(a.title, 'pt-BR');
    if (state.sort === 'modules-desc') return b.modules.length - a.modules.length;
    if (state.sort === 'modules-asc') return a.modules.length - b.modules.length;
    return state.trails.indexOf(a) - state.trails.indexOf(b);
  });

  return result;
}

function render() {
  const visible = filteredTrails();
  $('trailGrid').innerHTML = visible.map(trailCard).join('');
  $('emptyResults').classList.toggle('is-visible', visible.length === 0);
  const term = state.query ? ` para “${escapeHTML(state.query)}”` : '';
  $('resultMessage').innerHTML = `<strong>${visible.length}</strong> ${visible.length === 1 ? 'trilha encontrada' : 'trilhas encontradas'}${term}.`;
}

function trailCard(trail) {
  const preview = trail.modules.slice(0, 3);
  const moreLabel = trail.modules.length
    ? `Ver ${trail.modules.length === 1 ? 'detalhe do módulo' : `todos os ${trail.modules.length} módulos`}`
    : '';

  const previewHTML = preview.length
    ? preview.map((module, index) => `
      <li>
        <span class="module-number">${moduleNumber(module.title, index + 1)}</span>
        <span title="${escapeHTML(moduleTitle(module.title))}">${escapeHTML(moduleTitle(module.title))}</span>
      </li>
    `).join('')
    : `<li><span class="module-number">—</span><span>Nenhum módulo cadastrado</span></li>`;

  const detailsHTML = trail.modules.length
    ? `
      <details class="modules-more">
        <summary>${moreLabel}</summary>
        <div class="modules-full">
          ${trail.modules.map((module, index) => `
            <article class="module-full-item">
              <strong>${escapeHTML(moduleNumber(module.title, index + 1))} · ${escapeHTML(moduleTitle(module.title))}</strong>
              <p title="${escapeHTML(module.content)}">${escapeHTML(truncate(module.content, 180))}</p>
            </article>
          `).join('')}
        </div>
      </details>
    `
    : '';

  return `
    <article class="trail-card">
      <header class="trail-card-header">
        <div class="card-topline">
          <span class="category-tag" title="${escapeHTML(trail.category)}">${escapeHTML(trail.category)}</span>
          <span class="modules-count">${trail.modules.length} ${trail.modules.length === 1 ? 'módulo' : 'módulos'}</span>
        </div>
        <h2>${escapeHTML(trail.title)}</h2>
        <p class="trail-description">${escapeHTML(trail.description)}</p>
      </header>

      <div class="trail-modules">
        <div class="modules-label">
          <span>Prévia dos módulos</span>
          <span>${icons.modules}</span>
        </div>
        <ol class="module-preview">${previewHTML}</ol>
        ${detailsHTML}
      </div>

      <footer class="trail-card-footer">
        <a class="button button-card card-edit" href="${escapeHTML(trail.editHref)}">
          ${icons.edit}
          Editar
        </a>
        <div class="card-actions">
          <button class="button button-card card-delete" type="button" data-delete-id="${trail.id}" data-delete-title="${escapeHTML(trail.title)}">
            ${icons.trash}
            Excluir
          </button>
        </div>
      </footer>
    </article>
  `;
}

async function confirmDelete() {
  if (!state.pendingDeleteId) return;

  const trail = state.trails.find(item => item.id === state.pendingDeleteId);
  $('confirmDeleteButton').disabled = true;

  try {
    const response = await fetch(`http://localhost:8080/trilha/${state.pendingDeleteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao excluir trilha');

    $('deleteDialog').close();
    showToast('Trilha excluída', `“${trail?.title || 'Trilha'}” foi removida do catálogo.`);
    state.pendingDeleteId = null;
    await fetchTrilhas();
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao excluir', 'Não foi possível remover a trilha. Tente novamente.');
  } finally {
    $('confirmDeleteButton').disabled = false;
  }
}

function clearFilters() {
  state.query = '';
  state.category = '';
  state.sort = 'recent';
  $('searchInput').value = '';
  $('categoryFilter').value = '';
  $('sortSelect').value = 'recent';
  render();
  $('searchInput').focus();
}

function showToast(title, message) {
  $('toastTitle').textContent = title;
  $('toastMessage').textContent = message;
  $('toast').classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('is-visible'), 4200);
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function stripHtml(value = '') {
  const template = document.createElement('template');
  template.innerHTML = value;
  return (template.content.textContent || template.innerHTML || value).replace(/\s+/g, ' ').trim();
}

function truncate(value, max = 116) {
  const cleaned = String(value).replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

function moduleNumber(title, fallback) {
  const match = String(title).match(/^(\d+)\s*-/);
  return match ? match[1] : fallback;
}

function moduleTitle(title) {
  return String(title).replace(/^\d+\s*-\s*/, '');
}

function parseStoredUser() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return { nome: storedUser };
  }
}

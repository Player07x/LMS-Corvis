const token = localStorage.getItem('accessToken');
const user = parseStoredUser();

if (!token || !user) {
  window.location.href = '/login';
}

const state = {
  categories: [],
  query: '',
  sort: 'recent',
  pendingDeleteId: null
};

const icons = {
  category: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v4H4zM4 14h16v4H4z"></path><path d="M7 8h.01M7 16h.01"></path></svg>`,
  edit: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M9 7l1-2h4l1 2M6 7l1 13h10l1-13"></path></svg>`
};

const $ = id => document.getElementById(id);

let toastTimer;

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  fetchCategorias();
});

async function fetchCategorias() {
  setLoadingState();

  try {
    const response = await fetch('http://localhost:8080/trilha/categorias', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao buscar categorias');

    const data = await response.json();
    const content = Array.isArray(data) ? data : data.content || [];
    state.categories = content.map(mapCategory);
    setupSummary();
    render();
  } catch (error) {
    console.error('Erro:', error);
    state.categories = [];
    setupSummary();
    $('categoryGrid').innerHTML = '';
    $('resultMessage').innerHTML = '<strong>Erro ao carregar categorias.</strong> Verifique se a API esta online.';
    $('emptyResults').classList.add('is-visible');
  }
}

function mapCategory(categoria) {
  return {
    id: categoria.id,
    title: categoria.nome || 'Categoria sem nome',
    description: categoria.descricao || 'Sem descricao cadastrada.',
    editHref: `/admin/forms/form-categoria.html?id=${categoria.id}`
  };
}

function bindEvents() {
  $('searchInput').addEventListener('input', event => {
    state.query = event.target.value.trim();
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

  $('categoryGrid').addEventListener('click', event => {
    const deleteButton = event.target.closest('[data-delete-id]');
    if (!deleteButton) return;

    state.pendingDeleteId = Number(deleteButton.dataset.deleteId);
    const title = deleteButton.dataset.deleteTitle || 'esta categoria';
    $('deleteText').textContent = `Voce esta prestes a excluir "${title}". Essa acao nao podera ser desfeita.`;
    $('deleteDialog').showModal();
  });

  $('cancelDeleteButton').addEventListener('click', () => $('deleteDialog').close());
  $('confirmDeleteButton').addEventListener('click', confirmDelete);

  $('showNamingTipButton').addEventListener('click', () => {
    showToast('Dica de nomeacao', 'Use nomes que descrevem o assunto, como Programacao, Idiomas ou Ciencia de Dados, e evite nomes genericos.');
  });
}

function setupSummary() {
  $('totalCategories').textContent = state.categories.length;
}

function filteredCategories() {
  const normalized = state.query.toLocaleLowerCase('pt-BR');
  let result = state.categories.filter(category => {
    const haystack = `${category.title} ${category.description}`.toLocaleLowerCase('pt-BR');
    return !normalized || haystack.includes(normalized);
  });

  result = [...result].sort((a, b) => {
    if (state.sort === 'name-asc') return a.title.localeCompare(b.title, 'pt-BR');
    if (state.sort === 'name-desc') return b.title.localeCompare(a.title, 'pt-BR');
    if (state.sort === 'id-asc') return Number(a.id || 0) - Number(b.id || 0);
    if (state.sort === 'id-desc') return Number(b.id || 0) - Number(a.id || 0);
    return state.categories.indexOf(a) - state.categories.indexOf(b);
  });

  return result;
}

function render() {
  const visible = filteredCategories();
  $('categoryGrid').innerHTML = visible.map(categoryCard).join('');
  $('emptyResults').classList.toggle('is-visible', visible.length === 0);

  const term = state.query ? ` para "${escapeHTML(state.query)}"` : '';
  $('resultMessage').innerHTML = `<strong>${visible.length}</strong> ${visible.length === 1 ? 'categoria encontrada' : 'categorias encontradas'}${term}.`;
}

function categoryCard(category) {
  return `
    <article class="category-card">
      <header class="category-card-top">
        <span class="category-icon" aria-hidden="true">${icons.category}</span>
        <span class="category-id">ID ${escapeHTML(category.id)}</span>
      </header>

      <div class="category-card-body">
        <h2>${escapeHTML(category.title)}</h2>
        <p>${escapeHTML(category.description)}</p>
        <div class="category-meta"><span class="dot"></span>Disponivel para novas trilhas</div>
      </div>

      <footer class="category-card-footer">
        <a class="button button-card card-edit" href="${escapeHTML(category.editHref)}">
          ${icons.edit}
          Editar
        </a>
        <button class="button button-card card-delete" type="button" data-delete-id="${escapeHTML(category.id)}" data-delete-title="${escapeHTML(category.title)}">
          ${icons.trash}
          Excluir
        </button>
      </footer>
    </article>
  `;
}

async function confirmDelete() {
  if (!state.pendingDeleteId) return;

  const category = state.categories.find(item => Number(item.id) === state.pendingDeleteId);
  $('confirmDeleteButton').disabled = true;

  try {
    const response = await fetch(`http://localhost:8080/trilha/categorias/${state.pendingDeleteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao excluir categoria');

    $('deleteDialog').close();
    showToast('Categoria excluida', `"${category?.title || 'Categoria'}" foi removida do catalogo.`);
    state.pendingDeleteId = null;
    await fetchCategorias();
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao excluir', 'Nao foi possivel remover a categoria. Tente novamente.');
  } finally {
    $('confirmDeleteButton').disabled = false;
  }
}

function clearFilters() {
  state.query = '';
  state.sort = 'recent';
  $('searchInput').value = '';
  $('sortSelect').value = 'recent';
  render();
  $('searchInput').focus();
}

function setLoadingState() {
  $('categoryGrid').innerHTML = '';
  $('emptyResults').classList.remove('is-visible');
  $('resultMessage').innerHTML = '<strong>Carregando categorias...</strong>';
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

function parseStoredUser() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return { nome: storedUser };
  }
}

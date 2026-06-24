const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const accessToken = localStorage.getItem('accessToken');
const state = {
    currentStep: 1,
    modules: [],
    editingIndex: null
};

const stepMeta = {
    1: {
        eyebrow: 'Etapa 1 de 3',
        title: 'Comece pelos detalhes da trilha',
        description: 'Essas informações ajudam estudantes e professores a encontrar o conteúdo.'
    },
    2: {
        eyebrow: 'Etapa 2 de 3',
        title: 'Defina a recompensa da trilha',
        description: 'A conquista é opcional e celebra a conclusão de toda a jornada.'
    },
    3: {
        eyebrow: 'Etapa 3 de 3',
        title: 'Adicione os módulos e revise',
        description: 'Monte a sequência de estudo e confirme as informações antes de salvar.'
    }
};

function byId(elementId) {
    return document.getElementById(elementId);
}

function getRequiredElement(elementId) {
    const element = byId(elementId);
    if (!element) {
        throw new Error(`Elemento obrigatorio nao encontrado: #${elementId}`);
    }
    return element;
}

function getModuleListElement() {
    return byId('moduleList') || byId('modulosList');
}

const quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Digite o conteúdo do módulo.',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'clean']
        ]
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    await fetchCategorias();

    if (id) {
        document.getElementById('page-title').textContent = 'Editar trilha';
        document.getElementById('submitButtonLabel').textContent = 'Atualizar trilha';
        await fetchTrilha();
    }

    updateSummary();
    displayStep(1);
});

function getValue(elementId) {
    return byId(elementId)?.value?.trim() || '';
}

function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);
}

function textFromHtml(html = '') {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return (wrapper.textContent || '').replace(/\s+/g, ' ').trim();
}

async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Erro na requisição (${response.status})`);
    }

    return response;
}

async function fetchCategorias() {
    const select = document.getElementById('categoria');

    try {
        const response = await apiFetch('http://localhost:8080/trilha/categorias');
        const categorias = await response.json();
        select.innerHTML = '<option value="">Selecione uma categoria</option>';

        (categorias.content || []).forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        select.innerHTML = '<option value="">Não foi possível carregar as categorias</option>';
        showNotice('Erro ao carregar categorias.', true);
    }
}

async function fetchTrilha() {
    try {
        const response = await apiFetch(`http://localhost:8080/trilha/${id}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        const trilha = await response.json();
        const conquista = trilha.conquista || {};

        document.getElementById('nome').value = trilha.nome || '';
        document.getElementById('descricao').value = trilha.descricao || '';
        document.getElementById('categoria').value = trilha.categoria?.id || '';
        document.getElementById('nomeConquista').value = conquista.nome || '';
        document.getElementById('descricaoConquista').value = conquista.descricao || '';
        document.getElementById('xpGanho').value = conquista.xpGanho ?? '';
        document.getElementById('idConquista').value = conquista.id || '';

        state.modules = (trilha.modulos || []).map(modulo => ({
            id: modulo.id,
            titulo: modulo.titulo || '',
            conteudo: modulo.conteudo || '',
            ordem: Number(modulo.ordem),
            conquista: {
                id: modulo.conquista?.id,
                nome: modulo.conquista?.nome || '',
                descricao: modulo.conquista?.descricao || '',
                xpGanho: modulo.conquista?.xpGanho ?? ''
            }
        }));

        renderModules();
        resetModuleBuilder();
        updateSummary();
    } catch (error) {
        console.error('Erro ao carregar trilha:', error);
        showNotice('Não foi possível carregar a trilha para edição.', true);
    }
}

function bindEvents() {
    document.getElementById('formTrilha').addEventListener('submit', enviarFormulario);
    document.getElementById('nextButton').addEventListener('click', goNext);
    document.getElementById('backButton').addEventListener('click', goBack);
    document.getElementById('addModuleButton').addEventListener('click', adicionarModulo);
    document.getElementById('clearModuleButton').addEventListener('click', resetModuleBuilder);
    getModuleListElement()?.addEventListener('click', handleModuleAction);

    document.querySelectorAll('[data-step-target]').forEach(step => {
        step.addEventListener('click', () => {
            const target = Number(step.dataset.stepTarget);
            if (target < state.currentStep) displayStep(target);
        });
    });

    ['nome', 'descricao', 'categoria', 'nomeConquista', 'descricaoConquista', 'xpGanho'].forEach(elementId => {
        const element = document.getElementById(elementId);
        element.addEventListener('input', updateSummary);
        element.addEventListener('change', updateSummary);
    });
}

function displayStep(nextStep) {
    state.currentStep = nextStep;

    document.querySelectorAll('[data-step-panel]').forEach(panel => {
        panel.hidden = Number(panel.dataset.stepPanel) !== nextStep;
    });

    document.querySelectorAll('[data-step-target]').forEach(step => {
        const stepNumber = Number(step.dataset.stepTarget);
        step.classList.toggle('is-active', stepNumber === nextStep);
        step.classList.toggle('is-complete', stepNumber < nextStep);
        step.disabled = stepNumber > nextStep;
        step.toggleAttribute('aria-current', stepNumber === nextStep);
    });

    document.getElementById('stepEyebrow').textContent = stepMeta[nextStep].eyebrow;
    document.getElementById('stepTitle').textContent = stepMeta[nextStep].title;
    document.getElementById('stepDescription').textContent = stepMeta[nextStep].description;
    document.getElementById('backButton').hidden = nextStep === 1;
    document.getElementById('nextButton').hidden = nextStep === 3;
    document.getElementById('submitButton').hidden = nextStep !== 3;
    hideAlert();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goNext() {
    const isValid = state.currentStep === 1 ? validateDetails() : validateTrackAchievement();
    if (!isValid) return;
    displayStep(state.currentStep + 1);
}

function goBack() {
    if (state.currentStep > 1) displayStep(state.currentStep - 1);
}

function clearErrors() {
    document.querySelectorAll('.field.has-error').forEach(field => field.classList.remove('has-error'));
    document.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; });
    hideAlert();
}

function setFieldError(elementId, message) {
    const field = document.querySelector(`[data-field="${elementId}"]`);
    const error = document.getElementById(`${elementId}Error`);
    field?.classList.add('has-error');
    if (error) error.textContent = message;
}

function showAlert(message) {
    document.getElementById('formAlertMessage').textContent = message;
    document.getElementById('formAlert').classList.add('is-visible');
    document.getElementById('formAlert').focus();
}

function hideAlert() {
    document.getElementById('formAlert').classList.remove('is-visible');
}

function validateDetails() {
    clearErrors();
    let isValid = true;

    if (!getValue('nome')) {
        setFieldError('nome', 'Informe o nome da trilha.');
        isValid = false;
    }
    if (!getValue('descricao')) {
        setFieldError('descricao', 'Informe a descrição da trilha.');
        isValid = false;
    }
    if (!getValue('categoria')) {
        setFieldError('categoria', 'Selecione uma categoria.');
        isValid = false;
    }
    if (!isValid) showAlert('Complete os campos obrigatórios para continuar.');
    return isValid;
}

function validateOptionalAchievement(ids) {
    const hasAnyValue = ids.some(elementId => getValue(elementId) !== '');
    if (!hasAnyValue) return true;

    let isValid = true;
    const messages = ['Informe o nome da conquista.', 'Informe a descrição da conquista.', 'Informe o XP ganho.'];

    ids.forEach((elementId, index) => {
        if (getValue(elementId) === '') {
            setFieldError(elementId, messages[index]);
            isValid = false;
        }
    });

    return isValid;
}

function validateTrackAchievement() {
    clearErrors();
    const isValid = validateOptionalAchievement(['nomeConquista', 'descricaoConquista', 'xpGanho']);
    if (!isValid) showAlert('Preencha todos os campos da conquista ou deixe todos vazios.');
    return isValid;
}

function validateModule() {
    clearErrors();
    let isValid = true;
    const ordem = Number(getValue('ordemModulo'));
    const titulo = getValue('nomeModulo');
    const conteudo = quill.root.innerHTML;

    if (!Number.isInteger(ordem) || ordem < 1) {
        setFieldError('ordemModulo', 'Informe uma ordem válida.');
        isValid = false;
    }
    if (!titulo) {
        setFieldError('nomeModulo', 'Informe o nome do módulo.');
        isValid = false;
    }
    if (!textFromHtml(conteudo)) {
        setFieldError('conteudoModulo', 'Adicione o conteúdo do módulo.');
        isValid = false;
    }

    const repeatedOrder = state.modules.some((module, index) =>
        module.ordem === ordem && index !== state.editingIndex
    );
    if (repeatedOrder) {
        setFieldError('ordemModulo', 'Já existe um módulo com esta ordem.');
        isValid = false;
    }

    if (!validateOptionalAchievement([
        'nomeConquistaModulo',
        'descricaoConquistaModulo',
        'xpGanhoModulo'
    ])) {
        isValid = false;
    }

    if (!isValid) showAlert('Revise as informações do módulo antes de adicioná-lo.');
    return isValid;
}

function adicionarModulo() {
    if (!validateModule()) return;

    const existingModule = state.editingIndex === null ? {} : state.modules[state.editingIndex];
    const module = {
        id: existingModule.id,
        titulo: getValue('nomeModulo'),
        conteudo: quill.root.innerHTML,
        ordem: Number(getValue('ordemModulo')),
        conquista: {
            id: existingModule.conquista?.id,
            nome: getValue('nomeConquistaModulo'),
            descricao: getValue('descricaoConquistaModulo'),
            xpGanho: getValue('xpGanhoModulo')
        }
    };

    const wasEditing = state.editingIndex !== null;
    if (wasEditing) state.modules[state.editingIndex] = module;
    else state.modules.push(module);

    renderModules();
    resetModuleBuilder();
    showNotice(wasEditing ? 'Módulo atualizado.' : 'Módulo adicionado.');
}

function resetModuleBuilder() {
    state.editingIndex = null;
    const nextOrder = state.modules.length
        ? Math.max(...state.modules.map(module => module.ordem)) + 1
        : 1;

    document.getElementById('ordemModulo').value = nextOrder;
    document.getElementById('nomeModulo').value = '';
    document.getElementById('conteudoModulo').value = '';
    document.getElementById('nomeConquistaModulo').value = '';
    document.getElementById('descricaoConquistaModulo').value = '';
    document.getElementById('xpGanhoModulo').value = '';
    document.getElementById('moduleAchievementDetails').open = false;
    document.getElementById('addModuleButtonLabel').textContent = 'Adicionar módulo';
    quill.setContents([]);
    clearErrors();
}

function handleModuleAction(event) {
    const editButton = event.target.closest('[data-edit-module]');
    const removeButton = event.target.closest('[data-remove-module]');

    if (editButton) editarModulo(Number(editButton.dataset.editModule));
    if (removeButton) removerModulo(Number(removeButton.dataset.removeModule));
}

function editarModulo(index) {
    const module = state.modules[index];
    if (!module) return;

    state.editingIndex = index;
    document.getElementById('ordemModulo').value = module.ordem;
    document.getElementById('nomeModulo').value = module.titulo;
    document.getElementById('conteudoModulo').value = module.conteudo;
    document.getElementById('nomeConquistaModulo').value = module.conquista?.nome || '';
    document.getElementById('descricaoConquistaModulo').value = module.conquista?.descricao || '';
    document.getElementById('xpGanhoModulo').value = module.conquista?.xpGanho ?? '';
    document.getElementById('moduleAchievementDetails').open = Boolean(
        module.conquista?.nome || module.conquista?.descricao || module.conquista?.xpGanho !== ''
    );
    document.getElementById('addModuleButtonLabel').textContent = 'Atualizar módulo';
    quill.root.innerHTML = module.conteudo;
    document.querySelector('.module-builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function removerModulo(index) {
    state.modules.splice(index, 1);
    if (state.editingIndex === index) resetModuleBuilder();
    else state.editingIndex = null;
    renderModules();
    showNotice('Módulo removido.');
}

function renderModules() {
    state.modules.sort((first, second) => first.ordem - second.ordem);
    const list = getModuleListElement();
    const empty = document.getElementById('moduleEmpty');
    const count = state.modules.length;

    document.getElementById('modulesCounter').textContent =
        `${count} ${count === 1 ? 'módulo adicionado' : 'módulos adicionados'}`;
    if (empty) empty.hidden = count > 0;

    if (!list) {
        console.error('Elemento da lista de modulos nao encontrado. Esperado #moduleList.');
        return;
    }

    list.innerHTML = state.modules.map((module, index) => {
        const achievement = module.conquista?.nome
            ? ` · Conquista: ${escapeHtml(module.conquista.nome)}`
            : '';

        return `
            <article class="module-item">
                <span class="order-badge">${module.ordem}</span>
                <div class="module-copy">
                    <h4>${escapeHtml(module.titulo)}</h4>
                    <p>${escapeHtml(textFromHtml(module.conteudo))}${achievement}</p>
                </div>
                <div class="module-item-actions">
                    <button class="mini-button" type="button" data-edit-module="${index}" aria-label="Editar ${escapeHtml(module.titulo)}">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="mini-button danger" type="button" data-remove-module="${index}" aria-label="Remover ${escapeHtml(module.titulo)}">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M9 7l1-2h4l1 2M6 7l1 13h10l1-13"></path></svg>
                    </button>
                </div>
            </article>
        `;
    }).join('');

    updateSummary();
}

function updateSummary() {
    const category = document.getElementById('categoria');
    const categoryName = category.selectedOptions[0]?.textContent;
    const achievementName = getValue('nomeConquista');
    const achievementXp = getValue('xpGanho');

    document.getElementById('summaryName').textContent =
        getValue('nome') || 'Ainda não informado';
    document.getElementById('summaryCategory').textContent =
        getValue('categoria') ? categoryName : 'Ainda não selecionada';
    document.getElementById('summaryAchievement').textContent =
        achievementName
            ? `${achievementName}${achievementXp !== '' ? ` · ${achievementXp} XP` : ''}`
            : 'Nenhuma conquista configurada';

    const summaryEmpty = document.getElementById('summaryModulesEmpty');
    summaryEmpty.hidden = state.modules.length > 0;
    document.getElementById('summaryModules').innerHTML = state.modules
        .map(module => `<li>${module.ordem}. ${escapeHtml(module.titulo)}</li>`)
        .join('');
}

async function enviarFormulario(event) {
    event.preventDefault();

    if (!validateDetails()) {
        displayStep(1);
        return;
    }
    if (!validateTrackAchievement()) {
        displayStep(2);
        return;
    }
    if (state.modules.length === 0) {
        displayStep(3);
        showAlert('Adicione pelo menos um módulo antes de salvar a trilha.');
        return;
    }

    const conquista = {
        nome: getValue('nomeConquista'),
        descricao: getValue('descricaoConquista'),
        xpGanho: getValue('xpGanho')
    };
    const conquistaId = getValue('idConquista');
    if (conquistaId) conquista.id = conquistaId;

    const dados = {
        nome: getValue('nome'),
        descricao: getValue('descricao'),
        categoria: { id: getValue('categoria') },
        conquista,
        modulos: state.modules
    };

    let url = 'http://localhost:8080/trilha';
    let method = 'POST';
    if (id) {
        url += `/${id}`;
        method = 'PUT';
        dados.id = id;
    }

    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = true;

    try {
        await apiFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        showNotice(id ? 'Trilha atualizada com sucesso.' : 'Trilha cadastrada com sucesso.');
        window.setTimeout(() => {
            window.location.href = '/admin/lista-trilhas.html';
        }, 900);
    } catch (error) {
        console.error('Erro ao salvar trilha:', error);
        showNotice('Erro ao salvar trilha. Revise os dados e tente novamente.', true);
        submitButton.disabled = false;
    }
}

function showNotice(message, isError = false) {
    const notice = document.getElementById('cadastrada');
    notice.textContent = message;
    notice.classList.toggle('is-error', isError);
    notice.classList.add('is-visible');
    window.clearTimeout(showNotice.timeout);
    showNotice.timeout = window.setTimeout(() => notice.classList.remove('is-visible'), 4200);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTrilhas();
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
        const listElement = document.getElementById('trilhas-list');

        trilhas.content.forEach(trilha => {
            const card = document.createElement('div');
            card.className = "bg-white shadow-lg rounded-xl p-6 flex flex-col gap-4 border border-gray-200";

            card.innerHTML = `
              <div class="flex justify-between items-center">
                <div>
                  <h2 class="text-xl font-bold text-gray-800">${trilha.nome}</h2>
                  <p class="text-sm text-gray-600">${trilha.descricao}</p>
                  <p class="text-xs mt-1 text-gray-400">Categoria: ${trilha.categoria.nome}</p>
                </div>
              </div>

              <!-- Módulos com altura fixa e rolagem -->
              <div class="mt-4 space-y-2 max-h-48 min-h-48 overflow-y-auto pr-2">
                ${trilha.modulos.map(modulo => `
                  <div class="border-l-4 border-green-500 pl-3">
                    <h3 class="text-sm font-medium text-gray-700">${modulo.ordem} - ${modulo.titulo}</h3>
                    <div class="text-xs text-gray-600">${modulo.conteudo}</div>
                  </div>
                `).join('')}
              </div>

              <div class="flex justify-end gap-4 mt-6">
                <a href="forms/form-trilha.html?id=${trilha.id}" class="text-indigo-600 hover:text-indigo-900 font-medium text-sm">
                  Editar
                </a>
                <a href="javascript:removerTrilha(${trilha.id})" class="text-red-600 hover:text-red-900 font-medium text-sm">
                  Excluir
                </a>
              </div>
            `;
            listElement.appendChild(card);
        });

    } catch (error) {
        console.error('Erro:', error);
    }
}

function removerTrilha(id) {
    if (confirm('Tem certeza que deseja excluir esta trilha?')) {
        fetch(`http://localhost:8080/trilha/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Erro ao excluir trilha');
                alert('Trilha excluída com sucesso!');
                location.reload();
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao excluir trilha.');
            });
    }
}
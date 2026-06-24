const token = localStorage.getItem('accessToken');

if (!token) {
    window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', () => {
    fetchConquistas();
});

async function fetchConquistas() {
    try {
        const response = await fetch('http://localhost:8080/trilha/conquistas', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erro ao buscar conquistas');

        const conquistas = await response.json();
        const listElement = document.getElementById('conquistas-list');

        conquistas.content.forEach(conquista => {
            const card = document.createElement('div');
            card.className = "bg-white shadow-lg rounded-xl p-4 flex items-start gap-4 border border-gray-200";
            const tipoCor =
                conquista.tipo === "MODULO"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-orange-100 text-orange-800";
            card.innerHTML = `
                            <!-- Ícone à esquerda -->
                            <div class="flex-shrink-0">
                                <svg class="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            <!-- Conteúdo textual -->
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-gray-800">${conquista.nome}</h3>
                                <p class="text-sm text-gray-600 mt-1">${conquista.descricao}</p>
                                
                                <div class="mt-2 text-sm text-gray-500 flex gap-4 flex-wrap">
                                    <span class="${tipoCor} px-2 py-0.5 rounded-full text-xs font-medium">
                                        Tipo: ${conquista.tipo}
                                    </span>
                                    <span class="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                        XP: ${conquista.xpGanho}
                                    </span>
                                    <span class="text-gray-400 text-xs">ID: ${conquista.id}</span>
                                </div>
                            </div>
                        `;
            listElement.appendChild(card);
        });
    } catch (error) {
        console.error('Erro:', error);
    }
}

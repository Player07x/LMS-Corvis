const token = localStorage.getItem('accessToken');

if (!token) {
    window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', () => {
    fetchUsuarios();
});

async function fetchUsuarios() {
    try {
        fetch('http://localhost:8080/usuario/aluno', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Erro ao buscar usuários');
                return response.json();
            })
            .then(usuarios => {
                const listElement = document.getElementById('usuarios-list');
                usuarios.content.forEach(usuario => {
                    const card = document.createElement('div');
                    card.className = "bg-white shadow-lg rounded-xl p-6 flex flex-col gap-4 border border-gray-200 cursor-pointer hover:shadow-xl transition-shadow";
                    card.innerHTML = `
                        <h3 class="text-lg font-bold text-gray-900">${usuario.nome}</h3>
                        <p class="text-gray-700 text-sm">Email: ${usuario.email}</p>
                        <div class="flex items-center text-sm text-green-600 mt-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Ver mais detalhes
                        </div>
                    `;

                    card.addEventListener('click', () => {
                        openDrawer(usuario);
                    });

                    listElement.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Erro:', error);
            });
    } catch (error) {
        console.error('Erro:', error);
    }
}

function openDrawer(usuario) {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawer-overlay');
    const content = document.getElementById('drawer-content');

    // Preenche conteúdo
    content.innerHTML = `
        <p><strong>Nome:</strong> ${usuario.nome}</p>
        <p><strong>Email:</strong> ${usuario.email}</p>
        <p><strong>ID:</strong> ${usuario.id}</p>
        <p><strong>Tipo:</strong> ${usuario.role || 'Aluno'}</p>
        <!-- Adicione mais campos conforme necessário -->
    `;

    drawer.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
}

function closeDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawer-overlay');

    drawer.classList.add('translate-x-full');
    overlay.classList.add('hidden');
}

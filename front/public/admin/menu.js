const user = localStorage.getItem('user');
const token = localStorage.getItem('accessToken');

document.addEventListener("DOMContentLoaded", function() {
  if (!localStorage.getItem('user')) {
    window.location.href = '/login';
  }


  fetch('/admin/menu.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('menu-container').innerHTML = data;
    document.getElementById('btnLogout').addEventListener('click', function() {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    });
  })
  .catch(error => console.error('Erro ao carregar o menu:', error))
  .finally(() => setActiveMenu());
});

function setActiveMenu() {
  const itemsMenu = document.querySelectorAll(".menu");
  const currentPath = window.location.pathname;

  itemsMenu.forEach(item => {
    if (item.getAttribute('href') === currentPath){
      item.setAttribute('aria-current', 'page');
      item.classList.add('bg-green-600', 'text-white');
      item.classList.remove('text-gray-300', 'hover:bg-gray-700');
    } else {
      item.removeAttribute('aria-current');
      item.classList.remove('bg-green-600', 'text-white');
      item.classList.add('text-gray-300', 'hover:bg-gray-700');
    }
  });
}
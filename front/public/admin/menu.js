const token = localStorage.getItem('accessToken');

document.addEventListener("DOMContentLoaded", function() {
  if (!localStorage.getItem('user')) {
    window.location.href = '/login';
  }


  fetch('/admin/menu.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('menu-container').innerHTML = data;
    document.querySelectorAll('.btn-logout').forEach(button => {
      button.addEventListener('click', function(event) {
        event.preventDefault();
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      });
    });

    const toggle = document.getElementById('adminNavToggle');
    const mobileNav = document.getElementById('adminMobileNav');
    toggle?.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    setActiveMenu();
  })
  .catch(error => console.error('Erro ao carregar o menu:', error))
});

function setActiveMenu() {
  const itemsMenu = document.querySelectorAll(".menu");
  const currentPath = window.location.pathname;

  itemsMenu.forEach(item => {
    if (item.getAttribute('href') === currentPath){
      item.setAttribute('aria-current', 'page');
      item.classList.add('is-active');
    } else {
      item.removeAttribute('aria-current');
      item.classList.remove('is-active');
    }
  });
}

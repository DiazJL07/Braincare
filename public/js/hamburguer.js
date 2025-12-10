function openNav() {
    const panel = document.getElementById("Panelslidee");
    if (panel) {
        panel.style.width = "250px";
        document.body.style.overflow = "hidden";
    }
}

function closeNav() {
    const panel = document.getElementById("Panelslidee");
    if (panel) {
        panel.style.width = "0";
        document.body.style.overflow = "auto";
        
        // Cerrar todos los submenús abiertos
        document.querySelectorAll('.submenu-hamburguer').forEach(menu => {
            menu.classList.remove('active');
            const parentItem = menu.previousElementSibling;
            if (parentItem && parentItem.classList.contains('has-submenu')) {
                parentItem.classList.remove('active');
            }
        });
    }
}

function toggleSubmenu(event) {
    // Solo prevenir el comportamiento por defecto si es un elemento que no tiene href válido
    if (event.target.tagName === 'A' && (!event.target.href || event.target.href === '#')) {
        event.preventDefault();
    }
    
    const parentItem = event.currentTarget;
    const submenu = parentItem.nextElementSibling;
    
    if (!submenu || !submenu.classList.contains('submenu-hamburguer')) return;
    
    // Cerrar otros submenús
    document.querySelectorAll('.submenu-hamburguer').forEach(menu => {
        if (menu !== submenu) {
            menu.classList.remove('active');
            const siblingItem = menu.previousElementSibling;
            if (siblingItem && siblingItem.classList.contains('has-submenu')) {
                siblingItem.classList.remove('active');
            }
        }
    });
    
    // Alternar el submenú actual
    parentItem.classList.toggle('active');
    submenu.classList.toggle('active');
}

// Listener para submenús
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.has-submenu').forEach(item => {
        item.addEventListener('click', toggleSubmenu);
    });
});
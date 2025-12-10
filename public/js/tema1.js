function verTema(temaId) {
    // Ocultar la sección de temas
    document.querySelectorAll('.seccion').forEach(seccion => {
        seccion.classList.add('hidden');
    });

    // Redirigir a la página del tema seleccionado
    switch (temaId) {
        case 'coso1':
            window.location.href = 'estasi.php';  // Nueva página con la historia del tema
            break;
        case 'tema2':
            window.location.href = 'tema1.php';  // Nueva página con la historia del tema
            break;
        case 'tema3':
            window.location.href = 'tema3.html';  // Nueva página con la historia del tema
            break;
        default:
            alert('Tema no disponible');
    }
}

function añadirComentario() {
    const nuevoComentario = document.getElementById('nuevoComentario').value;
    if (nuevoComentario.trim() !== '') {
        const listaComentarios = document.getElementById('listaComentarios');
        const li = document.createElement('li');
        li.textContent = nuevoComentario;
        listaComentarios.appendChild(li);
        document.getElementById('nuevoComentario').value = '';
    }
}

function volverAlForo() {
    document.getElementById('temaDetalle').classList.add('hidden');
    document.querySelectorAll('.seccion').forEach(seccion => {
        seccion.classList.remove('hidden');
    });
}

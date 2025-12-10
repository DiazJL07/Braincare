document.addEventListener('DOMContentLoaded', function() {
    // Botones para mostrar/ocultar formulario de respuesta
    const replyButtons = document.querySelectorAll('.reply-btn');
    const cancelReplyButtons = document.querySelectorAll('.cancel-reply-btn');
    
    // Botones para mostrar/ocultar formulario de edición
    const editButtons = document.querySelectorAll('.edit-comment-btn');
    const cancelEditButtons = document.querySelectorAll('.cancel-edit-btn');
    
    // Botones para dar like a posts y comentarios
    const likePostButtons = document.querySelectorAll('.like-btn');
    const likeCommentButtons = document.querySelectorAll('.like-comment-btn');
    
    // Botones de reporte y modal
    const reportButtons = document.querySelectorAll('.report-btn');
    const reportModalElement = document.getElementById('reportModal');
    const reportModal = (reportModalElement && window.bootstrap) ? new bootstrap.Modal(reportModalElement) : null;
    const reportForm = document.getElementById('reportForm');
    let currentReportData = {};
    
    const reportsEnabled = !!(reportModalElement && reportForm && window.bootstrap);
    
    likePostButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const postId = this.getAttribute('data-post-id');
            this.disabled = true;
            try {
                const response = await fetch(`/foro/${postId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });
                const data = await response.json();
                if (response.ok) {
                    const likesCount = this.querySelector('.likes-count') || this.querySelector('.like-count');
                    if (likesCount) {
                        likesCount.textContent = data.likes;
                    }
                    if (data.liked) {
                        this.classList.remove('btn-outline-danger');
                        this.classList.add('btn-danger');
                        this.classList.add('liked');
                    } else {
                        this.classList.remove('btn-danger');
                        this.classList.add('btn-outline-danger');
                        this.classList.remove('liked');
                    }
                } else {
                    if (response.status === 401) {
                        console.warn('Debes iniciar sesión para dar me gusta');
                    } else if (!window.handleFetchError || !window.handleFetchError(response, data)) {
                        console.error('Error al dar like al post');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                this.disabled = false;
            }
        });
    });
    

    
    // Manejar click en botones de respuesta
    replyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.getAttribute('data-comment-id');
            const replyForm = document.getElementById(`reply-form-${commentId}`);
            
            // Ocultar todos los formularios de respuesta primero
            document.querySelectorAll('.reply-form').forEach(form => {
                form.style.display = 'none';
            });
            
            // Mostrar el formulario de respuesta para este comentario
            replyForm.style.display = 'block';
        });
    });
    
    // Manejar click en botones de cancelar respuesta
    cancelReplyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const replyForm = this.closest('.reply-form');
            replyForm.style.display = 'none';
        });
    });
    
    // Manejar click en botones de edición
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.getAttribute('data-comment-id');
            const editForm = document.getElementById(`edit-form-${commentId}`);
            
            // Ocultar todos los formularios de edición primero
            document.querySelectorAll('.edit-form').forEach(form => {
                form.style.display = 'none';
            });
            
            // Mostrar el formulario de edición para este comentario
            editForm.style.display = 'block';
        });
    });
    
    // Manejar click en botones de cancelar edición
    cancelEditButtons.forEach(button => {
        button.addEventListener('click', function() {
            const editForm = this.closest('.edit-form');
            editForm.style.display = 'none';
        });
    });
    
    // Manejar envío de formularios de respuesta
    const replyForms = document.querySelectorAll('.reply-comment-form');
    replyForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            console.log('=== FORMULARIO DE RESPUESTA ENVIADO ===');
            console.log('Formulario:', this);
            
            const formData = new FormData(this);
            const postId = formData.get('postId');
            const parentCommentId = formData.get('parentCommentId');
            const content = formData.get('content');
            
            console.log('Datos extraídos del formulario:');
            console.log('postId:', postId);
            console.log('parentCommentId:', parentCommentId);
            console.log('content:', content);
            console.log('content length:', content ? content.length : 'undefined');
            
            if (!content || !content.trim()) {
                return;
            }
            
            try {
                const response = await fetch(`/foro/${postId}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        content: content.trim(),
                        parentCommentId: parentCommentId || null
                    })
                });
                
                const data = await response.json();
                if (response.ok) {
                    // Limpiar el formulario
                    this.reset();
                    // Ocultar el formulario
                    this.closest('.reply-form').style.display = 'none';
                    
                    // Mostrar mensaje de éxito
                    console.log('Respuesta enviada exitosamente');
                    
                    // Recargar la página para mostrar la nueva respuesta
                    setTimeout(() => {
                        window.location.reload();
                    }, 300);
                } else {
                    if (response.status === 401) {
                        console.warn('Debes iniciar sesión para responder');
                    } else {
                        console.error('Error al enviar respuesta');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });
    
    // Manejar envío de formularios de edición
    const editForms = document.querySelectorAll('.edit-comment-form');
    editForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const content = formData.get('content');
            const commentId = this.getAttribute('data-comment-id');
            const foroId = this.action.split('/')[2]; // Extraer foroId de la URL
            
            if (!content || !content.trim()) {
                return;
            }
            
            try {
                const response = await fetch(`/foro/comments/${commentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        content: content.trim()
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Actualizar el contenido del comentario dinámicamente
                    const commentContainer = this.closest('.modern-comment, .reply-item');
                    const commentContentDiv = commentContainer.querySelector('.comment-content-modern p');
                    
                    if (commentContentDiv) {
                        commentContentDiv.textContent = content.trim();
                    }
                    // Marcar como editado en la meta
                    const meta = commentContainer.querySelector('.comment-meta');
                    if (meta && !meta.querySelector('.comment-edited')) {
                        const sep = document.createElement('span');
                        sep.className = 'mx-2';
                        sep.textContent = '•';
                        const edited = document.createElement('span');
                        edited.className = 'comment-edited';
                        edited.innerHTML = '<i class="fas fa-edit"></i> Editado';
                        meta.appendChild(sep);
                        meta.appendChild(edited);
                    }
                    
                    // Limpiar cualquier alerta o toast residual
                    ['.alert', '.foro-toast', '.alert-pastel-danger'].forEach(sel => {
                        document.querySelectorAll(sel).forEach(el => { try { el.remove(); } catch(e){} });
                    });
                    const alertContainerTop = document.getElementById('alertContainer');
                    if (alertContainerTop) { try { alertContainerTop.innerHTML = ''; } catch(e){} }

                    // Reintentar limpieza por unos segundos por si alguna alerta entra tarde
                    (function(){
                      const start = Date.now();
                      const timer = setInterval(()=>{
                        ['.alert', '.foro-toast', '.alert-pastel-danger'].forEach(sel => {
                          document.querySelectorAll(sel).forEach(el => { try { el.remove(); } catch(e){} });
                        });
                        if (Date.now() - start > 3000) clearInterval(timer);
                      }, 200);
                    })();

                    // Señal para suprimir alertas danger que aparezcan tarde (una sola vez)
                    try { localStorage.setItem('suppressDangerOnce', '1'); } catch(e){}
                    
                    // Señalar edición exitosa y ocultar el formulario
                    try { window.lastEditSuccessTime = Date.now(); } catch(e){}
                    this.closest('.edit-form').style.display = 'none';
                    
                    // No mostrar alertas; el estado "Editado" ya es visible en la meta
                    
                } else {
                    if (response.status === 401) {
                        console.warn('Debes iniciar sesión para editar');
                    } else {
                        console.error('Error al editar comentario');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });
    
    // Manejar click en botones de like para comentarios
    likeCommentButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const commentId = this.getAttribute('data-comment-id');
            try {
                const response = await fetch(`/foro/comments/${commentId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Actualizar el contador de likes (buscar ambas clases posibles)
                    const likesCount = this.querySelector('.likes-count') || this.querySelector('.like-count');
                    if (likesCount) {
                        likesCount.textContent = data.likes;
                    }
                    
                    // Cambiar el estilo del botón de like
                    if (data.liked) {
                        this.classList.remove('btn-outline-danger');
                        this.classList.add('btn-danger');
                        this.classList.add('liked');
                    } else {
                        this.classList.remove('btn-danger');
                        this.classList.add('btn-outline-danger');
                        this.classList.remove('liked');
                    }
                } else {
                    if (response.status === 401) {
                        console.warn('Debes iniciar sesión para dar me gusta');
                    } else if (!window.handleFetchError(response, data)) {
                        console.error('Error al dar like al comentario');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });

    // Observador para suprimir 'alert-danger' inmediatamente después de una edición exitosa
    try {
        const suppressFlag = localStorage.getItem('suppressDangerOnce');
        if (suppressFlag) {
            const start = Date.now();
            const observer = new MutationObserver(() => {
                document.querySelectorAll('.alert.alert-danger').forEach(el => { try { el.remove(); } catch(e){} });
                if (Date.now() - start > 3000) {
                    observer.disconnect();
                    localStorage.removeItem('suppressDangerOnce');
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    } catch(e){}


    
    // Manejar click en botones de reporte
    if (reportsEnabled) {
        reportButtons.forEach(button => {
            button.addEventListener('click', function() {
                const contentType = this.getAttribute('data-content-type');
                const contentId = this.getAttribute('data-comment-id') || this.getAttribute('data-post-id');
                currentReportData = { contentType, contentId };
                reportForm.reset();
                reportModal.show();
            });
        });
    }
    
    // Manejar el evento de cerrar el modal de reporte
    if (reportsEnabled) reportModalElement.addEventListener('hidden.bs.modal', function() {
        // Limpiar datos del reporte actual cuando se cierra el modal
        currentReportData = {};
        
        // Limpiar formulario
        reportForm.reset();
        
        // Remover cualquier estado de error o validación
        const formElements = reportForm.querySelectorAll('.is-invalid');
        formElements.forEach(element => {
            element.classList.remove('is-invalid');
        });
        
        console.log('Modal de reporte cerrado y datos limpiados');
    });
    
    // Agregar event listener específico para el botón de cerrar
    if (reportsEnabled) {
        const closeButtons = reportModalElement.querySelectorAll('[data-bs-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                reportModal.hide();
            });
        });
    }
    
    // Manejar el evento de mostrar el modal para debugging
    if (reportsEnabled) {
        reportModalElement.addEventListener('show.bs.modal', function() {});
        reportModalElement.addEventListener('hide.bs.modal', function() {});
    }
    
    // Manejar envío del formulario de reporte
    if (reportsEnabled) reportForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const reason = formData.get('reason');
        const description = formData.get('description');
        const submitBtn = reportForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...'; }
        
        if (!reason) {
            alert('Por favor selecciona una razón para el reporte.');
            return;
        }
        
        try {
            const endpoint = currentReportData.contentType === 'foro' 
                ? `/reports/foro/${currentReportData.contentId}`
                : `/reports/comment/${currentReportData.contentId}`;
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    reason: reason,
                    description: description
                })
            });
            
            const ct = response.headers.get('content-type') || '';
            let data;
            if (ct.includes('application/json')) {
                try { data = await response.json(); } catch (_) { data = { message: 'Respuesta no válida del servidor' }; }
            } else {
                // Manejar posibles redirecciones a login u HTML
                if (response.redirected || (response.url && response.url.includes('/auth/login'))) {
                    showAlert('danger', 'Debes iniciar sesión para enviar reportes. Redirigiendo...');
                    setTimeout(() => { window.location.href = '/auth/login'; }, 1200);
                    return;
                }
                const text = await response.text();
                data = { message: text && text.length < 200 ? text : 'Error al enviar el reporte' };
            }
            
            if (response.ok) {
                // Deshabilitar botón de reporte para este contenido
                const reportButton = document.querySelector(`[data-${currentReportData.contentType === 'foro' ? 'post' : 'comment'}-id="${currentReportData.contentId}"][data-content-type="${currentReportData.contentType}"]`);
                if (reportButton) {
                    reportButton.disabled = true;
                    reportButton.innerHTML = '<i class="fas fa-check"></i> Reportado';
                    reportButton.classList.remove('btn-outline-warning');
                    reportButton.classList.add('btn-secondary');
                }
                
                setTimeout(() => { reportModal.hide(); }, 800);
            } else {
                // Verificar si es un error de baneo
                if (!window.handleFetchError || !window.handleFetchError(response, data)) {
                    showAlert('danger', data.message || 'Error al enviar el reporte');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Error al enviar el reporte');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-flag"></i> Enviar Reporte'; }
        }
    });

    // Eliminar comentarios y respuestas
    const deleteCommentModalEl = document.getElementById('deleteCommentModal');
    const deleteCommentModal = (deleteCommentModalEl && window.bootstrap) ? new bootstrap.Modal(deleteCommentModalEl) : null;
    let currentDeleteCommentId = null;
    document.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentDeleteCommentId = this.getAttribute('data-comment-id');
            if (deleteCommentModal) deleteCommentModal.show();
        });
    });
    const confirmDeleteCommentBtn = document.getElementById('confirmDeleteCommentBtn');
    if (confirmDeleteCommentBtn) {
        confirmDeleteCommentBtn.addEventListener('click', async function() {
            if (!currentDeleteCommentId) return;
            try {
                const response = await fetch(`/foro/comments/${currentDeleteCommentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });
                const data = await response.json();
                if (response.ok && data && data.success) {
                    const container = document.getElementById(`comment-${currentDeleteCommentId}`) || document.getElementById(`reply-${currentDeleteCommentId}`) || document.querySelector(`[data-comment-id="${currentDeleteCommentId}"]`)?.closest('.modern-comment, .reply-item, .nx-comment-node');
                    if (container) container.remove();
                }
            } catch (err) {
                console.error('Error al eliminar comentario:', err);
            } finally {
                if (deleteCommentModal) deleteCommentModal.hide();
                currentDeleteCommentId = null;
            }
        });
    }
    
    // Función para mostrar alertas
    function showAlert(type, message) {
        try {
            const suppressFlag = localStorage.getItem('suppressDangerOnce');
            const recentEdit = window.lastEditSuccessTime && (Date.now() - window.lastEditSuccessTime < 4000);
            if (type === 'danger' && (suppressFlag || recentEdit)) {
                return;
            }
        } catch(e){}
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Buscar el contenedor de alertas específico primero
        let alertContainer = document.querySelector('#alertContainer .col-12');
        
        // Si no existe, buscar el contenido principal
        if (!alertContainer) {
            alertContainer = document.querySelector('.row .col-12, .row .col-lg-8, .container-fluid, .container');
        }
        
        if (alertContainer) {
            alertContainer.insertBefore(alertDiv, alertContainer.firstChild);
            
            // Auto-remover después de 5 segundos
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }

    // Función para manejar respuestas de baneo
    function handleBanResponse(banData) {
        // Si tenemos el contenido HTML completo del baneo, usarlo
        if (banData.banContent) {
            // Crear un modal personalizado con el contenido completo
            showFullBanModal(banData.banContent);
        } else {
            // Fallback al modal simple original
            const banModal = new bootstrap.Modal(document.getElementById('banModal'));
            const banDetails = document.getElementById('banDetails');
            
            // Formatear fecha de baneo
            const banDate = new Date(banData.banDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let banContent = `
                <div class="alert alert-danger">
                    <strong>Motivo:</strong> ${banData.banReason || 'No especificado'}
                </div>
                <p><strong>Fecha de suspensión:</strong> ${banDate}</p>
            `;
            
            // Agregar información de expiración si es un baneo temporal
            if (banData.banExpiresAt) {
                const expirationDate = new Date(banData.banExpiresAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                banContent += `
                    <div class="alert alert-warning">
                        <strong>Tipo:</strong> Suspensión temporal<br>
                        <strong>Expira el:</strong> ${expirationDate}
                    </div>
                `;
            } else {
                banContent += `
                    <div class="alert alert-danger">
                        <strong>Tipo:</strong> Suspensión permanente
                    </div>
                `;
            }
            
            if (banData.bannedBy) {
                banContent += `<p><strong>Suspendido por:</strong> ${banData.bannedBy}</p>`;
            }
            
            banDetails.innerHTML = banContent;
            banModal.show();
        }
    }
    
    function showFullBanModal(banContent) {
        // Crear el modal personalizado
        const modalHtml = `
            <div class="modal fade" id="fullBanModal" tabindex="-1" aria-labelledby="fullBanModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-body p-0">
                            <style>
                                .banned-container {
                                    background: white;
                                    border-radius: 20px;
                                    padding: 3rem;
                                    text-align: center;
                                    position: relative;
                                    overflow: hidden;
                                }
                                
                                .banned-container::before {
                                    content: '';
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    height: 5px;
                                    background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
                                }
                                
                                .banned-icon {
                                    font-size: 4rem;
                                    color: #e74c3c;
                                    margin-bottom: 1.5rem;
                                    animation: pulse 2s infinite;
                                }
                                
                                @keyframes pulse {
                                    0% { transform: scale(1); }
                                    50% { transform: scale(1.1); }
                                    100% { transform: scale(1); }
                                }
                                
                                .banned-title {
                                    color: #2c3e50;
                                    font-weight: 700;
                                    margin-bottom: 1rem;
                                    font-size: 2.5rem;
                                }
                                
                                .banned-subtitle {
                                    color: #7f8c8d;
                                    font-size: 1.2rem;
                                    margin-bottom: 2rem;
                                }
                                
                                .ban-info {
                                    background: #f8f9fa;
                                    border-radius: 15px;
                                    padding: 2rem;
                                    margin: 2rem 0;
                                    border-left: 5px solid #e74c3c;
                                }
                                
                                .ban-detail {
                                    margin-bottom: 1rem;
                                    text-align: left;
                                }
                                
                                .ban-detail strong {
                                    color: #2c3e50;
                                    display: inline-block;
                                    width: 120px;
                                }
                                
                                .ban-reason {
                                    background: #fff3cd;
                                    border: 1px solid #ffeaa7;
                                    border-radius: 10px;
                                    padding: 1rem;
                                    margin: 1rem 0;
                                    color: #856404;
                                }
                                
                                .contact-info {
                                    background: #e8f4fd;
                                    border-radius: 15px;
                                    padding: 1.5rem;
                                    margin-top: 2rem;
                                    border-left: 5px solid #3498db;
                                }
                                
                                .btn-home {
                                    background: linear-gradient(45deg, #667eea, #764ba2);
                                    border: none;
                                    border-radius: 25px;
                                    padding: 12px 30px;
                                    color: white;
                                    font-weight: 600;
                                    text-decoration: none;
                                    display: inline-block;
                                    margin-top: 1rem;
                                    transition: all 0.3s ease;
                                }
                                
                                .btn-home:hover {
                                    transform: translateY(-2px);
                                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                                    color: white;
                                }
                            </style>
                            ${banContent}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const existingModal = document.getElementById('fullBanModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar el modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar el modal
        const fullBanModal = new bootstrap.Modal(document.getElementById('fullBanModal'));
        fullBanModal.show();
        
        // Limpiar el modal cuando se cierre
        document.getElementById('fullBanModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    // Función global para manejar errores de fetch
    window.handleFetchError = function(response, data) {
        // Obtener el estado de administrador del usuario (asumiendo que se pasa desde el servidor)
        const isAdmin = document.body.dataset.isAdmin === 'true';
        const currentPath = window.location.pathname;
        console.log('handleFetchError: isAdmin:', isAdmin, 'currentPath:', currentPath);

        // Rutas de administración permitidas para administradores baneados
        const adminAllowedPaths = [
            '/admin/',
            '/articles/admin/',
            '/guides/admin/',
            '/forum/admin/'
        ];

        // Verificar si el usuario es admin y está en una ruta permitida
        const isAllowedAdminPath = isAdmin && adminAllowedPaths.some(path => currentPath.startsWith(path));

        if (response.status === 403 && data && data.banned) {
            // Si es un admin en una ruta permitida, no mostrar el modal de baneo
            if (isAdmin && isAllowedAdminPath) {
                console.warn('Admin baneado intentó acceder a ruta permitida. No se muestra modal de baneo.');
                console.log('handleFetchError: Admin is on allowed path, suppressing ban modal.');
                return true; // Se manejó el error (silenciosamente)
            }
            handleBanResponse(data);
            return true; // Indica que se manejó el error de baneo
        }
        return false; // No es un error de baneo
    };

    // Inicializar TinyMCE para el modal
    let modalEditorInitialized = false;

    function initializeModalEditor() {
        if (modalEditorInitialized) return;
        
        const editorStatus = document.getElementById('modal-editor-status');
        const contentField = document.getElementById('modalContent');
        
        if (editorStatus) {
            editorStatus.innerHTML = '<div class="alert alert-info">Cargando editor...</div>';
        }
        
        try {
            tinymce.init({
                selector: '#modalContent',
                height: 300,
                plugins: 'advlist autolink lists link image charmap print preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount',
                toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                content_style: 'body { font-family: Arial, sans-serif; font-size: 16px; }',
                setup: editor => {
                    editor.on('init', () => {
                        if (editorStatus) {
                            editorStatus.innerHTML = '<div class="alert alert-success">Editor cargado correctamente</div>';
                            setTimeout(() => editorStatus.innerHTML = '', 3000);
                        }
                        modalEditorInitialized = true;
                    });
                    editor.on('change', () => editor.save());
                }
            });
        } catch (error) {
            if (editorStatus) {
                editorStatus.innerHTML = '<div class="alert alert-warning">No se pudo cargar el editor. Usa el campo básico.</div>';
            }
            if (contentField) {
                contentField.style.display = 'block';
            }
        }
    }

    // Manejar envío del formulario de crear foro
    const createForoForm = document.getElementById('createForoForm');
    if (createForoForm && !createForoForm.hasAttribute('data-listener-added')) {
        createForoForm.setAttribute('data-listener-added', 'true');
        createForoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Prevenir múltiples envíos
            if (this.dataset.submitting === 'true') {
                return;
            }
            this.dataset.submitting = 'true';
            
            const alertContainer = document.getElementById('createForoAlert');
            const contentField = document.getElementById('modalContent');
            
            // Sincronizar contenido de TinyMCE si está activo
            if (typeof tinymce !== 'undefined' && tinymce.get('modalContent')) {
                tinymce.get('modalContent').save();
            }
            
            // Validar contenido
            let content = '';
            if (typeof tinymce !== 'undefined' && tinymce.get('modalContent')) {
                content = tinymce.get('modalContent').getContent();
            } else if (contentField) {
                content = contentField.value;
            }
            
            if (!content.trim()) {
                if (alertContainer) {
                    alertContainer.innerHTML = '<div class="alert alert-danger">Por favor, ingresa contenido.</div>';
                }
                return;
            }
            
            // Limpiar alertas previas
            if (alertContainer) {
                alertContainer.innerHTML = '';
            }
            
            // Mostrar indicador de carga
            const submitBtn = document.getElementById('submitForoBtn');
            const spinner = document.getElementById('submitSpinner');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            if (spinner) {
                spinner.classList.remove('d-none');
            }
            
            try {
                // Crear FormData manualmente para asegurar que se envíen los datos
                const formData = new FormData();
                
                // Obtener valores del formulario
                const title = document.getElementById('modalTitle').value;
                const topic = document.getElementById('modalTopic').value;
                const imageFile = document.getElementById('modalImage').files[0];
                
                // Obtener contenido del editor
                let content = '';
                if (typeof tinymce !== 'undefined' && tinymce.get('modalContent')) {
                    content = tinymce.get('modalContent').getContent();
                } else {
                    content = document.getElementById('modalContent').value;
                }
                
                if (!title || title.trim().length < 5) {
                    if (alertContainer) {
                        alertContainer.innerHTML = '<div class="alert alert-danger">El título debe tener al menos 5 caracteres.</div>';
                    }
                    throw new Error('Validación: título insuficiente');
                }
                if (!topic || topic === '') {
                    if (alertContainer) {
                        alertContainer.innerHTML = '<div class="alert alert-danger">Selecciona una categoría.</div>';
                    }
                    throw new Error('Validación: categoría requerida');
                }

                // Agregar datos al FormData
                formData.append('title', title);
                formData.append('topic', topic);
                formData.append('content', content);
                if (imageFile) {
                    formData.append('image', imageFile);
                }
                
                console.log('Enviando datos:', {
                    title: title,
                    topic: topic,
                    content: content.substring(0, 100) + '...',
                    hasImage: !!imageFile
                });
                
                const response = await fetch('/foro', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (response.ok) {
                    // Intentar parsear como JSON, pero manejar si no es JSON
                    let data;
                    try {
                        data = await response.json();
                    } catch (jsonError) {
                        // Si no es JSON, asumir que fue exitoso
                        data = { success: true, message: 'Foro creado exitosamente' };
                    }
                    
                    // Mostrar mensaje de éxito
                    if (alertContainer) {
                        alertContainer.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle"></i> Foro creado exitosamente.</div>';
                    }
                    
                    // Agregar el nuevo foro a la página sin recargar
                    setTimeout(() => {
                        if (typeof closeCreateForoModal === 'function') {
                            closeCreateForoModal();
                        }
                        window.location.reload();
                    }, 800);
                } else {
                    // Manejar errores del servidor
                    let errorMessage = 'Error al crear el foro';
                    try {
                        const data = await response.json();
                        errorMessage = data.message || data.error || errorMessage;
                    } catch (jsonError) {
                        // Si no puede parsear JSON, usar mensaje genérico
                        errorMessage = `Error del servidor (${response.status})`;
                    }
                    
                    if (alertContainer) {
                        alertContainer.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> ${errorMessage}</div>`;
                    }
                }
            } catch (error) {
                console.error('Error de red:', error);
                if (alertContainer) {
                    alertContainer.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> Error de conexión. Verifica tu conexión a internet.</div>';
                }
            } finally {
                // Resetear bandera de envío
                this.dataset.submitting = 'false';
                
                // Restaurar botón
                submitBtn.disabled = false;
                if (spinner) {
                    spinner.classList.add('d-none');
                }
            }
        });
    }

    // Limpiar formulario y inicializar editor cuando se abra el modal
    const createForoModal = document.getElementById('createForoModal');
    if (createForoModal) {
        createForoModal.addEventListener('show.bs.modal', function() {
            const form = document.getElementById('createForoForm');
            const alertContainer = document.getElementById('createForoAlert');
            const editorStatus = document.getElementById('modal-editor-status');
            
            // Limpiar formulario y alertas
            if (form) form.reset();
            if (alertContainer) alertContainer.innerHTML = '';
            if (editorStatus) editorStatus.innerHTML = '';
            
            // Inicializar TinyMCE si no está ya inicializado
            if (!modalEditorInitialized) {
                // Pequeño delay para asegurar que el modal esté completamente visible
                setTimeout(() => {
                    initializeModalEditor();
                }, 100);
            } else {
                // Si ya está inicializado, limpiar el contenido
                if (typeof tinymce !== 'undefined' && tinymce.get('modalContent')) {
                    tinymce.get('modalContent').setContent('');
                }
            }
        });
    }
});
    function showMiniToast(message, type) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;background:' + (type === 'success' ? '#198754' : '#6c757d') + ';color:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.2);display:flex;gap:8px;align-items:center;';
        t.innerHTML = '<i class="fas ' + (type === 'success' ? 'fa-check-circle' : 'fa-info-circle') + '"></i><span>' + message + '</span>';
        document.body.appendChild(t);
        setTimeout(function(){ if (t && t.parentNode) t.parentNode.removeChild(t); }, 3000);
    }

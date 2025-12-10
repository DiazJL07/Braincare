document.addEventListener("DOMContentLoaded", () => {
    const editarBtn = document.getElementById("btn-editar-contra");
    const guardarBtn = document.getElementById("btn-guardar-contra");
    const cancelarBtn = document.getElementById("btn-cancelar-contra");
    const formInputs = document.querySelectorAll('#form-contraseña input');

    editarBtn.addEventListener("click", () => {
        formInputs.forEach(input => input.removeAttribute("disabled"));
        editarBtn.style.display = "none";
        guardarBtn.style.display = "inline-block";
        cancelarBtn.style.display = "inline-block";
    });

    cancelarBtn.addEventListener("click", () => {
        formInputs.forEach(input => {
            input.setAttribute("disabled", true);
            input.value = '';
        });
        editarBtn.style.display = "inline-block";
        guardarBtn.style.display = "none";
        cancelarBtn.style.display = "none";
    });
});
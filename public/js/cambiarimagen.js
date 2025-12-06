 function cambiarFooterImg() {
    const img = document.getElementById("footerImg");
    const ancho = window.innerWidth;

    if (ancho <= 320) {
      img.src = "/img/footerimg/footer-320.png"; // para móviles pequeños
    } else if (ancho <= 400) {
      img.src = "/img/footerimg/footer-375.png"; // móviles medianos
    } else if (ancho <= 425) {
      img.src = "/img/footerimg/footer-425.png"; // tablets
    } else if (ancho <= 1439) {
      img.src = "/img/iconos/footer.png"; // desktops medianos
    } else {
      img.src = "/img/iconos/foot.png"; // desktop grande
    }
  }

  // Ejecutar al cargar y al cambiar tamaño
  window.addEventListener("load", cambiarFooterImg);
  window.addEventListener("resize", cambiarFooterImg);

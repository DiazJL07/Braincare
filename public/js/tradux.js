// Script para controlar Google Translate con un selector y botón propios
(function () {
  // Lista fija de idiomas permitidos
  var allowedLanguages = {
    'en': 'Inglés',
    'es': 'Español',
    'pt': 'Portugués',
    'fr': 'Francés',
    'ja': 'Japonés',
    'de': 'Alemán',
    'la': 'Latín'
  };

  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement(
      {
        pageLanguage: 'es',
        autoDisplay: false
      },
      'google_translate_element'
    );

    // Llenamos el selector con la lista fija
    setTimeout(fillLanguages, 1000);
  };

  function fillLanguages() {
    var ourSelect = document.getElementById('languageSelector');
    var googleSelect = document.querySelector('select.goog-te-combo');

    // 👇 Corrección aquí
    if (!googleSelect || googleSelect.options.length < 2) {
      return setTimeout(fillLanguages, 500);
    }

    ourSelect.classList.add("notranslate");

    // Vaciar y crear placeholder
    ourSelect.innerHTML = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Idiomas';
    ourSelect.appendChild(placeholder);

    // Insertar solo los idiomas permitidos
    for (var code in allowedLanguages) {
      var o = document.createElement('option');
      o.value = code;
      o.textContent = allowedLanguages[code];
      o.classList.add("notranslate");
      ourSelect.appendChild(o);
    }

    // Evento cambio en nuestro select
    ourSelect.addEventListener('change', function () {
      if (ourSelect.value) {
        googleSelect.value = ourSelect.value;
        var event = document.createEvent('HTMLEvents');
        event.initEvent('change', true, true);
        googleSelect.dispatchEvent(event);
      }
    });

    // Botón manual
    var btn = document.getElementById('translateBtn');
    if (btn) {
      btn.classList.add("notranslate");
      btn.addEventListener('click', function () {
        if (ourSelect.value) {
          googleSelect.value = ourSelect.value;
          var event = document.createEvent('HTMLEvents');
          event.initEvent('change', true, true);
          googleSelect.dispatchEvent(event);
        }
      });
    }
  }
})();

document.addEventListener("DOMContentLoaded", function () {
  const translators = document.querySelectorAll(".translator");
  if (translators.length > 1) {
    // Dejamos solo el primero y eliminamos el resto
    translators.forEach((el, index) => {
      if (index > 0) el.remove();
    });
  }
});
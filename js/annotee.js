// Capture d'écran annotée : chaque pastille numérotée affiche son
// explication sous l'image. Les explications sont dans le HTML (attribut
// data-texte) : sans JavaScript, la liste de secours reste visible.

(function () {
  document.querySelectorAll('.annotee').forEach(function (fig) {
    var sortie = document.getElementById(fig.getAttribute('data-sortie'));
    var secours = document.getElementById(fig.getAttribute('data-secours'));
    if (!sortie) return;
    if (secours) secours.hidden = true;
    fig.querySelectorAll('.hotspot').forEach(function (h) {
      h.hidden = false;
      h.addEventListener('click', function () {
        fig.querySelectorAll('.hotspot').forEach(function (autre) {
          autre.setAttribute('aria-pressed', autre === h);
        });
        h.classList.add('vu');
        sortie.innerHTML = '<strong>' + h.textContent + '.</strong> ' + h.getAttribute('data-texte');
        var restants = fig.querySelectorAll('.hotspot:not(.vu)').length;
        if (!restants) sortie.innerHTML += ' <span class="pill">Toutes les zones explorées ✔</span>';
      });
    });
  });
})();

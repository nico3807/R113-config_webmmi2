// Page Validation : QCM corrigé dans le navigateur et auto-évaluation des
// objectifs du TP. Les réponses sont mémorisées localement.

(function () {
  var form = document.getElementById('qcm');
  var score = document.getElementById('qcm-score');
  if (form) {
    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      var total = 0;
      var bons = 0;
      form.querySelectorAll('fieldset').forEach(function (fs) {
        total++;
        var choisi = fs.querySelector('input:checked');
        fs.querySelectorAll('label').forEach(function (l) {
          l.classList.remove('bonne', 'mauvaise');
          var input = l.querySelector('input');
          if (input.hasAttribute('data-bonne')) l.classList.add('bonne');
          else if (input.checked) l.classList.add('mauvaise');
        });
        if (choisi && choisi.hasAttribute('data-bonne')) bons++;
        var ex = fs.querySelector('.explication');
        if (ex) ex.hidden = false;
      });
      var msg = bons === total ? ' 🎉 Sans faute !' : bons >= total * 0.7 ? ' Bien joué, relis les explications des erreurs.' : ' Relis la page Concepts puis retente ta chance.';
      score.textContent = 'Score : ' + bons + ' / ' + total + '.' + msg;
      TP.ecrire('qcm', { bons: bons, total: total });
      score.scrollIntoView({ behavior: 'smooth', block: 'center' });
      majBravo();
    });
    form.addEventListener('reset', function () {
      form.querySelectorAll('label').forEach(function (l) {
        l.classList.remove('bonne', 'mauvaise');
      });
      form.querySelectorAll('.explication').forEach(function (e) {
        e.hidden = true;
      });
      score.textContent = '';
    });
    form.querySelectorAll('.explication').forEach(function (e) {
      e.hidden = true;
    });
  }

  var checks = document.querySelectorAll('.objectifs-check input');
  var coches = TP.lire('objectifs', {});
  checks.forEach(function (c) {
    c.checked = !!coches[c.value];
    c.addEventListener('change', function () {
      coches[c.value] = c.checked;
      TP.ecrire('objectifs', coches);
      majBravo();
    });
  });

  function majBravo() {
    var bravo = document.getElementById('bravo');
    if (!bravo) return;
    var tous = Array.prototype.every.call(checks, function (c) {
      return c.checked;
    });
    var q = TP.lire('qcm', null);
    bravo.hidden = !(tous && q && q.bons === q.total);
  }
  majBravo();
})();

// Page Concepts : schéma client / serveur animé (FTP puis HTTP) et
// découpage cliquable de l'URL de l'espace web.

(function () {
  // ---------- Schéma animé ----------
  var svg = document.getElementById('schema-svg');
  var legende = document.getElementById('schema-legende');
  var paquet = document.getElementById('schema-paquet');
  var paquetTxt = document.getElementById('schema-paquet-txt');

  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var enCours = false;

  // Un scénario = suite de segments : [départ, arrivée, étiquette, couleur, légende, éléments à faire briller].
  var SCENARIOS = {
    ftp: [
      [[255, 100], [545, 100], 'index.html', 'var(--accent-b)',
        '1. Le client FTP (FileZilla) se connecte au serveur FTP de web-mmi2, sur le port 21, avec ton login et ton mot de passe, puis envoie index.html.',
        ['svc-client-ftp', 'svc-serveur-ftp']],
      [[655, 130], [655, 160], 'index.html', 'var(--accent-b)',
        '2. Le serveur FTP écrit le fichier sur le disque du serveur, dans ton dossier public_html. Le Web n\'est pas intervenu.',
        ['svc-serveur-ftp', 'svc-disque']]
    ],
    http: [
      [[255, 250], [545, 250], 'GET /~login/', 'var(--accent-a)',
        '1. Le navigateur (client HTTP) envoie une requête au serveur web Apache, port 80 : « donne-moi la page /~login/ ».',
        ['svc-navigateur', 'svc-apache']],
      [[655, 220], [655, 192], 'lecture', 'var(--accent-a)',
        '2. Apache traduit /~login/ en /home/l/login/public_html/ et y lit index.html.',
        ['svc-apache', 'svc-disque']],
      [[545, 270], [255, 270], '200 OK + HTML', 'var(--ok)',
        '3. Apache renvoie la page (code 200). Le navigateur l\'affiche. Le serveur FTP n\'est pas intervenu.',
        ['svc-apache', 'svc-navigateur']]
    ]
  };

  function briller(ids) {
    svg.querySelectorAll('.service').forEach(function (el) {
      var actif = ids.indexOf(el.id) !== -1;
      el.classList.toggle('actif', actif);
      el.style.opacity = ids.length && !actif ? 0.45 : 1;
    });
  }

  function segment(seg, fin) {
    var a = seg[0];
    var b = seg[1];
    // Les textes parlent de « login » : on y met celui de l'étudiant·e.
    var l = TP.login() || 'login';
    legende.textContent = seg[4].replace(/~login/g, '~' + l).replace('/home/l/login', '/home/' + l.charAt(0) + '/' + l);
    briller(seg[5]);
    paquet.setAttribute('fill', seg[3]);
    paquetTxt.textContent = seg[2].replace('~login', '~' + l);
    paquet.style.opacity = 1;
    paquetTxt.style.opacity = 1;
    var duree = reduit ? 1 : 1400;
    var t0 = null;
    function pas(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / duree);
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      var x = a[0] + (b[0] - a[0]) * e;
      var y = a[1] + (b[1] - a[1]) * e;
      paquet.setAttribute('cx', x);
      paquet.setAttribute('cy', y);
      paquetTxt.setAttribute('x', x);
      paquetTxt.setAttribute('y', y - 14);
      if (p < 1) requestAnimationFrame(pas);
      else setTimeout(fin, reduit ? 1500 : 900);
    }
    requestAnimationFrame(pas);
  }

  function jouer(nom) {
    if (enCours) return;
    enCours = true;
    var segs = SCENARIOS[nom];
    var i = 0;
    (function suivant() {
      if (i >= segs.length) {
        paquet.style.opacity = 0;
        paquetTxt.style.opacity = 0;
        briller([]);
        enCours = false;
        return;
      }
      segment(segs[i++], suivant);
    })();
  }

  if (svg) {
    document.querySelectorAll('[data-scenario]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        jouer(btn.getAttribute('data-scenario'));
      });
    });
  }

  // ---------- Découpage de l'URL ----------
  var url = document.getElementById('url-dissect');
  var explication = document.getElementById('url-explication');
  if (!url || !explication) return;

  var TEXTES = {
    'u-proto':
      '<strong>Le protocole</strong> : <code>http://</code> indique au navigateur de dialoguer avec un <em>serveur web</em> (serveur HTTP), sur le port 80 par défaut. Ce n\'est pas le même protocole que celui utilisé pour déposer les fichiers (FTP).',
    'u-hote':
      '<strong>Le nom d\'hôte</strong> : <code>web-mmi2.iutbeziers.fr</code> est le nom de la machine qui héberge le serveur web. C\'est aussi elle qui héberge le serveur FTP : c\'est donc ce nom que tu donneras à ton client FTP.',
    'u-chemin':
      '<strong>Le chemin</strong> : <code>/~login/</code>. Sur ce serveur, le tilde « ~ » suivi d\'un login désigne le dossier <code>public_html</code> de cet utilisateur : <span class="perso" data-perso="url"></span> affiche le contenu de <span class="perso" data-perso="public"></span>.'
  };

  function montrer(span) {
    url.querySelectorAll('span[class^="u-"]').forEach(function (s) {
      s.classList.toggle('on', s === span);
    });
    explication.innerHTML = TEXTES[span.className.split(' ')[0]];
    // Les valeurs personnalisées insérées à l'instant doivent être remplies.
    var l = TP.login() || 'login';
    explication.querySelectorAll('[data-perso]').forEach(function (el) {
      var k = el.getAttribute('data-perso');
      var b = '<b>' + TP.echapper(l) + '</b>';
      var i = '<b>' + TP.echapper(l.charAt(0)) + '</b>';
      el.innerHTML = k === 'url' ? 'http://' + TP.HOTE + '/~' + b + '/' : '/home/' + i + '/' + b + '/public_html';
    });
  }

  url.addEventListener('click', function (evt) {
    var span = evt.target.closest('span[class^="u-"]');
    if (span) montrer(span);
  });
  url.addEventListener('keydown', function (evt) {
    var span = evt.target.closest('span[class^="u-"]');
    if (span && (evt.key === 'Enter' || evt.key === ' ')) {
      evt.preventDefault();
      montrer(span);
    }
  });
})();

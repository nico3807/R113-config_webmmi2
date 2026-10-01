// Comportements communs à toutes les pages :
//  - mise en surbrillance du lien de navigation courant (data-page sur <body>) ;
//  - mémorisation du login IUT et personnalisation des URL / chemins ;
//  - étapes repliables avec case « terminé » et barre de progression ;
//  - questions à réponse vérifiée.
// Tout est stocké dans le navigateur de l'étudiant·e (localStorage) : rien
// n'est envoyé nulle part. Sans stockage disponible, la page reste utilisable.

var TP = (function () {
  var PREFIXE = 'webmmi2-';
  var HOTE = 'web-mmi2.iutbeziers.fr';

  function lire(cle, defaut) {
    try {
      var v = localStorage.getItem(PREFIXE + cle);
      return v === null ? defaut : JSON.parse(v);
    } catch (e) {
      return defaut;
    }
  }

  function ecrire(cle, valeur) {
    try {
      localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur));
    } catch (e) {
      /* stockage indisponible (navigation privée...) : on ignore */
    }
  }

  function echapper(txt) {
    return String(txt).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Login et valeurs personnalisées ----------

  function login() {
    return lire('login', '');
  }

  function valeurs(l) {
    var aff = l ? '<b>' + echapper(l) + '</b>' : '<b>login</b>';
    var init = l ? '<b>' + echapper(l.charAt(0)) + '</b>' : '<b>l</b>';
    return {
      login: aff,
      initiale: init,
      hote: HOTE,
      url: 'http://' + HOTE + '/~' + aff + '/',
      home: '/home/' + init + '/' + aff,
      public: '/home/' + init + '/' + aff + '/public_html'
    };
  }

  function urlPerso() {
    var l = login();
    return 'http://' + HOTE + '/~' + (l || 'login') + '/';
  }

  function personnaliser() {
    var v = valeurs(login());
    document.querySelectorAll('[data-perso]').forEach(function (el) {
      var cle = el.getAttribute('data-perso');
      if (v[cle] !== undefined) el.innerHTML = v[cle];
    });
    document.querySelectorAll('a[data-lien-perso]').forEach(function (a) {
      a.href = urlPerso();
      a.classList.toggle('desactive', !login());
    });
    document.dispatchEvent(new CustomEvent('tp:login', { detail: login() }));
  }

  function initLogin() {
    document.querySelectorAll('.login-bar input').forEach(function (input) {
      input.value = login();
      input.addEventListener('input', function () {
        // Un login IUT est en minuscules, sans espace.
        var l = input.value.trim().toLowerCase().replace(/\s+/g, '');
        ecrire('login', l);
        document.querySelectorAll('.login-bar input').forEach(function (autre) {
          if (autre !== input) autre.value = l;
        });
        personnaliser();
      });
    });
    personnaliser();
  }

  // ---------- Étapes repliables + progression ----------

  function initEtapes() {
    var etapes = document.querySelectorAll('[data-etape]');
    if (!etapes.length) return;
    var faites = lire('etapes', {});

    function majProgression() {
      var total = etapes.length;
      var n = 0;
      etapes.forEach(function (e) {
        if (faites[e.id]) n++;
      });
      document.querySelectorAll('[data-progress]').forEach(function (barre) {
        barre.style.width = Math.round((100 * n) / total) + '%';
      });
      document.querySelectorAll('[data-progress-text]').forEach(function (t) {
        t.textContent = n + ' / ' + total + ' étapes terminées';
      });
    }

    etapes.forEach(function (etape, i) {
      var tete = etape.querySelector('.scenario-head');
      var check = etape.querySelector('.scenario-check');
      if (faites[etape.id]) {
        etape.classList.add('done');
        check.checked = true;
      }
      // Première étape non terminée ouverte d'office.
      function basculer() {
        var ouvert = etape.classList.toggle('open');
        tete.setAttribute('aria-expanded', ouvert);
      }
      tete.addEventListener('click', function (evt) {
        if (evt.target === check) return;
        basculer();
      });
      tete.addEventListener('keydown', function (evt) {
        if (evt.target === check) return;
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          basculer();
        }
      });
      check.addEventListener('change', function () {
        faites[etape.id] = check.checked;
        etape.classList.toggle('done', check.checked);
        ecrire('etapes', faites);
        majProgression();
        // On referme l'étape terminée et on ouvre la suivante.
        if (check.checked) {
          etape.classList.remove('open');
          tete.setAttribute('aria-expanded', 'false');
          var suivante = etapes[i + 1];
          if (suivante && !suivante.classList.contains('open')) {
            suivante.classList.add('open');
            suivante.querySelector('.scenario-head').setAttribute('aria-expanded', 'true');
            suivante.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    var premiere = Array.prototype.find.call(etapes, function (e) {
      return !faites[e.id];
    });
    // Un lien direct vers une étape (#etape-3) l'ouvre en priorité.
    var cible = location.hash && document.querySelector(location.hash + '[data-etape]');
    var aOuvrir = cible || premiere;
    if (aOuvrir) {
      aOuvrir.classList.add('open');
      aOuvrir.querySelector('.scenario-head').setAttribute('aria-expanded', 'true');
    }

    var reset = document.querySelector('[data-reset-etapes]');
    if (reset) {
      reset.addEventListener('click', function () {
        faites = {};
        ecrire('etapes', faites);
        etapes.forEach(function (e) {
          e.classList.remove('done');
          e.querySelector('.scenario-check').checked = false;
        });
        majProgression();
      });
    }
    majProgression();
  }

  // ---------- Questions à réponse vérifiée ----------
  // Chaque validateur renvoie { ok: bool, msg: 'texte' }.

  function normaliserHote(s) {
    return s
      .trim()
      .toLowerCase()
      .replace(/^[a-z]+:\/\//, '')
      .replace(/\/+$/, '');
  }

  var CLIENTS_FTP = [
    'filezilla', 'winscp', 'cyberduck', 'transmit', 'forklift', 'gftp',
    'fireftp', 'coreftp', 'core ftp', 'smartftp', 'total commander',
    'commander one', 'flashfxp', 'cuteftp', 'free ftp', 'mountain duck'
  ];

  var VALIDATEURS = {
    hote: function (rep) {
      var h = normaliserHote(rep);
      if (h === HOTE) {
        return { ok: true, msg: 'Exact ! web-mmi2.iutbeziers.fr est le nom d\'hôte de la machine.' };
      }
      if (h.indexOf('/') !== -1 || h.indexOf('~') !== -1) {
        return { ok: false, msg: 'Tu as gardé une partie du chemin : enlève tout ce qui suit le premier « / ».' };
      }
      if (h === 'web-mmi2') {
        return { ok: false, msg: 'Presque : c\'est le nom court. Le nom complet contient aussi le domaine de l\'IUT.' };
      }
      return { ok: false, msg: 'Pas tout à fait. Repars de l\'URL complète, enlève « http:// » et tout ce qui suit le premier « / ».' };
    },
    clients: function (rep) {
      var r = rep.toLowerCase();
      var trouves = CLIENTS_FTP.filter(function (c) {
        return r.indexOf(c) !== -1;
      });
      if (trouves.length >= 2) {
        return { ok: true, msg: 'Bien vu : ' + trouves.join(', ') + '. FileZilla est installé sur les postes de l\'IUT.' };
      }
      if (trouves.length === 1) {
        return { ok: false, msg: trouves[0] + ', oui ! Il en faut au moins un deuxième (sépare-les par des virgules).' };
      }
      return { ok: false, msg: 'Aucun client FTP reconnu. Cherche « client FTP gratuit » sur le web.' };
    },
    urlsite: function (rep) {
      var l = login();
      if (!l) return { ok: false, msg: 'Renseigne d\'abord ton login en haut de la page.' };
      var r = rep.trim().toLowerCase();
      var attendu = ('http://' + HOTE + '/~' + l).toLowerCase();
      var attenduS = attendu.replace('http://', 'https://');
      if (r.indexOf(attendu) === 0 || r.indexOf(attenduS) === 0) {
        return { ok: true, msg: 'Parfait, c\'est bien une adresse de ton espace web. Ouvre-la pour vérifier que ta page s\'affiche.' };
      }
      if (r.indexOf('public_html') !== -1) {
        return { ok: false, msg: 'public_html n\'apparaît jamais dans l\'URL : c\'est « ~' + l + ' » qui le remplace.' };
      }
      if (r.indexOf('file:') === 0 || /^[a-z]:\\/.test(r)) {
        return { ok: false, msg: 'Ça, c\'est un fichier de ton disque, pas une adresse web.' };
      }
      return { ok: false, msg: 'L\'adresse doit commencer par ' + attendu + '/' };
    }
  };

  function initQuestions() {
    var reussies = lire('questions', {});
    document.querySelectorAll('.question[data-question]').forEach(function (bloc) {
      var id = bloc.getAttribute('data-question');
      var form = bloc.querySelector('form');
      var input = bloc.querySelector('input');
      var fb = bloc.querySelector('.feedback');
      if (!form || !VALIDATEURS[id]) return;
      if (reussies[id]) {
        bloc.classList.add('reussie');
        input.value = reussies[id];
      }
      form.addEventListener('submit', function (evt) {
        evt.preventDefault();
        var res = VALIDATEURS[id](input.value);
        fb.textContent = (res.ok ? '✔ ' : '✖ ') + res.msg;
        fb.className = 'feedback ' + (res.ok ? 'ok' : 'ko');
        bloc.classList.toggle('reussie', res.ok);
        if (res.ok) {
          reussies[id] = input.value;
          ecrire('questions', reussies);
        }
      });
    });
  }

  // ---------- Cartes à retourner ----------

  function initFlip() {
    document.querySelectorAll('.flip').forEach(function (carte) {
      carte.setAttribute('aria-pressed', 'false');
      carte.addEventListener('click', function () {
        var r = carte.classList.toggle('retournee');
        carte.setAttribute('aria-pressed', r);
      });
    });
  }

  // ---------- Navigation ----------

  function initNav() {
    var current = document.body.getAttribute('data-page');
    if (!current) return;
    document.querySelectorAll('.site-nav a[data-nav]').forEach(function (link) {
      if (link.getAttribute('data-nav') === current) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  initNav();
  initLogin();
  initEtapes();
  initQuestions();
  initFlip();

  return {
    lire: lire,
    ecrire: ecrire,
    login: login,
    urlPerso: urlPerso,
    echapper: echapper,
    HOTE: HOTE
  };
})();

// Simulateur de client FTP façon FileZilla : rien ne part sur le réseau,
// tout se joue dans la page. Il reproduit les étapes du TP (connexion,
// création de public_html, dépôt d'index.html) et un mini navigateur montre
// ce que le serveur web renverrait à chaque instant : 404, « Index of » ou
// la page du site.

(function () {
  var racine = document.getElementById('simulateur');
  if (!racine) return;

  var $ = function (sel) {
    return racine.querySelector(sel);
  };
  var esc = TP.echapper;

  var FICHIERS_LOCAUX = [
    { nom: 'index.html', taille: 1834 },
    { nom: 'contact.html', taille: 1210 },
    { nom: 'style.css', taille: 2675 },
    { nom: 'photo.jpg', taille: 84320 }
  ];

  var etat;

  function nouvelEtat() {
    return {
      connecte: false,
      login: '',
      chemin: [], // relatif au dossier personnel
      // Arborescence distante : un dossier est un objet, un fichier un nombre (taille).
      arbre: { '.bash_logout': 220, '.bashrc': 3526, '.profile': 807 },
      missions: {}
    };
  }

  // ---------- Utilitaires ----------

  function home() {
    return '/home/' + etat.login.charAt(0) + '/' + etat.login;
  }

  function dossierCourant() {
    var d = etat.arbre;
    etat.chemin.forEach(function (n) {
      d = d[n];
    });
    return d;
  }

  function cheminAffiche() {
    return home() + (etat.chemin.length ? '/' + etat.chemin.join('/') : '');
  }

  function log(txt, classe) {
    var ligne = document.createElement('div');
    if (classe) ligne.className = classe;
    ligne.textContent = txt;
    var zone = $('.simu-log');
    zone.appendChild(ligne);
    zone.scrollTop = zone.scrollHeight;
  }

  function mission(cle) {
    if (etat.missions[cle]) return;
    etat.missions[cle] = true;
    var li = racine.querySelector('[data-mission="' + cle + '"]');
    if (li) li.classList.add('faite');
    var toutes = racine.querySelectorAll('[data-mission]');
    var faites = racine.querySelectorAll('[data-mission].faite');
    if (toutes.length === faites.length) {
      $('.simu-bravo').hidden = false;
    }
  }

  function taille(n) {
    return n.toLocaleString('fr-FR') + ' o';
  }

  // ---------- Rendu des deux panneaux ----------

  function rendreLocal() {
    var ul = $('[data-pane="local"] .simu-list');
    ul.innerHTML = '';
    FICHIERS_LOCAUX.forEach(function (f) {
      var li = document.createElement('li');
      li.draggable = true;
      li.dataset.nom = f.nom;
      li.innerHTML =
        '<span aria-hidden="true">📄</span>' + esc(f.nom) +
        '<span class="taille">' + taille(f.taille) + '</span>' +
        '<button type="button" class="envoyer" title="Envoyer vers le dossier distant affiché">Envoyer →</button>';
      li.addEventListener('dragstart', function (evt) {
        evt.dataTransfer.setData('text/plain', f.nom);
      });
      li.querySelector('.envoyer').addEventListener('click', function () {
        envoyer(f.nom);
      });
      ul.appendChild(li);
    });
  }

  function rendreDistant(nouveau) {
    var pane = $('[data-pane="distant"]');
    var ul = pane.querySelector('.simu-list');
    ul.innerHTML = '';
    var actions = pane.querySelectorAll('.simu-actions button, .simu-actions input');
    actions.forEach(function (b) {
      b.disabled = !etat.connecte;
    });
    if (!etat.connecte) {
      pane.querySelector('.simu-path').textContent = 'Non connecté';
      ul.innerHTML = '<li><em>Connecte-toi d\'abord au serveur (barre du haut).</em></li>';
      return;
    }
    pane.querySelector('.simu-path').textContent = cheminAffiche();
    pane.querySelector('[data-action="parent"]').disabled = etat.chemin.length === 0;

    var d = dossierCourant();
    var noms = Object.keys(d).sort(function (a, b) {
      var da = typeof d[a] === 'object';
      var db = typeof d[b] === 'object';
      if (da !== db) return da ? -1 : 1;
      return a.localeCompare(b);
    });
    if (etat.chemin.length) {
      var up = document.createElement('li');
      up.className = 'dossier';
      up.innerHTML = '<span aria-hidden="true">📁</span>..';
      up.tabIndex = 0;
      up.addEventListener('click', parent);
      ul.appendChild(up);
    }
    noms.forEach(function (n) {
      var li = document.createElement('li');
      var estDossier = typeof d[n] === 'object';
      if (estDossier) {
        li.className = 'dossier';
        li.tabIndex = 0;
        li.title = 'Ouvrir le dossier';
        li.innerHTML = '<span aria-hidden="true">📁</span>' + esc(n);
        li.addEventListener('click', function () {
          ouvrir(n);
        });
        li.addEventListener('keydown', function (evt) {
          if (evt.key === 'Enter') ouvrir(n);
        });
      } else {
        li.innerHTML = '<span aria-hidden="true">📄</span>' + esc(n) +
          '<span class="taille">' + taille(d[n]) + '</span>';
      }
      if (n === nouveau) li.classList.add('nouveau');
      ul.appendChild(li);
    });
    if (!noms.length && !etat.chemin.length) {
      ul.innerHTML = '<li><em>Dossier vide</em></li>';
    }
  }

  // ---------- Actions distantes ----------

  function ouvrir(nom) {
    etat.chemin.push(nom);
    log('Statut : Récupération du contenu du dossier « ' + cheminAffiche() + ' »...');
    log('Statut : Contenu du dossier « ' + cheminAffiche() + ' » affiché avec succès');
    rendreDistant();
  }

  function parent() {
    etat.chemin.pop();
    log('Statut : Contenu du dossier « ' + cheminAffiche() + ' » affiché avec succès');
    rendreDistant();
  }

  function creerDossier(evt) {
    evt.preventDefault();
    var input = $('[data-action="nom-dossier"]');
    var nom = input.value.trim();
    if (!nom) return;
    var d = dossierCourant();
    log('Commande : MKD ' + nom, 'cmd');
    if (d[nom] !== undefined) {
      log('Erreur : 550 Create directory operation failed (« ' + nom + ' » existe déjà).', 'err');
      return;
    }
    d[nom] = {};
    log('Réponse : 257 "' + cheminAffiche() + '/' + nom + '" created');
    input.value = '';
    rendreDistant(nom);

    if (nom === 'public_html') {
      if (etat.chemin.length === 0) {
        mission('public');
        log('Statut : public_html est créé au bon endroit. Clique sur « Actualiser » dans le navigateur !');
      } else {
        log('Attention : public_html doit être directement dans ' + home() + ', pas dans un sous-dossier.', 'err');
      }
    } else if (nom.toLowerCase().replace(/[\s-]/g, '_') === 'public_html') {
      log('Attention : le nom doit être exactement « public_html » (minuscules, tiret bas). Le serveur ne reconnaîtra pas « ' + nom + ' ».', 'err');
    }
  }

  function envoyer(nom) {
    if (!etat.connecte) {
      log('Erreur : pas de connexion au serveur.', 'err');
      return;
    }
    var f = FICHIERS_LOCAUX.filter(function (x) {
      return x.nom === nom;
    })[0];
    if (!f) return;
    var d = dossierCourant();
    log('Commande : STOR ' + nom, 'cmd');
    log('Réponse : 226 Transfer complete');
    log('Statut : Transfert de fichier réussi, ' + taille(f.taille) + ' transférés');
    d[nom] = f.taille;
    rendreDistant(nom);
    if (nom === 'index.html') {
      if (etat.chemin.length === 1 && etat.chemin[0] === 'public_html') {
        mission('index');
      } else {
        log('Attention : ce fichier n\'est pas dans public_html, le serveur web ne le verra pas.', 'err');
      }
    }
  }

  // ---------- Connexion ----------

  function connecter(evt) {
    evt.preventDefault();
    var hote = $('[name="hote"]').value.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/\/+$/, '');
    var proto = $('[name="proto"]').value;
    var port = $('[name="port"]').value.trim();
    var user = $('[name="user"]').value.trim().toLowerCase();
    var mdp = $('[name="mdp"]').value;
    var portAttendu = proto === 'ftp' ? '21' : '22';

    $('.simu-log').innerHTML = '';
    log('Statut : Résolution de l\'adresse de ' + (hote || '(vide)'));
    if (hote !== TP.HOTE) {
      log('Erreur : Impossible de résoudre le nom d\'hôte « ' + hote + ' ». Vérifie l\'hôte : web-mmi2.iutbeziers.fr', 'err');
      return;
    }
    if (port && port !== portAttendu) {
      log('Erreur : Connexion expirée sur le port ' + port + '. En ' + proto.toUpperCase() + ', le port est ' + portAttendu + ' (ou laisse vide).', 'err');
      return;
    }
    log('Statut : Connexion à ' + hote + ':' + portAttendu + '...');
    if (!user || !mdp) {
      log('Erreur : 530 Login incorrect. Il faut ton login ET ton mot de passe IUT.', 'err');
      return;
    }
    if (user.indexOf('@') !== -1) {
      log('Erreur : 530 Login incorrect. Ton login IUT n\'est pas ton adresse mail (pas de « @ »).', 'err');
      return;
    }
    if (etat.login !== user) {
      // Nouvel utilisateur : on repart d'un espace vierge.
      var missions = etat.missions;
      etat = nouvelEtat();
      etat.missions = missions;
    }
    etat.login = user;
    etat.connecte = true;
    etat.chemin = [];
    log('Réponse : 230 Login successful.');
    log('Statut : Connecté');
    log('Statut : Contenu du dossier « ' + home() + ' » affiché avec succès');
    mission('connexion');
    rendreDistant();
    majAdresse();
  }

  // ---------- Mini navigateur ----------

  function majAdresse() {
    var l = etat.login || TP.login() || 'login';
    $('.adresse').textContent = 'http://' + TP.HOTE + '/~' + l + '/';
  }

  function page404(l) {
    return (
      '<h1>Not Found</h1>' +
      '<p>The requested URL /~' + esc(l) + '/ was not found on this server.</p>' +
      '<hr><address>Apache/2.4.38 (Debian) Server at web-mmi2.iutbeziers.fr Port 80</address>'
    );
  }

  function pageIndex(l, dossier) {
    var lignes = Object.keys(dossier)
      .sort()
      .map(function (n) {
        var dos = typeof dossier[n] === 'object';
        return '<tr><td>' + (dos ? '📁' : '📄') + '</td><td><a href="#" onclick="return false">' +
          esc(n) + (dos ? '/' : '') + '</a></td><td>' + (dos ? '-' : taille(dossier[n])) + '</td></tr>';
      })
      .join('');
    return (
      '<h1>Index of /~' + esc(l) + '</h1>' +
      '<table><tr><th></th><th><a href="#" onclick="return false">Name</a></th><th><a href="#" onclick="return false">Size</a></th></tr>' +
      '<tr><td>↰</td><td><a href="#" onclick="return false">Parent Directory</a></td><td>-</td></tr>' +
      lignes + '</table>' +
      '<hr><address>Apache/2.4.38 (Debian) Server at web-mmi2.iutbeziers.fr Port 80</address>'
    );
  }

  function pageSite(dossier) {
    var css = dossier['style.css'] !== undefined;
    var photo = dossier['photo.jpg'] !== undefined;
    return (
      '<div class="site-demo"' + (css ? '' : ' style="background:none;color:#111;text-align:left"') + '>' +
      '<h1>Mon premier site en ligne</h1>' +
      '<p>Cette page est servie par Apache depuis public_html.</p>' +
      (photo ? '<p>🖼️ photo.jpg affichée</p>' : '<p>[image cassée : photo.jpg introuvable]</p>') +
      '</div>' +
      (css ? '' : '<p><small>La page s\'affiche sans mise en forme : style.css n\'a pas été envoyé.</small></p>')
    );
  }

  function actualiser() {
    var l = etat.login || TP.login() || 'login';
    var page = $('.nav-page');
    var pub = etat.connecte && etat.arbre.public_html;
    if (!pub || (etat.login && l !== etat.login)) {
      page.innerHTML = page404(l);
      return;
    }
    if (pub['index.html'] !== undefined) {
      page.innerHTML = pageSite(pub);
      mission('site');
    } else {
      page.innerHTML = pageIndex(l, pub);
      mission('vide');
    }
  }

  // ---------- Initialisation ----------

  function reinitialiser() {
    etat = nouvelEtat();
    racine.querySelectorAll('[data-mission]').forEach(function (li) {
      li.classList.remove('faite');
    });
    $('.simu-bravo').hidden = true;
    $('.simu-log').innerHTML = '';
    log('Statut : Prêt. Renseigne l\'hôte, le port, ton login et ton mot de passe, puis clique sur « Connexion rapide ».');
    rendreLocal();
    rendreDistant();
    majAdresse();
    actualiser();
  }

  $('.simu-connexion').addEventListener('submit', connecter);
  $('[data-action="mkdir"]').addEventListener('submit', creerDossier);
  $('[data-action="parent"]').addEventListener('click', parent);
  $('[data-action="actualiser"]').addEventListener('click', actualiser);
  $('[data-action="reset"]').addEventListener('click', reinitialiser);

  var zoneDepot = $('[data-pane="distant"] .simu-list');
  zoneDepot.addEventListener('dragover', function (evt) {
    if (!etat.connecte) return;
    evt.preventDefault();
    zoneDepot.classList.add('drop');
  });
  zoneDepot.addEventListener('dragleave', function () {
    zoneDepot.classList.remove('drop');
  });
  zoneDepot.addEventListener('drop', function (evt) {
    evt.preventDefault();
    zoneDepot.classList.remove('drop');
    envoyer(evt.dataTransfer.getData('text/plain'));
  });

  // Pré-remplit l'utilisateur avec le login saisi en haut de page.
  document.addEventListener('tp:login', function (evt) {
    var champ = $('[name="user"]');
    if (!champ.value || champ.dataset.auto === '1') {
      champ.value = evt.detail || '';
      champ.dataset.auto = '1';
    }
    if (!etat.connecte) majAdresse();
  });
  $('[name="user"]').addEventListener('input', function () {
    this.dataset.auto = '0';
  });
  $('[name="proto"]').addEventListener('change', function () {
    $('[name="port"]').placeholder = this.value === 'ftp' ? '21' : '22';
  });

  reinitialiser();
  $('[name="user"]').value = TP.login();
  $('[name="user"]').dataset.auto = '1';
})();

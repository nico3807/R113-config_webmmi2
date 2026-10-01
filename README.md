# R113-config_webmmi2

TP interactif (BUT MMI1 — R1.13 Hébergement) : déployer ses premières pages
HTML sur l'espace web que l'IUT de Béziers met à disposition de chaque
étudiant·e (`http://web-mmi2.iutbeziers.fr/~login/`), en comprenant le rôle
du serveur web (HTTP) et du serveur FTP.

## Utiliser ce TP en tant qu'étudiant·e

1. Ouvrir `index.html` dans un navigateur (double-clic suffit : aucune page
   ne charge de données via `fetch()`, pas besoin de serveur local).
2. Saisir son login IUT dans le champ « Mon login IUT » : toutes les URL et
   tous les chemins du TP s'adaptent. Le login reste dans le navigateur
   (`localStorage`), rien n'est envoyé.
3. Suivre l'ordre du menu : Concepts → TP → Validation. Le Mémo sert
   d'aide-mémoire et de guide de dépannage.

## Utiliser ce dépôt en tant qu'enseignant·e

Pousser ce dossier tel quel sur un dépôt GitHub et activer GitHub Pages sur la
branche `main` pour obtenir un lien cliquable à distribuer.

## Éléments interactifs

- **Login personnalisé** : URL, dossier personnel `/home/l/login` et
  `public_html` affichés avec le login de l'étudiant·e.
- **Schéma client-serveur animé** (Concepts) : un dépôt FTP puis une
  consultation HTTP, pour voir quel client parle à quel serveur.
- **Anatomie de l'URL** : protocole, nom d'hôte et chemin cliquables.
- **Cartes à retourner** pour le vocabulaire.
- **Étapes repliables** avec case « terminé » et barre de progression
  mémorisée.
- **Questions vérifiées** : nom d'hôte, clients FTP, URL du site déployé.
- **Capture FileZilla annotée** : pastilles cliquables sur chaque zone.
- **Simulateur de client FTP** : connexion, création de `public_html`,
  glisser-déposer des fichiers et mini navigateur qui affiche la réponse du
  serveur (404, « Index of », site), avec une liste de missions.
- **QCM corrigé** et auto-évaluation des objectifs.

## Structure

```
R113-config_webmmi2/
├── index.html        Accueil, objectifs à atteindre, déroulé
├── concepts.html     Client/serveur, HTTP/FTP, vocabulaire, anatomie de l'URL
├── tp.html           Exercice 1 en 6 étapes (1.1 client FTP, 1.2 dépôt) + simulateur
├── validation.html   Validation des objectifs : QCM et auto-évaluation
├── memo.html         Informations de connexion, vocabulaire, dépannage
├── css/style.css     Feuille de style partagée (thème clair / sombre)
├── img/              Images du sujet Word (img1 à img3, logo, icône, connexion)
└── js/
    ├── main.js        Navigation, login, étapes, progression, questions
    ├── concepts.js    Schéma animé et découpage de l'URL
    ├── annotee.js     Capture d'écran annotée
    ├── simulateur.js  Simulateur de client FTP + mini navigateur
    └── validation.js  QCM et objectifs
```

## Licence

Support pédagogique libre de réutilisation et d'adaptation dans un cadre
d'enseignement.

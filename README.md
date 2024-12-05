# EduMeet - Plateforme de Visioconférence Éducative

EduMeet est une plateforme de visioconférence conçue spécifiquement pour l'éducation, permettant aux enseignants et aux étudiants de se connecter facilement pour des cours en ligne.

## Prérequis

- Node.js (version 14 ou supérieure)
- npm (gestionnaire de paquets Node.js)
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-username/edumeet.git
cd edumeet
```

2. Installez les dépendances :
```bash
npm install
```

3. Configuration :
- Copiez le fichier `.env.example` en `.env`
- Modifiez les variables d'environnement selon vos besoins

4. Démarrez l'application :
```bash
npm start
```

L'application sera accessible à l'adresse : `http://localhost:3000`

## Fonctionnalités principales

- Visioconférence en temps réel
- Chat textuel
- Partage d'écran
- Tableau blanc interactif
- Gestion des salles de cours
- Contrôle des participants

## Structure du projet

```
edumeet/
├── app/              # Code source principal
├── public/           # Fichiers statiques
├── server/           # Code du serveur
└── config/           # Fichiers de configuration
```

## Sécurité

- Les communications sont chiffrées via WebRTC
- Authentification requise pour accéder aux salles
- Protection contre les intrusions non autorisées

## Support

Pour toute question ou problème, veuillez :
1. Consulter la documentation
2. Ouvrir une issue sur GitHub
3. Contacter l'équipe de support

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Contribution

Les contributions sont les bienvenues ! Veuillez lire le guide de contribution avant de soumettre une pull request.

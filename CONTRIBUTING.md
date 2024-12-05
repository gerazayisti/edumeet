# Guide de Contribution - EduMeet

Nous sommes ravis que vous souhaitiez contribuer à EduMeet ! Ce document fournit les lignes directrices pour contribuer au projet.

## Code de Conduite

En participant à ce projet, vous vous engagez à maintenir un environnement respectueux et professionnel. Nous attendons de tous les contributeurs qu'ils :
- Utilisent un langage accueillant et inclusif
- Respectent les différents points de vue et expériences
- Acceptent gracieusement les critiques constructives
- Se concentrent sur ce qui est le mieux pour la communauté

## Comment Contribuer

### 1. Préparation

1. Fork le dépôt
2. Clonez votre fork :
```bash
git clone https://github.com/votre-username/edumeet.git
```
3. Ajoutez le dépôt upstream :
```bash
git remote add upstream https://github.com/original/edumeet.git
```

### 2. Créer une Branche

Pour chaque nouvelle fonctionnalité ou correction :
```bash
git checkout -b nom-de-votre-branche
```

Conventions de nommage des branches :
- `feature/` pour les nouvelles fonctionnalités
- `fix/` pour les corrections de bugs
- `docs/` pour les modifications de documentation
- `refactor/` pour les refactorisations de code

### 3. Style de Code

- Suivez les conventions de style existantes
- Utilisez des noms de variables et fonctions descriptifs
- Commentez votre code quand nécessaire
- Respectez l'indentation et le formatage du projet

### 4. Tests

- Ajoutez des tests pour les nouvelles fonctionnalités
- Assurez-vous que tous les tests passent avant de soumettre
- Exécutez les tests :
```bash
npm test
```

### 5. Commit

- Utilisez des messages de commit clairs et descriptifs
- Format recommandé :
```
type(scope): description courte

Description détaillée si nécessaire
```
Types : feat, fix, docs, style, refactor, test, chore

### 6. Pull Request

1. Poussez vos changements :
```bash
git push origin nom-de-votre-branche
```
2. Créez une Pull Request sur GitHub
3. Décrivez clairement vos changements
4. Référencez les issues concernées
5. Attendez la review

### 7. Review

- Répondez aux commentaires de manière constructive
- Faites les modifications demandées si nécessaire
- Maintenez votre PR à jour avec la branche principale

## Signalement de Bugs

Utilisez le système d'issues GitHub en incluant :
- Description détaillée du bug
- Étapes pour reproduire
- Comportement attendu vs actuel
- Screenshots si pertinent
- Environnement (OS, navigateur, etc.)

## Suggestions de Fonctionnalités

Pour proposer de nouvelles fonctionnalités :
1. Vérifiez qu'elle n'existe pas déjà
2. Ouvrez une issue avec le label "enhancement"
3. Décrivez clairement la fonctionnalité
4. Expliquez pourquoi elle serait utile

## Questions

Pour toute question :
1. Consultez d'abord la documentation
2. Vérifiez les issues existantes
3. Ouvrez une nouvelle issue avec le label "question"

Merci de contribuer à EduMeet !

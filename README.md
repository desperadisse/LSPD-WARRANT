# LSPD Warrant System

Système de gestion de mandats et réquisitions pour la LSPD et le DOJ, avec authentification Discord et génération de PDF.

## Fonctionnalités

- Création de mandats (perquisition, arrestation, réquisition)
- Approbation/rejet par les juges du DOJ
- Génération de PDF pour les mandats approuvés
- Authentification Discord OAuth avec contrôle d'accès par rôles

## Lancer en local

**Prérequis :** Node.js

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Copier `.env.example` en `.env.local` et remplir les variables :
   ```bash
   cp .env.example .env.local
   ```
3. Lancer l'application :
   ```bash
   npm run dev
   ```

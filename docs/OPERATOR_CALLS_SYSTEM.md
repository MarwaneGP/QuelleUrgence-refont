# Système d'Enregistrement des Appels d'Urgence - Documentation

## Vue d'ensemble

Ce système permet aux opérateurs de ligne d'urgence médicale d'enregistrer les appels des patients/victimes avec toutes les informations pertinentes. Les données sont structurées pour être facilement exploitables et prêtes à être stockées en base de données (Supabase).

## Structure des données

### Types TypeScript

Les types principaux sont définis dans [`types/operator.ts`](../types/operator.ts):

#### `CallerInfo`
```typescript
{
  telephone: string;        // Numéro de téléphone de l'appelant
  nom: string;             // Nom de famille
  prenom: string;          // Prénom
  age: number;             // Âge en années
  sexe: 'homme' | 'femme' | 'autre';
}
```

#### `EmergencyLocation`
```typescript
{
  ville: string;                  // Ville
  adresse_rue_et_num: string;     // Rue et numéro
  adresse_complements?: string;   // Compléments (apt, bâtiment, etc.)
}
```

#### `EventDetails`
```typescript
{
  type_incident: string[];             // Types d'incident (choix multiple)
  service_concerne_hopital: string[];   // Services hospitaliers concernés (choix multiple)
  nombre_personnes: number;             // Nombre de personnes impliquées
  depuis_quand: string;                // Depuis quand / Durée
  details_evenement: string;           // Description détaillée
}
```

#### `VitalAssessment`
```typescript
{
  etat_conscience: string;   // État de conscience
  etat_respiration: string;  // État de respiration
  etat_saignement: string;   // Présence et importance du saignement
  etat_parole: string;       // État de la parole
}
```

#### `OperatorCall`
```typescript
{
  id?: string;              // ID unique (généré par la base de données)
  operatorId: string;       // ID de l'opérateur qui a pris l'appel
  createdAt?: string;       // Timestamp de création
  updatedAt?: string;       // Timestamp de mise à jour
  
  caller: CallerInfo;                    // Informations du patient/appelant
  location: EmergencyLocation;           // Localisation
  event: EventDetails;                   // Détails de l'événement
  vitalAssessment: VitalAssessment;      // Bilan vital
  remarqueGenerale?: string;             // Notes supplémentaires
}
```

## Pages et Composants

### Page: `app/operateur/nouvel-appel/page.tsx`

La page principale pour enregistrer un nouvel appel. Elle utilise le composant `OperatorCallForm` et gère l'envoi des données à l'API.

**URL**: `/operateur/nouvel-appel`

### Composant: `OperatorCallForm`

Composant réutilisable contenant le formulaire complet. Peut être utilisé dans d'autres contextes.

**Localisation**: `components/operateur/OperatorCallForm.tsx`

**Props**:
```typescript
{
  operatorId: string;                    // ID de l'opérateur (requis)
  onSubmit: (data: CreateOperatorCallInput) => Promise<void>;  // Fonction appelée au submit
  onCancel?: () => void;                 // Fonction optionnelle pour annuler
  initialData?: Partial<OperatorCall>;   // Données initiales (pour édition)
  loading?: boolean;                     // État de chargement
  error?: string | null;                 // Message d'erreur externe
  success?: boolean;                     // Statut de succès externe
}
```

**Exemple d'utilisation**:
```tsx
<OperatorCallForm
  operatorId={currentOperatorId}
  onSubmit={async (data) => {
    const response = await fetch('/api/operators/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    // Traiter la réponse
  }}
  loading={loading}
  error={error}
/>
```

## API Endpoints

### POST `/api/operators/calls`

Enregistre un nouvel appel d'urgence.

**Body**:
```typescript
CreateOperatorCallInput {
  operatorId: string;
  caller: CallerInfo;
  location: EmergencyLocation;
  event: EventDetails;
  vitalAssessment: VitalAssessment;
  remarqueGenerale?: string;
}
```

**Réponse (201 - Créé)**:
```json
{
  "id": "CALL-1234567890",
  "success": true,
  "message": "Appel enregistré avec succès",
  "data": {
    "id": "CALL-1234567890",
    "operatorId": "...",
    "caller": { ... },
    "location": { ... },
    "event": { ... },
    "vitalAssessment": { ... },
    "remarqueGenerale": "...",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### GET `/api/operators/calls?operatorId=...`

Récupère les appels d'un opérateur.

**Paramètres**:
- `operatorId` (required): ID de l'opérateur
- `limit` (optional): Nombre de résultats (défaut: 50)

### GET `/api/operators/calls/[id]`

Récupère les détails d'un appel spécifique.

### PATCH `/api/operators/calls/[id]`

Met à jour un appel existant.

### DELETE `/api/operators/calls/[id]`

Supprime un appel.

## Champs du Formulaire

### Types d'Incident
- Malaise
- Traumatisme / chute
- Plaie / saignement
- Brûlure
- Intoxication
- Perte de conscience
- Convulsion
- Dyspnée
- Douleur thoracique
- Accident de la route
- Noyade
- Électrocution
- Allergique
- Autre

### Services Hospitaliers
- Urgences générales
- Cardiologie
- Neurologie
- Traumatologie
- Pédiatrie
- Gynécologie-Obstétrique
- Toxicologie
- Pneumologie
- Gastro-entérologie
- Chirurgie générale

### États de Conscience
- Conscient et lucide
- Confus / désorienté
- Somnolent
- Inconscient
- Réactions aux stimuli

### États de Respiration
- Respiration normale
- Respiration rapide (> 20/min)
- Respiration lente (< 12/min)
- Respiration difficile
- Arrêt respiratoire
- Bruits anormaux

### États de Saignement
- Aucun saignement
- Saignement léger
- Saignement modéré
- Saignement important
- Hémorragie

### États de Parole
- Parole normale
- Parole difficile
- Bégaiement
- Trouble du langage
- Incohérence
- Mutisme

## TODO - Points d'intégration

### Authentification
- [ ] Implémenter la récupération du `operatorId` depuis le contexte d'authentification
- [ ] Ajouter la protection des routes API avec authentification

### Base de Données
- [ ] Connecter Supabase à la route `/api/operators/calls`
- [ ] Créer les tables pour stocker les appels
- [ ] Implémenter les migrations SQL

### Fonctionnalités Futures
- [ ] Créer une page liste des appels pour chaque opérateur
- [ ] Ajouter un système de filtrage et recherche
- [ ] Implémenter la modification d'appels
- [ ] Ajouter des exports (CSV, PDF)
- [ ] Intégrer avec le système de recommandation d'hôpitaux

## Styles

Le formulaire utilise Tailwind CSS pour les classes de base et SCSS pour les styles personnalisés.

**Fichiers SCSS**:
- `app/operateur/nouvel-appel/page.module.scss` - Styles de la page
- `components/operateur/OperatorCallForm.module.scss` - Styles du composant

## Notes de Développement

1. **Validation**: Les champs obligatoires sont marqués avec un astérisque (*) et validés avant l'envoi
2. **Accessibilité**: Tous les éléments du formulaire ont des labels associés correctement
3. **Responsive**: Le formulaire s'adapte aux écrans mobiles (breakpoint: 640px)
4. **Réutilisabilité**: Le composant `OperatorCallForm` peut être utilisé dans d'autres pages (édition, affichage, etc.)
5. **États**: Le formulaire gère les états de chargement, succès et erreur

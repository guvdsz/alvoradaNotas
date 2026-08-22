# Alvorada Notas

Aplicação web para controle de estoque e movimentações do Empório Laticínios
Alvorada.

## Stack

- Next.js 16 com App Router e TypeScript
- React 19 e Tailwind CSS 4
- Firebase Authentication com e-mail e senha
- Cloud Firestore para produtos e movimentações
- Zustand para o estado global de autenticação
- React Hook Form + Zod para formulários e validação

## Configurar o Firebase

1. Crie ou abra um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Em **Configurações do projeto**, registre um aplicativo Web.
3. Em **Authentication → Sign-in method**, habilite **E-mail/senha**.
4. Em **Authentication → Users**, crie o usuário administrador.
5. Em **Firestore Database**, crie o banco em modo de produção.
6. Copie `.env.example` para `.env.local` e preencha a configuração do app Web:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
```

As configurações Web do Firebase são públicas. A segurança dos dados depende do
Firebase Authentication e das regras do Firestore.

## Publicar as regras do Firestore

Copie o conteúdo de `firestore.rules` para **Firestore Database → Rules** no
Firebase Console e publique. Se usar a Firebase CLI:

```bash
npx firebase-tools login
npx firebase-tools use SEU_PROJECT_ID
npx firebase-tools deploy --only firestore:rules
```

As regras incluídas permitem acesso apenas a usuários autenticados, impedem a
exclusão de produtos e tornam as movimentações imutáveis.

## Executar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Organização

```text
src/
├── app/                    # rotas públicas e protegidas
├── components/             # marca e componentes de UI
├── features/
│   ├── auth/               # Firebase Auth, listener e Zustand
│   └── inventory/          # schemas, serviços Firestore, tipos e painel
└── lib/
    ├── firebase/           # configuração e clientes Auth/Firestore
    └── utils/
```

## Modelo de dados

- `products`: cadastro, unidade, preços, estoque atual e estoque mínimo.
- `stockMovements`: histórico imutável de entradas e saídas.

O serviço de movimentação usa uma transação do Firestore: lê o saldo atual,
valida a saída, atualiza o produto e grava o histórico de forma atômica. A chave
de idempotência é usada como ID do documento para impedir lançamentos duplicados.

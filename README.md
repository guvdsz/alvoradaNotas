# Alvorada Notas

Aplicação web para controle de estoque e movimentações do Empório Laticínios
Alvorada.

## Stack

- Next.js 16 com App Router e TypeScript
- React 19 e Tailwind CSS 4
- Firebase Authentication com e-mail e senha
- Cloud Firestore para produtos, categorias e movimentações
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

As regras permitem acesso somente ao UID definido como administrador. Antes de
publicá-las:

1. No Firebase Console, abra **Authentication → Users** e copie o **User UID**
   da conta do administrador.
2. Em `firestore.rules`, substitua exatamente
   `SUBSTITUA_PELO_UID_DO_ADMINISTRADOR` pelo UID copiado, mantendo as aspas.
3. Copie o conteúdo do arquivo para **Firestore Database → Rules** no Firebase
   Console e clique em **Publicar**.

Enquanto o placeholder não for substituído, nenhuma conta real terá acesso ao
Firestore. Para publicar pela Firebase CLI depois de alterar o arquivo:

```bash
npx firebase-tools@latest login
npx firebase-tools@latest deploy --only firestore:rules --project SEU_PROJECT_ID
```

O mesmo UID controla todas as coleções porque a aplicação possui apenas um
usuário. Visitantes e outras contas autenticadas ficam sem permissão de leitura
ou escrita.

## Executar localmente

Use Node.js 22.12 ou mais recente.

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
npm run typecheck
npm run test
npm run build
npm run start
npm run check
```

## Validação antes de publicar

```bash
npm ci
npm run check
```

Os testes Vitest cobrem validações de produto e movimentação, aritmética de
estoque, valor sugerido de venda, idempotência e invariantes das transações.
Antes de entregar uma versão para teste, valide também no navegador e em um
celular real:

- login, logout e retorno após recarregar a página;
- criação, edição e exclusão de categorias e produtos;
- entradas e saídas para cada unidade de controle;
- bloqueio de saída acima da quantidade disponível;
- atualização do estoque, histórico, dashboard e financeiro;
- perda e recuperação da conexão durante uma operação.

## Publicar na Netlify

O arquivo `netlify.toml` configura o build com Node.js 22, executa
`npm run build`, publica `.next` e habilita a proteção contra incompatibilidade
entre versões durante novos deploys. A Netlify usa seu suporte nativo ao Next.js;
este projeto não precisa ser convertido em exportação estática.

1. Envie o repositório para o GitHub e importe-o em
   [app.netlify.com](https://app.netlify.com/).
2. Em **Project configuration → Environment variables**, cadastre as seis
   variáveis `NEXT_PUBLIC_FIREBASE_*` listadas em `.env.example`. Não as marque
   como secretas: por definição, essas configurações públicas entram no bundle
   enviado ao navegador. O `netlify.toml` já exclui somente essas seis chaves
   públicas da varredura de valores expostos, mantendo a proteção ativa para
   qualquer segredo verdadeiro.
3. Inicie o deploy e teste a URL principal terminada em `netlify.app`.
4. No Firebase Console, adicione exatamente esse domínio em
   **Authentication → Settings → Authorized domains**. Se testar um Deploy
   Preview em outro domínio, autorize também o domínio exato desse preview.
5. Publique as regras do Firestore separadamente com o comando da seção
   anterior; o deploy da Netlify não publica regras do Firebase.

As variáveis `NEXT_PUBLIC_*` fazem parte do aplicativo Web e chegam ao navegador.
Nunca coloque conta de serviço, chave privada ou credenciais do Firebase Admin
nessas variáveis nem no repositório.

## Uso no celular

O projeto inclui um manifesto para execução em modo standalone e pode ser
adicionado à tela inicial em navegadores compatíveis. Ele continua dependendo de
internet para autenticação e acesso ao Firestore; não há sincronização offline ou
service worker neste momento.

## Organização

```text
src/
├── app/                    # rotas públicas e protegidas
├── components/             # marca e componentes de UI
├── features/
│   ├── auth/               # Firebase Auth, listener e Zustand
│   ├── categories/         # CRUD de categorias
│   ├── dashboard/          # resumo do estoque
│   ├── finance/            # indicadores calculados a partir das saídas
│   ├── movements/          # entradas, saídas e histórico
│   └── products/           # cadastro e consulta de produtos
└── lib/
    ├── firebase/           # configuração e clientes Auth/Firestore
    └── utils/
```

## Modelo de dados

- `categories`: categorias reutilizadas pelos produtos.
- `products`: cadastro, unidade, preço, estoque atual e estoque mínimo.
- `stockMovements`: histórico de entradas e saídas. A interface apenas cria e
  consulta esses registros.

O serviço de movimentação usa uma transação do Firestore: lê a quantidade atual,
valida a saída, atualiza o produto e grava o histórico de forma atômica. A chave
de idempotência é usada como ID do documento para impedir lançamentos duplicados.

## Módulos disponíveis

- Autenticação com o único usuário administrador.
- Dashboard com indicadores do Firestore.
- Produtos: listagem, busca, cadastro, edição e exclusão.
- Categorias: cadastro, edição e exclusão com proteção para categorias em uso.
- Movimentações: entradas, saídas, validação de estoque e histórico.
- Financeiro: faturamento e indicadores derivados das saídas com valor de venda.

Mesmo com apenas um usuário, o Firestore exige regras para não deixar o banco
público. A seção de publicação explica como vincular todo o acesso ao UID do
administrador.

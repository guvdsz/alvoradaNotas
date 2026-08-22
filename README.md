# Alvorada Estoque

Base web para o controle de estoque e movimentações do Empório Laticínios
Alvorada.

## Stack

- Next.js 16 com App Router e TypeScript
- React 19
- Tailwind CSS 4
- Supabase Auth e PostgreSQL
- Zustand para estado global no cliente
- React Hook Form + Zod para formulários e validação
- Lucide React para ícones

## Executar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Preencha o `.env.local` com a URL e a chave publicável encontradas nas
configurações do projeto Supabase.

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

Depois, abra [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # desenvolvimento
npm run lint     # ESLint
npm run build    # build de produção e verificação de tipos
npm run start    # executa o build de produção
```

## Organização

```text
src/
├── app/
│   ├── (auth)/login/       # rotas públicas de autenticação
│   ├── (protected)/        # shell e páginas autenticadas
│   ├── globals.css
│   ├── layout.tsx
│   └── manifest.ts
├── actions/                # Server Actions validadas no servidor
├── components/             # componentes globais e UI
├── features/
│   ├── auth/               # formulário e store Zustand
│   └── inventory/          # componentes, serviços e tipos do estoque
└── lib/
    ├── auth/               # verificação de sessão
    ├── schemas/            # schemas Zod
    ├── supabase/           # clientes browser, servidor e proxy
    └── utils/
```

## Estado atual

- Login com Supabase pronto para receber as credenciais.
- Sessão SSR renovada pelo `src/proxy.ts`.
- Rotas protegidas verificam o usuário no servidor.
- Dashboard responsivo criado com a identidade visual do empório.
- Manifesto web, ícones e metadados básicos configurados.
- Camada inicial de estoque tipada e preparada para o futuro schema SQL.

O próximo passo é criar as tabelas, políticas RLS e a função PostgreSQL
transacional responsável por registrar entradas, saídas, ajustes e estornos.

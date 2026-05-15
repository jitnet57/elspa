This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## 라우팅 핵심설계
frontend/
├─ app/                      # 라우팅 핵심 (절대 건드리지 않는 영역)
│  ├─ layout.tsx
│  ├─ page.tsx              # 홈
│  ├─ (auth)/
│  │   ├─ login/
│  │   │   └─ page.tsx
│  │   └─ register/
│  │       └─ page.tsx
│  ├─ dashboard/
│  │   ├─ layout.tsx
│  │   ├─ page.tsx
│  │   └─ settings/
│  │       └─ page.tsx
│  └─ api/                  # route handlers (있으면)
│
├─ components/              # UI 컴포넌트 (재사용)
│  ├─ ui/                   # 버튼, input 같은 base
│  ├─ layout/              # header, sidebar
│  └─ common/              # 도메인 무관 공용
│
├─ features/               # ⭐ 핵심 (비즈니스 단위)
│  ├─ auth/
│  │   ├─ api.ts
│  │   ├─ hooks.ts
│  │   ├─ types.ts
│  │   └─ components/
│  ├─ cruise/
│  └─ booking/
│
├─ lib/                    # 공통 로직
│  ├─ fetcher.ts
│  ├─ utils.ts
│  └─ constants.ts
│
├─ hooks/                  # 전역 hooks
│
├─ store/                  # Zustand / Redux
│
├─ services/              # API layer (axios, fetch wrapper)
│
├─ styles/
│  └─ globals.css
│
├─ public/
├─ middleware.ts
└─ next.config.js
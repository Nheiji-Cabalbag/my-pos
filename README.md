# Personal POS + Inventory

## 1. Create the project and add these files
```bash
npx create-next-app@latest pos --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd pos
npm i @supabase/supabase-js
npx shadcn@latest init
npx shadcn@latest add button input dialog alert-dialog
```
Copy this folder's `app/`, `components/` (keep the generated `components/ui/`), `lib/`, `supabase/` and `.env.example` into the new project, replacing `app/layout.tsx` and `app/page.tsx`. Keep the generated `app/globals.css`.

## 2. Supabase
1. Create a project at supabase.com.
2. SQL Editor: paste and run `supabase/schema.sql` (tables, `checkout()` function, storage bucket, RLS).
3. Authentication > Users > Add user (your email + password). Turn off public sign-ups in Auth settings.
4. Project Settings > API: copy the Project URL and the **anon** key.

## 3. Local
```bash
cp .env.example .env.local   # fill in URL and anon key
npm run dev
npm run build                # must pass before deploying
```

## 4. GitHub + Vercel
1. Push to a GitHub repo (`.env.local` is gitignored by default).
2. vercel.com > Add New Project > import the repo.
3. Add env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then Deploy.
4. Test: add/edit/delete a product, upload an image, make a sale, refresh the page.

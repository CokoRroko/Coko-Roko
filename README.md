# CoKo Rroco

## Nisja lokale
1. Krijo projekt falas në https://supabase.com
2. SQL Editor → ngjit të gjithë `supabase/schema.sql` → Run
3. Settings → API → kopjo Project URL dhe anon key
4. `cp .env.example .env.local` dhe plotëso dy vlerat
5. `npm install && npm run dev` → http://localhost:3000

## Publikimi në internet (Vercel, falas)
1. Ngarko dosjen në GitHub (`git init`, `git add .`, `git commit`, `git push`)
2. Në https://vercel.com → Add New Project → zgjidh repo-n → Environment Variables: shto `NEXT_PUBLIC_SUPABASE_URL` dhe `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Deploy
3. Supabase → Authentication → URL Configuration: vendos URL-në e Vercel te "Site URL"
4. (Opsionale) Supabase → Authentication → Providers → Email: çaktivizo "Confirm email" për test të shpejtë
5. (Opsionale) Vercel → Settings → Domains: lidh domenin tënd (p.sh. cokorroco.com)

## Kufizime për t'u rritur
- Supabase falas: 1 GB storage, 50 MB për skedar → për shumë përdorues kalo në plan Pro ose përdor Cloudflare Stream/Mux për video.
- Feed-i ngarkon 30 videot e fundit (pa faqosje/algoritëm rekomandimi).

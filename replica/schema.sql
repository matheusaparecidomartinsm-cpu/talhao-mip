-- replica/schema.sql — clone do Plantix (soja / Talhão)
-- Postgres 15+ no Supabase. Acesso: Row Level Security em toda tabela.
-- Convenções: uuid PK, timestamptz UTC, owner = user_id -> auth.users.

create extension if not exists pgcrypto;

-- ─── helpers ──────────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ─── usuários ─────────────────────────────────────────────────────────
-- Todo visitante ganha sessão anônima do Supabase (convidado), então
-- sempre existe auth.uid(). Ao criar conta, o anônimo é "promovido".
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  language text not null default 'pt-BR',
  municipio_ibge char(7),                 -- localização só no nível do município (privacidade)
  uf char(2),
  lat numeric(8,5),                       -- arredondado ~1 km, usado para clima
  lng numeric(8,5),
  role text not null default 'farmer'
    check (role in ('farmer','expert','moderator','admin')),
  notify_alerts boolean not null default true,
  notify_answers boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on profiles (municipio_ibge);
create trigger profiles_updated before update on profiles
  for each row execute function set_updated_at();

create table experts (
  user_id uuid primary key references profiles(id) on delete cascade,
  credential text not null,               -- ex.: "Eng. Agrônomo CREA-PR 12345" ou "Aluno Agronomia Univel"
  verified_by uuid references profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger experts_updated before update on experts
  for each row execute function set_updated_at();

-- ─── catálogo (conteúdo próprio, editado por admin) ───────────────────
create table crops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,              -- 'soja'
  name text not null,
  scientific_name text,
  eppo_code text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger crops_updated before update on crops
  for each row execute function set_updated_at();

create table user_crops (
  user_id uuid not null references profiles(id) on delete cascade,
  crop_id uuid not null references crops(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, crop_id)
);
create index on user_crops (crop_id);

create table problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,              -- 'ferrugem-asiatica'
  agent_type text not null
    check (agent_type in ('fungo','bacteria','virus','nematoide','inseto','acaro','deficiencia','outro')),
  common_name text not null,
  scientific_name text,
  eppo_code text,
  summary text[] not null default '{}',   -- tópicos curtos do topo da ficha
  symptoms text not null default '',
  cause text not null default '',
  preventive_measures text[] not null default '{}',
  visual_cues text not null default '',   -- descrição usada no prompt do diagnóstico
  sources text[] not null default '{}',   -- referências (Embrapa etc.)
  status text not null default 'draft' check (status in ('draft','review','published')),
  reviewed_by uuid references profiles(id) on delete set null,
  search tsvector generated always as (
    to_tsvector('portuguese', coalesce(common_name,'') || ' ' || coalesce(scientific_name,'') || ' ' || coalesce(symptoms,''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on problems (agent_type);
create index on problems (status);
create index on problems using gin (search);
create trigger problems_updated before update on problems
  for each row execute function set_updated_at();

create table problem_crops (
  problem_id uuid not null references problems(id) on delete cascade,
  crop_id uuid not null references crops(id) on delete cascade,
  stages text[] not null default '{}',    -- estádios em que ocorre (ex.: R1..R6)
  primary key (problem_id, crop_id)
);
create index on problem_crops (crop_id);

create table problem_images (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references problems(id) on delete cascade,
  storage_path text not null,             -- bucket 'library' (público)
  caption text,
  license text not null,                  -- 'proprio', 'CC-BY 4.0 — autor' ...
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on problem_images (problem_id, sort);
create trigger problem_images_updated before update on problem_images
  for each row execute function set_updated_at();

create table treatments (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references problems(id) on delete cascade,
  kind text not null check (kind in ('organico','quimico','biologico','cultural')),
  text text not null,
  active_ingredient text,                 -- só para quimico/biologico; sem dose
  moa_group text,                         -- grupo FRAC/IRAC
  agrofit_url text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on treatments (problem_id, kind, sort);
create trigger treatments_updated before update on treatments
  for each row execute function set_updated_at();

-- ─── diagnóstico (loop central) ───────────────────────────────────────
create table diagnoses (
  id uuid primary key,                    -- gerado no cliente → idempotente na fila offline
  user_id uuid not null references profiles(id) on delete cascade,
  crop_id uuid not null references crops(id) on delete restrict,
  image_path text not null,               -- bucket 'diagnoses' (privado): {user_id}/{id}.jpg
  municipio_ibge char(7),
  status text not null default 'pending'
    check (status in ('pending','ok','not_identified','bad_image','wrong_crop','not_plant','healthy','failed')),
  model text,                             -- ex.: 'claude-haiku-5-5'
  raw_response jsonb,                     -- guardado para avaliar acurácia
  latency_ms int,
  user_feedback text check (user_feedback in ('correct','wrong')),
  captured_at timestamptz not null,       -- hora da foto (pode ser antes do envio, offline)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on diagnoses (user_id, created_at desc);
create index on diagnoses (crop_id);
create index on diagnoses (municipio_ibge, created_at desc);
create index on diagnoses (status);
create trigger diagnoses_updated before update on diagnoses
  for each row execute function set_updated_at();

create table diagnosis_candidates (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references diagnoses(id) on delete cascade,
  problem_id uuid not null references problems(id) on delete restrict,
  probability numeric(4,3) not null check (probability between 0 and 1),
  rank smallint not null check (rank between 1 and 5),
  reasoning text,                         -- sinais que o modelo viu (mostrado ao usuário)
  created_at timestamptz not null default now(),
  unique (diagnosis_id, rank),
  unique (diagnosis_id, problem_id)
);
create index on diagnosis_candidates (problem_id);

-- ─── comunidade ───────────────────────────────────────────────────────
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  crop_id uuid not null references crops(id) on delete restrict,
  diagnosis_id uuid references diagnoses(id) on delete set null,
  title text not null check (char_length(title) between 5 and 140),
  body text not null default '' check (char_length(body) <= 4000),
  image_paths text[] not null default '{}' check (cardinality(image_paths) <= 4), -- bucket 'community' (público)
  municipio_ibge char(7),
  status text not null default 'published' check (status in ('published','hidden','removed')),
  answers_count int not null default 0,
  likes_count int not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on posts (user_id);
create index on posts (crop_id, last_activity_at desc);
create index on posts (diagnosis_id);
create index on posts (status, last_activity_at desc);
create trigger posts_updated before update on posts
  for each row execute function set_updated_at();

create table answers (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 4000),
  is_expert boolean not null default false,   -- copiado do papel no momento da resposta
  status text not null default 'published' check (status in ('published','hidden','removed')),
  likes_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on answers (post_id, created_at);
create index on answers (user_id);
create trigger answers_updated before update on answers
  for each row execute function set_updated_at();

create table likes (
  user_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','answer')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)   -- curtir duas vezes é impossível
);
create index on likes (target_type, target_id);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','answer')),
  target_id uuid not null,
  reason text not null check (reason in ('spam','ofensivo','recomendacao_perigosa','outro')),
  note text,
  status text not null default 'open' check (status in ('open','actioned','dismissed')),
  resolved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index on reports (status, created_at);
create trigger reports_updated before update on reports
  for each row execute function set_updated_at();

-- contadores mantidos no banco (não no cliente)
create or replace function bump_counts() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'answers' then
    update posts set answers_count = answers_count + case when tg_op='INSERT' then 1 else -1 end,
                     last_activity_at = now()
     where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'likes' then
    if coalesce(new.target_type, old.target_type) = 'post' then
      update posts set likes_count = likes_count + case when tg_op='INSERT' then 1 else -1 end
       where id = coalesce(new.target_id, old.target_id);
    else
      update answers set likes_count = likes_count + case when tg_op='INSERT' then 1 else -1 end
       where id = coalesce(new.target_id, old.target_id);
    end if;
  end if;
  return null;
end $$;
create trigger answers_count after insert or delete on answers for each row execute function bump_counts();
create trigger likes_count  after insert or delete on likes   for each row execute function bump_counts();

-- ─── alertas e clima ──────────────────────────────────────────────────
create table alert_rules (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references problems(id) on delete cascade,
  crop_id uuid not null references crops(id) on delete cascade,
  temp_min numeric(4,1),
  temp_max numeric(4,1),
  min_rain_days smallint,                 -- dias com chuva/umidade nos próximos 5
  min_humidity smallint,
  min_local_diagnoses smallint,           -- diagnósticos confirmados no município em 14 dias
  risk_level text not null check (risk_level in ('medio','alto')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on alert_rules (problem_id);
create index on alert_rules (crop_id);
create trigger alert_rules_updated before update on alert_rules
  for each row execute function set_updated_at();

create table disease_alerts (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references alert_rules(id) on delete set null,
  problem_id uuid not null references problems(id) on delete cascade,
  crop_id uuid not null references crops(id) on delete cascade,
  municipio_ibge char(7) not null,
  risk_level text not null check (risk_level in ('medio','alto')),
  reason text not null,                   -- "5 dias de chuva + 22 °C + 3 casos na região"
  valid_from date not null,
  valid_to date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_range check (valid_to >= valid_from),
  unique (problem_id, municipio_ibge, valid_from)   -- job pode rodar 2x sem duplicar
);
create index on disease_alerts (municipio_ibge, valid_to desc);
create index on disease_alerts (crop_id);
create trigger disease_alerts_updated before update on disease_alerts
  for each row execute function set_updated_at();

create table weather_cache (
  municipio_ibge char(7) primary key,
  forecast jsonb not null,                -- resposta normalizada do Open-Meteo
  fetched_at timestamptz not null default now()
);

-- ─── cultivo ──────────────────────────────────────────────────────────
create table crop_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  crop_id uuid not null references crops(id) on delete restrict,
  name text not null default 'Talhão 1',
  sowing_date date not null,
  area_ha numeric(10,2) check (area_ha > 0),
  status text not null default 'active' check (status in ('active','harvested','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on crop_plans (user_id, status);
create index on crop_plans (crop_id);
create trigger crop_plans_updated before update on crop_plans
  for each row execute function set_updated_at();

create table crop_stage_tips (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references crops(id) on delete cascade,
  stage text not null,                    -- 'VE','V3','R1','R5.1'...
  day_from smallint not null,             -- dias após semeadura (aproximado)
  day_to smallint not null,
  title text not null,
  tip text not null,
  problem_ids uuid[] not null default '{}', -- o que monitorar nesta fase
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stage_range check (day_to >= day_from)
);
create index on crop_stage_tips (crop_id, day_from);
create trigger crop_stage_tips_updated before update on crop_stage_tips
  for each row execute function set_updated_at();

create table fertilizer_rules (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references crops(id) on delete cascade,
  nutrient text not null check (nutrient in ('N','P2O5','K2O','S','B','Mo','Co')),
  kg_per_ha_min numeric(7,2) not null,
  kg_per_ha_max numeric(7,2) not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dose_range check (kg_per_ha_max >= kg_per_ha_min),
  unique (crop_id, nutrient)
);
create trigger fertilizer_rules_updated before update on fertilizer_rules
  for each row execute function set_updated_at();

-- ─── notificações ─────────────────────────────────────────────────────
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on push_subscriptions (user_id);
create trigger push_subscriptions_updated before update on push_subscriptions
  for each row execute function set_updated_at();

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('alert','answer','diagnosis_ready','system')),
  ref_id uuid,                            -- alert, post ou diagnosis
  title text not null,
  body text not null,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, ref_id)          -- mesmo alerta nunca notifica 2x
);
create index on notifications (user_id, created_at desc);
create index on notifications (sent_at) where sent_at is null;
create trigger notifications_updated before update on notifications
  for each row execute function set_updated_at();

-- ─── papel do usuário (para RLS) ──────────────────────────────────────
create or replace function my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

-- ─── Row Level Security ───────────────────────────────────────────────
alter table profiles            enable row level security;
alter table experts             enable row level security;
alter table crops               enable row level security;
alter table user_crops          enable row level security;
alter table problems            enable row level security;
alter table problem_crops       enable row level security;
alter table problem_images      enable row level security;
alter table treatments          enable row level security;
alter table diagnoses           enable row level security;
alter table diagnosis_candidates enable row level security;
alter table posts               enable row level security;
alter table answers             enable row level security;
alter table likes               enable row level security;
alter table reports             enable row level security;
alter table alert_rules         enable row level security;
alter table disease_alerts      enable row level security;
alter table weather_cache       enable row level security;
alter table crop_plans          enable row level security;
alter table crop_stage_tips     enable row level security;
alter table fertilizer_rules    enable row level security;
alter table push_subscriptions  enable row level security;
alter table notifications       enable row level security;

-- perfil: dono lê/edita o seu; nome e papel são públicos via view
create policy own_profile_select on profiles for select using (id = auth.uid());
create policy own_profile_update on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = my_role()); -- não se auto-promove (função security definer evita recursão de RLS)
create policy own_profile_insert on profiles for insert with check (id = auth.uid() and role = 'farmer');

create view public_profiles with (security_invoker = false) as
  select id, display_name, role from profiles;

create policy experts_read on experts for select using (true);
create policy experts_admin on experts for all using (my_role() = 'admin') with check (my_role() = 'admin');

-- catálogo: leitura pública do que está publicado; escrita só admin
create policy crops_read on crops for select using (is_active or my_role() = 'admin');
create policy crops_admin on crops for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy problems_read on problems for select using (status = 'published' or my_role() in ('admin','expert'));
create policy problems_admin on problems for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy problem_crops_read on problem_crops for select using (true);
create policy problem_crops_admin on problem_crops for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy problem_images_read on problem_images for select using (true);
create policy problem_images_admin on problem_images for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy treatments_read on treatments for select using (true);
create policy treatments_admin on treatments for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy crop_stage_tips_read on crop_stage_tips for select using (true);
create policy crop_stage_tips_admin on crop_stage_tips for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy fertilizer_rules_read on fertilizer_rules for select using (true);
create policy fertilizer_rules_admin on fertilizer_rules for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy alert_rules_admin on alert_rules for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy disease_alerts_read on disease_alerts for select using (true);
-- weather_cache e escrita de disease_alerts/notifications: só service role (jobs), sem policy

-- dados do próprio usuário
create policy user_crops_own on user_crops for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy crop_plans_own on crop_plans for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_own on push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_own_read on notifications for select using (user_id = auth.uid());
create policy notif_own_mark on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- diagnóstico: dono lê; criação e resultado passam pela rota do servidor (service role)
create policy diag_own_read on diagnoses for select using (user_id = auth.uid());
create policy diag_own_feedback on diagnoses for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cand_own_read on diagnosis_candidates for select
  using (exists (select 1 from diagnoses d where d.id = diagnosis_id and d.user_id = auth.uid()));

-- comunidade: leitura pública do publicado; escrever exige conta não anônima
create policy posts_read on posts for select using (status = 'published' or user_id = auth.uid() or my_role() in ('moderator','admin'));
create policy posts_insert on posts for insert with check (
  user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy posts_update_own on posts for update using (user_id = auth.uid() or my_role() in ('moderator','admin'));
create policy posts_delete_own on posts for delete using (user_id = auth.uid());

create policy answers_read on answers for select using (status = 'published' or user_id = auth.uid() or my_role() in ('moderator','admin'));
create policy answers_insert on answers for insert with check (
  user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy answers_update_own on answers for update using (user_id = auth.uid() or my_role() in ('moderator','admin'));
create policy answers_delete_own on answers for delete using (user_id = auth.uid());

create policy likes_read on likes for select using (true);
create policy likes_own on likes for insert with check (user_id = auth.uid());
create policy likes_del on likes for delete using (user_id = auth.uid());

create policy reports_insert on reports for insert with check (reporter_id = auth.uid());
create policy reports_mod on reports for select using (reporter_id = auth.uid() or my_role() in ('moderator','admin'));
create policy reports_resolve on reports for update using (my_role() in ('moderator','admin'));

-- ─── Storage (Supabase) ───────────────────────────────────────────────
-- buckets: 'diagnoses' privado (pasta = user_id), 'community' público, 'library' público.
-- limite 5 MB, só image/jpeg e image/webp (configurado no bucket).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('diagnoses','diagnoses', false, 5242880, array['image/jpeg','image/webp']),
  ('community','community', true,  5242880, array['image/jpeg','image/webp']),
  ('library',  'library',   true,  5242880, array['image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy diag_upload_own on storage.objects for insert to authenticated
  with check (bucket_id = 'diagnoses' and (storage.foldername(name))[1] = auth.uid()::text);
create policy diag_read_own on storage.objects for select to authenticated
  using (bucket_id = 'diagnoses' and (storage.foldername(name))[1] = auth.uid()::text);
create policy community_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);
create policy community_read on storage.objects for select using (bucket_id = 'community');
create policy library_read on storage.objects for select using (bucket_id = 'library');

-- ─── seed mínimo ──────────────────────────────────────────────────────
insert into crops (slug, name, scientific_name, eppo_code, icon)
values ('soja', 'Soja', 'Glycine max', 'GLXMA', 'soja')
on conflict (slug) do nothing;

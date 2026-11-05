-- Lista do teste (beta). Só inclusão pelo servidor; ninguém lê pela API pública.
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('produtor','tecnico','estudante','outro')),
  municipio_ibge char(7),
  consent boolean not null check (consent),       -- aceitou receber o aviso
  source text not null default 'sobre',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_formato check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  unique (email)
);
create trigger waitlist_updated before update on waitlist for each row execute function set_updated_at();
alter table waitlist enable row level security;
revoke all on waitlist from anon, authenticated;   -- só service role

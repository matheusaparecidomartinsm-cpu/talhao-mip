-- Testes das regras de acesso. Cada bloco falha com exception se algo vazar.
\set ON_ERROR_STOP 1
-- usuários: A (conta), B (conta), C (convidado anônimo)
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'a@teste.local'), ('00000000-0000-0000-0000-00000000000b', 'b@teste.local');
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-00000000000c', true);
update profiles set display_name = 'Ana', municipio_ibge = '4104808' where id = '00000000-0000-0000-0000-00000000000a';

-- dados de A criados pelo servidor (service role = superusuário aqui)
insert into diagnoses (id, user_id, crop_id, image_path, status, captured_at)
  select '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a', id, '00000000-0000-0000-0000-00000000000a/1.jpg', 'ok', now() from crops where slug = 'soja';
insert into diagnosis_candidates (diagnosis_id, problem_id, probability, rank)
  select '11111111-1111-1111-1111-111111111111', id, 0.8, 1 from problems where slug = 'ferrugem-asiatica';
insert into crop_plans (user_id, crop_id, sowing_date) select '00000000-0000-0000-0000-00000000000a', id, current_date - 60 from crops where slug = 'soja';
insert into notifications (user_id, kind, title, body) values ('00000000-0000-0000-0000-00000000000a', 'system', 't', 'b');
insert into storage.objects (bucket_id, name) values ('diagnoses', '00000000-0000-0000-0000-00000000000a/1.jpg');

create function pg_temp.as_user(uid text, anon boolean default false) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid, false);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'is_anonymous', anon)::text, false);
  execute 'set role authenticated';
end $$;

-- ── B não vê nada de A ──
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$ begin
  if (select count(*) from diagnoses) <> 0 then raise exception 'B viu diagnóstico de A'; end if;
  if (select count(*) from diagnosis_candidates) <> 0 then raise exception 'B viu candidatos de A'; end if;
  if (select count(*) from crop_plans) <> 0 then raise exception 'B viu plano de A'; end if;
  if (select count(*) from notifications) <> 0 then raise exception 'B viu notificação de A'; end if;
  if (select count(*) from profiles) <> 1 then raise exception 'B viu outros perfis'; end if;
  if (select count(*) from storage.objects where bucket_id = 'diagnoses') <> 0 then raise exception 'B viu foto de A'; end if;
  if (select count(*) from job_runs) + (select count(*) from weather_cache) <> 0 then raise exception 'B viu tabela interna'; end if;
  update diagnoses set user_feedback = 'wrong';            -- 0 linhas, sem erro
  if (select count(*) from problems where status = 'published') < 12 then raise exception 'catálogo não está público'; end if;
  raise notice 'ok: B não vê dados de A; catálogo público';
end $$;
-- B não pode subir foto na pasta de A
do $$ begin
  begin insert into storage.objects (bucket_id, name) values ('diagnoses', '00000000-0000-0000-0000-00000000000a/x.jpg');
        raise exception 'B subiu na pasta de A';
  exception when insufficient_privilege then raise notice 'ok: upload na pasta alheia bloqueado'; end;
end $$;
-- B não cria diagnóstico nem se promove
do $$ begin
  begin insert into diagnoses (id, user_id, crop_id, image_path, captured_at) select gen_random_uuid(), auth.uid(), id, 'x', now() from crops limit 1;
        raise exception 'cliente criou diagnóstico';
  exception when insufficient_privilege then raise notice 'ok: diagnóstico só pelo servidor'; end;
  begin update profiles set role = 'admin' where id = auth.uid(); raise exception 'B virou admin';
  exception when insufficient_privilege then raise notice 'ok: não se autopromove'; end;
  update profiles set display_name = 'Bruno' where id = auth.uid();
end $$;
-- B posta; o banco preenche autor/contadores mesmo se o cliente tentar forjar
insert into posts (user_id, crop_id, title, body, likes_count, answers_count, status)
  select auth.uid(), id, 'Manchas nas folhas', 'texto', 999, 999, 'hidden' from crops where slug = 'soja';
do $$ declare p posts; begin
  select * into p from posts limit 1;
  if p.likes_count <> 0 or p.answers_count <> 0 or p.status <> 'published' or p.author_name <> 'Bruno' then raise exception 'post forjado: %', row_to_json(p); end if;
  raise notice 'ok: post com autor e contadores do banco';
end $$;
-- B não posta em nome de A
do $$ begin
  begin insert into posts (user_id, crop_id, title) select '00000000-0000-0000-0000-00000000000a', id, 'Falso post' from crops limit 1;
        raise exception 'B postou como A';
  exception when insufficient_privilege then raise notice 'ok: não posta em nome de outro'; end;
end $$;
reset role;

-- ── convidado anônimo C lê, mas não escreve na comunidade ──
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', true);
do $$ begin
  if (select count(*) from posts) <> 1 then raise exception 'convidado não lê a comunidade'; end if;
  begin insert into posts (user_id, crop_id, title) select auth.uid(), id, 'Pergunta anônima' from crops limit 1;
        raise exception 'anônimo postou';
  exception when insufficient_privilege then raise notice 'ok: convidado lê, mas precisa de conta para postar'; end;
end $$;
reset role;

-- ── A responde, curte; contador sobe; curtida dupla bloqueada; selo não é forjável ──
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into answers (post_id, user_id, body, is_expert) select id, auth.uid(), 'Parece ferrugem', true from posts limit 1;
insert into likes (user_id, target_type, target_id) select auth.uid(), 'post', id from posts limit 1;
do $$ begin
  if (select answers_count from posts limit 1) <> 1 or (select likes_count from posts limit 1) <> 1 then raise exception 'contadores errados'; end if;
  if (select is_expert from answers limit 1) then raise exception 'selo de especialista forjado'; end if;
  begin insert into likes (user_id, target_type, target_id) select auth.uid(), 'post', id from posts limit 1; raise exception 'curtiu 2x';
  exception when unique_violation then raise notice 'ok: curtida dupla bloqueada, contadores certos, selo não forjável'; end;
  update diagnoses set user_feedback = 'correct';
  if (select user_feedback from diagnoses) <> 'correct' then raise exception 'dono não deu feedback'; end if;
  begin update diagnoses set status = 'failed'; raise exception 'dono alterou status';
  exception when insufficient_privilege then raise notice 'ok: dono só altera o feedback'; end;
end $$;
reset role;

-- ── excluir a conta apaga tudo de A ──
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  if (select count(*) from diagnoses) + (select count(*) from crop_plans) + (select count(*) from notifications) + (select count(*) from answers) <> 0
    then raise exception 'sobrou dado de A'; end if;
  raise notice 'ok: excluir conta apaga diagnósticos, plano, notificações e respostas';
end $$;
\echo TODOS OS TESTES DE ACESSO PASSARAM

-- ── lista do teste: ninguém lê nem grava pela API pública ──
\i waitlist_check.sql

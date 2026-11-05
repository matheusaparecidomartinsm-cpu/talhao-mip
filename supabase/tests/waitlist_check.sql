insert into waitlist (email, role, consent) values ('a@teste.local', 'produtor', true);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$ begin
  begin perform count(*) from waitlist; raise exception 'usuário leu a lista';
  exception when insufficient_privilege then raise notice 'ok: lista do teste não é legível'; end;
  begin insert into waitlist (email, role, consent) values ('x@teste.local','outro',true); raise exception 'usuário gravou na lista';
  exception when insufficient_privilege then raise notice 'ok: lista só pelo servidor'; end;
end $$;
reset role;
\echo LISTA DO TESTE OK

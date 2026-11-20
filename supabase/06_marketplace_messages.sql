-- Marketplace: private buyer/seller conversations and simple order tracking.
-- Only the two people in a conversation can read it. All changes go through the functions below,
-- so nobody can skip steps (for example mark their own purchase as shipped).

create table if not exists public.mk_threads (
  id uuid primary key default gen_random_uuid(),
  seller uuid not null references auth.users(id) on delete cascade,
  buyer uuid not null references auth.users(id) on delete cascade,
  listing_id text not null,
  car text not null default '',
  ask numeric(10,2),
  offer numeric(10,2),
  status text not null default 'open' check (status in ('open','offered','accepted','declined','paid','shipped','received','cancelled')),
  carrier text,
  tracking text,
  last_msg text not null default '',
  last_at timestamptz not null default now(),
  last_by uuid,
  seller_read timestamptz not null default now(),
  buyer_read timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, seller, buyer),
  check (seller <> buyer)
);
create index if not exists mk_threads_seller on public.mk_threads (seller, last_at desc);
create index if not exists mk_threads_buyer on public.mk_threads (buyer, last_at desc);

create table if not exists public.mk_messages (
  id bigserial primary key,
  thread_id uuid not null references public.mk_threads(id) on delete cascade,
  sender uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'msg' check (kind in ('msg','event')),
  body text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists mk_messages_thread on public.mk_messages (thread_id, id);
create index if not exists mk_messages_sender on public.mk_messages (sender, created_at desc);

alter table public.mk_threads enable row level security;
alter table public.mk_messages enable row level security;

drop policy if exists mk_threads_read on public.mk_threads;
create policy mk_threads_read on public.mk_threads for select to authenticated
  using ((select auth.uid()) in (seller, buyer));
drop policy if exists mk_messages_read on public.mk_messages;
create policy mk_messages_read on public.mk_messages for select to authenticated
  using (exists (select 1 from public.mk_threads t where t.id = thread_id and (select auth.uid()) in (t.seller, t.buyer)));

revoke all on public.mk_threads, public.mk_messages from anon;
revoke insert, update, delete on public.mk_threads, public.mk_messages from authenticated;
grant select on public.mk_threads, public.mk_messages to authenticated;

-- internal: add a line to the conversation and bump the thread
create or replace function public.mk_post(p_thread uuid, p_sender uuid, p_kind text, p_body text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into mk_messages (thread_id, sender, kind, body) values (p_thread, p_sender, p_kind, left(p_body, 1000));
  update mk_threads set last_msg = left(p_body, 140), last_at = now(), last_by = p_sender,
    seller_read = case when seller = p_sender then now() else seller_read end,
    buyer_read = case when buyer = p_sender then now() else buyer_read end
  where id = p_thread;
end $$;
revoke all on function public.mk_post(uuid, uuid, text, text) from public, anon, authenticated;

-- buyer opens (or reopens) a conversation about a live listing
create or replace function public.mk_start(p_seller uuid, p_listing text)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); it jsonb; tid uuid;
begin
  if me is null then raise exception 'Log in first' using errcode = '28000'; end if;
  if me = p_seller then raise exception 'That is your own listing'; end if;
  select x into it from docs d, jsonb_array_elements(coalesce(d.data->'items','[]'::jsonb)) x
    where d.col = 'listings' and d.id = p_seller::text and x->>'id' = p_listing limit 1;
  if it is null then raise exception 'That listing is gone'; end if;
  select id into tid from mk_threads where listing_id = p_listing and seller = p_seller and buyer = me;
  if tid is not null then return tid; end if;
  if coalesce(it->>'status','') in ('sold','removed') then raise exception 'That car already sold'; end if;
  if (select count(*) from mk_threads where buyer = me and created_at > now() - interval '1 day') >= 30 then
    raise exception 'Too many new conversations today. Try again tomorrow.'; end if;
  insert into mk_threads (seller, buyer, listing_id, car, ask)
    values (p_seller, me, p_listing, left(coalesce(it->>'name',''), 120), nullif(regexp_replace(coalesce(it->>'price',''), '[^0-9.]', '', 'g'), '')::numeric)
    returning id into tid;
  return tid;
end $$;

-- send a message (max 20 a minute and 300 a day per person)
create or replace function public.mk_send(p_thread uuid, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t mk_threads; b text := btrim(coalesce(p_body,''));
begin
  select * into t from mk_threads where id = p_thread;
  if t.id is null or me is null or me not in (t.seller, t.buyer) then raise exception 'Not your conversation' using errcode = '42501'; end if;
  if b = '' then return; end if;
  if (select count(*) from mk_messages where sender = me and created_at > now() - interval '1 minute') >= 20
     or (select count(*) from mk_messages where sender = me and created_at > now() - interval '1 day') >= 300 then
    raise exception 'Slow down a little. Try again in a minute.'; end if;
  perform mk_post(p_thread, me, 'msg', b);
end $$;

-- offers and order steps
create or replace function public.mk_act(p_thread uuid, p_action text, p_amount numeric default null, p_carrier text default null, p_tracking text default null)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t mk_threads; is_buyer boolean; is_seller boolean; nxt text; line text; amt numeric;
begin
  select * into t from mk_threads where id = p_thread for update;
  if t.id is null or me is null or me not in (t.seller, t.buyer) then raise exception 'Not your conversation' using errcode = '42501'; end if;
  is_buyer := me = t.buyer; is_seller := me = t.seller; amt := round(coalesce(p_amount, 0)::numeric, 2);
  if p_action = 'offer' and is_buyer and t.status in ('open','offered','declined') then
    if amt <= 0 or amt > 100000 then raise exception 'Enter an offer amount'; end if;
    nxt := 'offered'; update mk_threads set offer = amt where id = t.id; line := 'Offered $' || to_char(amt, 'FM999990.00');
  elsif p_action = 'buy' and is_buyer and t.status in ('open','offered','declined') and t.ask is not null then
    nxt := 'accepted'; update mk_threads set offer = t.ask where id = t.id; line := 'Wants to buy at the asking price, $' || to_char(t.ask, 'FM999990.00');
  elsif p_action = 'accept' and is_seller and t.status = 'offered' then
    nxt := 'accepted'; line := 'Accepted the offer of $' || to_char(t.offer, 'FM999990.00');
  elsif p_action = 'decline' and is_seller and t.status = 'offered' then
    nxt := 'declined'; line := 'Declined the offer';
  elsif p_action = 'counter' and is_seller and t.status in ('offered','open','declined') then
    if amt <= 0 or amt > 100000 then raise exception 'Enter a price'; end if;
    nxt := 'open'; update mk_threads set ask = amt where id = t.id; line := 'Countered at $' || to_char(amt, 'FM999990.00');
  elsif p_action = 'paid' and is_seller and t.status = 'accepted' then
    nxt := 'paid'; line := 'Confirmed the payment came in';
  elsif p_action = 'shipped' and is_seller and t.status in ('accepted','paid') then
    nxt := 'shipped'; update mk_threads set carrier = left(nullif(btrim(p_carrier),''), 40), tracking = left(nullif(btrim(p_tracking),''), 60) where id = t.id;
    line := 'Shipped it' || coalesce(' with ' || left(nullif(btrim(p_carrier),''), 40), '') || coalesce('. Tracking: ' || left(nullif(btrim(p_tracking),''), 60), '');
  elsif p_action = 'received' and is_buyer and t.status = 'shipped' then
    nxt := 'received'; line := 'Got the car. Deal done';
  elsif p_action = 'cancel' and t.status in ('open','offered','accepted','declined') then
    nxt := 'cancelled'; line := 'Cancelled this deal';
  else
    raise exception 'That step isn''t available right now';
  end if;
  update mk_threads set status = nxt where id = t.id;
  perform mk_post(t.id, me, 'event', line);
  return nxt;
end $$;

-- mark a conversation read
create or replace function public.mk_read(p_thread uuid)
returns void language sql security definer set search_path = public as $$
  update mk_threads set
    seller_read = case when seller = auth.uid() then now() else seller_read end,
    buyer_read = case when buyer = auth.uid() then now() else buyer_read end
  where id = p_thread and auth.uid() in (seller, buyer);
$$;

revoke all on function public.mk_start(uuid, text), public.mk_send(uuid, text), public.mk_act(uuid, text, numeric, text, text), public.mk_read(uuid) from public, anon;
grant execute on function public.mk_start(uuid, text), public.mk_send(uuid, text), public.mk_act(uuid, text, numeric, text, text), public.mk_read(uuid) to authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.mk_threads; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.mk_messages; exception when duplicate_object then null; end;
end $$;

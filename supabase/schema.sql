create table profiles(id uuid primary key references auth.users on delete cascade,username text unique not null,bio text default '',avatar_url text default '',created_at timestamptz default now());
create table videos(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles on delete cascade,url text not null,caption text default '',created_at timestamptz default now());
create table likes(user_id uuid references profiles on delete cascade,video_id uuid references videos on delete cascade,primary key(user_id,video_id));
create table comments(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles on delete cascade,video_id uuid not null references videos on delete cascade,body text not null,created_at timestamptz default now());
create table follows(follower_id uuid references profiles on delete cascade,following_id uuid references profiles on delete cascade,primary key(follower_id,following_id));
create table messages(id uuid primary key default gen_random_uuid(),sender_id uuid not null references profiles on delete cascade,receiver_id uuid not null references profiles on delete cascade,body text not null,created_at timestamptz default now());
create table notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles on delete cascade,actor_id uuid not null references profiles on delete cascade,type text not null,created_at timestamptz default now());

-- profil automatik pas regjistrimit
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into profiles(id,username) values(new.id,coalesce(new.raw_user_meta_data->>'username',split_part(new.email,'@',1))); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- njoftimet
create function notify() returns trigger language plpgsql security definer as $$
declare owner uuid; begin
 if tg_table_name='follows' then owner:=new.following_id; insert into notifications(user_id,actor_id,type) values(owner,new.follower_id,'follow');
 else select user_id into owner from videos where id=new.video_id;
  if owner<>new.user_id then insert into notifications(user_id,actor_id,type) values(owner,new.user_id,tg_table_name); end if; end if;
 return new; end $$;
create trigger n_like after insert on likes for each row execute function notify();
create trigger n_comment after insert on comments for each row execute function notify();
create trigger n_follow after insert on follows for each row execute function notify();

alter table profiles enable row level security;alter table videos enable row level security;alter table likes enable row level security;
alter table comments enable row level security;alter table follows enable row level security;alter table messages enable row level security;alter table notifications enable row level security;
create policy "r" on profiles for select using(true);create policy "u" on profiles for update using(auth.uid()=id);
create policy "r" on videos for select using(true);create policy "i" on videos for insert with check(auth.uid()=user_id);create policy "d" on videos for delete using(auth.uid()=user_id);
create policy "r" on likes for select using(true);create policy "i" on likes for insert with check(auth.uid()=user_id);create policy "d" on likes for delete using(auth.uid()=user_id);
create policy "r" on comments for select using(true);create policy "i" on comments for insert with check(auth.uid()=user_id);create policy "d" on comments for delete using(auth.uid()=user_id);
create policy "r" on follows for select using(true);create policy "i" on follows for insert with check(auth.uid()=follower_id);create policy "d" on follows for delete using(auth.uid()=follower_id);
create policy "r" on messages for select using(auth.uid() in(sender_id,receiver_id));create policy "i" on messages for insert with check(auth.uid()=sender_id);
create policy "r" on notifications for select using(auth.uid()=user_id);

insert into storage.buckets(id,name,public) values('videos','videos',true),('avatars','avatars',true);
create policy "pub read" on storage.objects for select using(bucket_id in('videos','avatars'));
create policy "own upload" on storage.objects for insert to authenticated with check(bucket_id in('videos','avatars') and (storage.foldername(name))[1]=auth.uid()::text);
create policy "own update" on storage.objects for update to authenticated using((storage.foldername(name))[1]=auth.uid()::text);
alter publication supabase_realtime add table messages;

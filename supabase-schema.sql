create extension if not exists pgcrypto;
create table if not exists public.ideas(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,title text not null check(char_length(title) between 1 and 200),type text not null default '灵感原料',tags text[] not null default '{}',status text not null default '待加工',content text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.ideas enable row level security;
drop policy if exists owner_select on public.ideas;drop policy if exists owner_insert on public.ideas;drop policy if exists owner_update on public.ideas;drop policy if exists owner_delete on public.ideas;
create policy owner_select on public.ideas for select using(auth.uid()=user_id);create policy owner_insert on public.ideas for insert with check(auth.uid()=user_id);create policy owner_update on public.ideas for update using(auth.uid()=user_id) with check(auth.uid()=user_id);create policy owner_delete on public.ideas for delete using(auth.uid()=user_id);
create or replace function public.set_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end;$$;drop trigger if exists ideas_set_updated_at on public.ideas;create trigger ideas_set_updated_at before update on public.ideas for each row execute function public.set_updated_at();

create table if not exists public.assets(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,source_idea_id uuid references public.ideas(id) on delete set null,asset_type text not null check(asset_type in('规则卡','人物卡','情节卡','场景卡')),title text not null check(char_length(title) between 1 and 200),tags text[] not null default '{}',summary text not null default '',content text not null default '',status text not null default '草稿',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.assets enable row level security;
drop policy if exists asset_owner_select on public.assets;drop policy if exists asset_owner_insert on public.assets;drop policy if exists asset_owner_update on public.assets;drop policy if exists asset_owner_delete on public.assets;
create policy asset_owner_select on public.assets for select using(auth.uid()=user_id);create policy asset_owner_insert on public.assets for insert with check(auth.uid()=user_id);create policy asset_owner_update on public.assets for update using(auth.uid()=user_id) with check(auth.uid()=user_id);create policy asset_owner_delete on public.assets for delete using(auth.uid()=user_id);
drop trigger if exists assets_set_updated_at on public.assets;create trigger assets_set_updated_at before update on public.assets for each row execute function public.set_updated_at();

create table if not exists public.characters(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,name text not null check(char_length(name) between 1 and 120),role text not null default '',tags text[] not null default '{}',desire text not null default '',fear text not null default '',ability text not null default '',arc text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.characters enable row level security;drop policy if exists character_owner_all on public.characters;create policy character_owner_all on public.characters for all using(auth.uid()=user_id) with check(auth.uid()=user_id);drop trigger if exists characters_set_updated_at on public.characters;create trigger characters_set_updated_at before update on public.characters for each row execute function public.set_updated_at();
create table if not exists public.relationships(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,from_character_id uuid not null references public.characters(id) on delete cascade,to_character_id uuid not null references public.characters(id) on delete cascade,relation_type text not null,power_state text not null default '',bond text not null default '',change_arc text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(from_character_id<>to_character_id));
alter table public.relationships enable row level security;drop policy if exists relationship_owner_all on public.relationships;create policy relationship_owner_all on public.relationships for all using(auth.uid()=user_id) with check(auth.uid()=user_id and exists(select 1 from public.characters c where c.id=from_character_id and c.user_id=auth.uid()) and exists(select 1 from public.characters c where c.id=to_character_id and c.user_id=auth.uid()));drop trigger if exists relationships_set_updated_at on public.relationships;create trigger relationships_set_updated_at before update on public.relationships for each row execute function public.set_updated_at();

create table if not exists public.story_projects(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,title text not null check(char_length(title) between 1 and 200),genre text not null default '',logline text not null default '',mainline text not null default '',worldview text not null default '',core_conflict text not null default '',status text not null default '概念期',created_at timestamptz not null default now(),updated_at timestamptz not null default now());alter table public.story_projects enable row level security;drop policy if exists project_owner_all on public.story_projects;create policy project_owner_all on public.story_projects for all using(auth.uid()=user_id) with check(auth.uid()=user_id);drop trigger if exists projects_set_updated_at on public.story_projects;create trigger projects_set_updated_at before update on public.story_projects for each row execute function public.set_updated_at();
create table if not exists public.chapter_cards(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,project_id uuid not null references public.story_projects(id) on delete cascade,chapter_no integer not null check(chapter_no>0),title text not null,objective text not null default '',opening_hook text not null default '',beat_qi text not null default '',beat_cheng text not null default '',beat_zhuan text not null default '',beat_he text not null default '',ending_hook text not null default '',emotion_curve text not null default '',continuity_notes text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(project_id,chapter_no));alter table public.chapter_cards enable row level security;drop policy if exists chapter_owner_all on public.chapter_cards;create policy chapter_owner_all on public.chapter_cards for all using(auth.uid()=user_id) with check(auth.uid()=user_id and exists(select 1 from public.story_projects p where p.id=project_id and p.user_id=auth.uid()));drop trigger if exists chapters_set_updated_at on public.chapter_cards;create trigger chapters_set_updated_at before update on public.chapter_cards for each row execute function public.set_updated_at();

create table if not exists public.sop_templates(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,name text not null check(char_length(name) between 1 and 200),category text not null default '创作方法',purpose text not null default '',inputs text not null default '',steps text not null default '',outputs text not null default '',checklist text not null default '',status text not null default '草稿',created_at timestamptz not null default now(),updated_at timestamptz not null default now());alter table public.sop_templates enable row level security;drop policy if exists template_owner_all on public.sop_templates;create policy template_owner_all on public.sop_templates for all using(auth.uid()=user_id) with check(auth.uid()=user_id);drop trigger if exists templates_set_updated_at on public.sop_templates;create trigger templates_set_updated_at before update on public.sop_templates for each row execute function public.set_updated_at();

create table if not exists public.pipeline_runs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 200),
  pipeline_type text not null check(pipeline_type in('市场风向扫描','素材自动加工','故事开发','连续性质检')),
  project_id uuid references public.story_projects(id) on delete set null,
  sop_id uuid references public.sop_templates(id) on delete set null,
  input_brief text not null default '',
  output_draft text not null default '',
  review_notes text not null default '',
  status text not null default '待执行' check(status in('待执行','执行中','待审核','已完成','失败')),
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pipeline_runs enable row level security;
drop policy if exists pipeline_owner_all on public.pipeline_runs;
create policy pipeline_owner_all on public.pipeline_runs for all using(auth.uid()=user_id) with check(
  auth.uid()=user_id
  and (project_id is null or exists(select 1 from public.story_projects p where p.id=project_id and p.user_id=auth.uid()))
  and (sop_id is null or exists(select 1 from public.sop_templates s where s.id=sop_id and s.user_id=auth.uid()))
);
drop trigger if exists pipeline_runs_set_updated_at on public.pipeline_runs;
create trigger pipeline_runs_set_updated_at before update on public.pipeline_runs for each row execute function public.set_updated_at();

alter table public.assets add column if not exists source_pipeline_id uuid references public.pipeline_runs(id) on delete set null;
alter table public.chapter_cards add column if not exists source_pipeline_id uuid references public.pipeline_runs(id) on delete set null;
alter table public.sop_templates add column if not exists source_pipeline_id uuid references public.pipeline_runs(id) on delete set null;

create table if not exists public.pipeline_conversions(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pipeline_id uuid not null references public.pipeline_runs(id) on delete cascade,
  target_type text not null check(target_type in('资产卡','章节卡','SOP')),
  target_id uuid not null,
  target_title text not null default '',
  created_at timestamptz not null default now()
);
alter table public.pipeline_conversions enable row level security;
drop policy if exists conversion_owner_all on public.pipeline_conversions;
create policy conversion_owner_all on public.pipeline_conversions for all using(
  auth.uid()=user_id and exists(select 1 from public.pipeline_runs p where p.id=pipeline_id and p.user_id=auth.uid())
) with check(
  auth.uid()=user_id and exists(select 1 from public.pipeline_runs p where p.id=pipeline_id and p.user_id=auth.uid())
);
create index if not exists pipeline_conversions_pipeline_idx on public.pipeline_conversions(pipeline_id);

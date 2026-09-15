-- v18：章节正文独立存储、版本管理、来源追踪。
create table if not exists public.chapter_contents(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.story_projects(id) on delete cascade,
  chapter_no integer not null check(chapter_no>0),
  title text not null check(char_length(title) between 1 and 200),
  body text not null default '',
  version_no integer not null default 1 check(version_no>0),
  status text not null default '草稿' check(status in('草稿','待审核','已确认')),
  continuity_notes text not null default '',
  source_pipeline_id uuid references public.pipeline_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id,chapter_no,version_no)
);
alter table public.chapter_contents enable row level security;
drop policy if exists chapter_content_owner_all on public.chapter_contents;
create policy chapter_content_owner_all on public.chapter_contents for all
using(auth.uid()=user_id)
with check(auth.uid()=user_id and exists(select 1 from public.story_projects p where p.id=project_id and p.user_id=auth.uid()));
drop trigger if exists chapter_contents_set_updated_at on public.chapter_contents;
create trigger chapter_contents_set_updated_at before update on public.chapter_contents for each row execute function public.set_updated_at();
create index if not exists chapter_contents_project_idx on public.chapter_contents(project_id,chapter_no,version_no desc);

alter table public.pipeline_conversions drop constraint if exists pipeline_conversions_target_type_check;
alter table public.pipeline_conversions add constraint pipeline_conversions_target_type_check check(target_type in('资产卡','章节卡','章节正文','SOP'));

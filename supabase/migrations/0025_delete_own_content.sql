-- 0025_delete_own_content.sql
-- "Delete your own message/post/comment" (item 2 of the delete-feature
-- audit). Posts, comments, and announcement_comments never had any
-- delete mechanism at all — this adds the missing is_deleted flag to
-- all three, matching the pattern channel_messages and direct_messages
-- already used. Those two already have the column; this migration adds
-- their missing delete FUNCTIONS.
--
-- Soft delete (an is_deleted flag), not a hard delete, for all five —
-- unlike Files (where a hard delete made sense), these all sit inside
-- a conversation or thread alongside other people's content. Hard-
-- deleting a post would force cascading away every comment someone
-- else wrote on it; soft-deleting just removes it from view while
-- leaving the underlying data alone.
--
-- Every soft_delete_* function below follows the same shape: a
-- SECURITY DEFINER function that checks the caller is the original
-- author, then flips is_deleted to true. Deliberately NOT done via a
-- broad "UPDATE ... USING (author_id = auth.uid())" RLS policy — that
-- would let a user update ANY column on their own row (content,
-- timestamps, everything), not just is_deleted. A narrow, single-
-- purpose function is a smaller, safer surface: it can only ever do
-- the one thing it's named for, nothing else.

alter table posts add column is_deleted boolean not null default false;
alter table comments add column is_deleted boolean not null default false;
alter table announcement_comments add column is_deleted boolean not null default false;

create function soft_delete_post(p_post_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.posts
  set is_deleted = true
  where id = p_post_id and author_id = auth.uid();

  -- FOUND reflects whether the UPDATE above actually matched a row.
  -- If someone tries to delete a post that isn't theirs, the WHERE
  -- clause matches zero rows, and this correctly reports failure
  -- rather than silently doing nothing.
  if not found then
    raise exception 'Post not found, or you do not have permission to delete it.';
  end if;
end;
$$;

create function soft_delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.comments
  set is_deleted = true
  where id = p_comment_id and author_id = auth.uid();

  if not found then
    raise exception 'Comment not found, or you do not have permission to delete it.';
  end if;
end;
$$;

create function soft_delete_announcement_comment(p_comment_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.announcement_comments
  set is_deleted = true
  where id = p_comment_id and author_id = auth.uid();

  if not found then
    raise exception 'Comment not found, or you do not have permission to delete it.';
  end if;
end;
$$;

create function soft_delete_channel_message(p_message_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.channel_messages
  set is_deleted = true
  where id = p_message_id and author_id = auth.uid();

  if not found then
    raise exception 'Message not found, or you do not have permission to delete it.';
  end if;
end;
$$;

create function soft_delete_direct_message(p_message_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.direct_messages
  set is_deleted = true
  where id = p_message_id and sender_id = auth.uid();

  if not found then
    raise exception 'Message not found, or you do not have permission to delete it.';
  end if;
end;
$$;
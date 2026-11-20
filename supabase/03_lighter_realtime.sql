-- Live updates only need the key of a deleted row, not the whole old row (photos made these huge). Applied Nov 19, 2026.
alter table public.docs replica identity default;

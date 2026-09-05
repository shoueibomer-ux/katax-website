These JSON files are no longer read or written by the app — they're kept
only as a historical record of the content that was live before the switch
to Supabase.

All live data (site content, contact messages, and clients) now lives in
your Supabase project. See ../README.md and ../supabase-setup.sql to set
that up; content.json's contents were used as the seed data in that SQL
file so the site isn't empty on first load.

It's safe to delete this folder once you've confirmed Supabase is working.

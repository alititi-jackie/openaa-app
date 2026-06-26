-- Normalize the old site's secondhand ad placement to the current marketplace channel.
-- The application now reads marketplace ads with placement = 'marketplace'.
update public.ads
set placement = 'marketplace',
    updated_at = now()
where placement = 'secondhand';

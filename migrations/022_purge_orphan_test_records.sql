-- Migration 022: Purge Orphan Test Records
-- Remove dummy/test records inserted during manual development checks

DELETE FROM public.services 
WHERE id = '61dcbc45-08da-4f47-839d-a9afd93db585' 
   OR name = '123123' 
   OR name ILIKE '%test123123%';

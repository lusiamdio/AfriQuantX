-- Apply to existing installations of supabase_schema.sql after reviewing grants.
-- These changes do not make the application ready to handle real money.
BEGIN;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own open orders" ON public.orders;
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;
COMMIT;

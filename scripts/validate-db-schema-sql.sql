-- Database Schema Validation Queries
-- Run these in Supabase SQL Editor to validate schema

-- 1. Check users table columns
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check plan constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND contype = 'c'
AND pg_get_constraintdef(oid) LIKE '%plan%';

-- 3. Check unique constraint on auth_user_id
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND contype = 'u'
AND (pg_get_constraintdef(oid) LIKE '%auth_user_id%' OR conname LIKE '%auth_user_id%');

-- 4. Check indexes on auth_user_id and email
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
AND (indexname LIKE '%auth_user_id%' OR indexname LIKE '%email%');

-- 5. Check if RLS is enabled
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'users';

-- 6. Check RLS policies on users table
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- 7. Check if preference_profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'preference_profiles'
) as table_exists;

-- 8. Check foreign key from preference_profiles.user_id to users.id
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'preference_profiles'
  AND kcu.column_name = 'user_id';



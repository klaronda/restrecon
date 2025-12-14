/**
 * Database Schema Validation Script
 * 
 * Validates that the Supabase database schema is correct and all required
 * tables, columns, constraints, and RLS policies exist.
 * 
 * Run with: npx tsx scripts/validate-db-schema.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ValidationResult {
  passed: boolean;
  message: string;
}

async function validateUsersTable(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // Check if users table exists and has required columns
  const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `,
  });

  if (columnsError) {
    results.push({
      passed: false,
      message: `Failed to query users table columns: ${columnsError.message}`,
    });
    return results;
  }

  const requiredColumns = ['id', 'auth_user_id', 'email', 'plan', 'trial_ends_at'];
  const columnNames = (columns as any[])?.map((col: any) => col.column_name) || [];

  for (const col of requiredColumns) {
    if (!columnNames.includes(col)) {
      results.push({
        passed: false,
        message: `Missing required column: users.${col}`,
      });
    } else {
      results.push({
        passed: true,
        message: `Column exists: users.${col}`,
      });
    }
  }

  // Check plan constraint
  const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass
      AND contype = 'c';
    `,
  });

  if (!constraintsError && constraints) {
    const planConstraint = (constraints as any[])?.find((c: any) =>
      c.definition?.includes('plan')
    );
    if (planConstraint) {
      results.push({
        passed: true,
        message: `Plan constraint exists: ${planConstraint.definition}`,
      });
    } else {
      results.push({
        passed: false,
        message: 'Missing CHECK constraint on users.plan column',
      });
    }
  }

  // Check unique constraint on auth_user_id
  const { data: uniqueConstraints, error: uniqueError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass
      AND contype = 'u'
      AND (pg_get_constraintdef(oid) LIKE '%auth_user_id%' OR conname LIKE '%auth_user_id%');
    `,
  });

  if (!uniqueError && uniqueConstraints && (uniqueConstraints as any[]).length > 0) {
    results.push({
      passed: true,
      message: 'Unique constraint exists on users.auth_user_id',
    });
  } else {
    results.push({
      passed: false,
      message: 'Missing unique constraint on users.auth_user_id',
    });
  }

  // Check indexes
  const { data: indexes, error: indexesError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'users'
      AND (indexname LIKE '%auth_user_id%' OR indexname LIKE '%email%');
    `,
  });

  if (!indexesError && indexes) {
    const authUserIdIndex = (indexes as any[])?.find((idx: any) =>
      idx.indexname?.includes('auth_user_id')
    );
    const emailIndex = (indexes as any[])?.find((idx: any) =>
      idx.indexname?.includes('email')
    );

    if (authUserIdIndex) {
      results.push({
        passed: true,
        message: `Index exists on users.auth_user_id: ${authUserIdIndex.indexname}`,
      });
    } else {
      results.push({
        passed: false,
        message: 'Missing index on users.auth_user_id (recommended for performance)',
      });
    }

    if (emailIndex) {
      results.push({
        passed: true,
        message: `Index exists on users.email: ${emailIndex.indexname}`,
      });
    } else {
      results.push({
        passed: false,
        message: 'Missing index on users.email (recommended for performance)',
      });
    }
  }

  return results;
}

async function validateRLSPolicies(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // Check if RLS is enabled on users table
  const { data: rlsEnabled, error: rlsError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname = 'users';
    `,
  });

  if (!rlsError && rlsEnabled) {
    const isEnabled = (rlsEnabled as any[])?.[0]?.relrowsecurity;
    if (isEnabled) {
      results.push({
        passed: true,
        message: 'RLS is enabled on users table',
      });
    } else {
      results.push({
        passed: false,
        message: 'RLS is not enabled on users table',
      });
      return results; // Can't check policies if RLS is disabled
    }
  }

  // Check for RLS policies
  const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'users';
    `,
  });

  if (!policiesError && policies) {
    const policyCount = (policies as any[])?.length || 0;
    if (policyCount > 0) {
      results.push({
        passed: true,
        message: `Found ${policyCount} RLS policy/policies on users table`,
      });
    } else {
      results.push({
        passed: false,
        message: 'No RLS policies found on users table',
      });
    }
  }

  return results;
}

async function validatePreferenceProfilesTable(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // Check if preference_profiles table exists
  const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'preference_profiles'
      );
    `,
  });

  if (tableError) {
    results.push({
      passed: false,
      message: `Failed to check preference_profiles table: ${tableError.message}`,
    });
    return results;
  }

  const exists = (tableExists as any)?.[0]?.exists;
  if (!exists) {
    results.push({
      passed: false,
      message: 'preference_profiles table does not exist',
    });
    return results;
  }

  results.push({
    passed: true,
    message: 'preference_profiles table exists',
  });

  // Check for user_id foreign key
  const { data: foreignKeys, error: fkError } = await supabase.rpc('exec_sql', {
    query: `
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
    `,
  });

  if (!fkError && foreignKeys) {
    const fkCount = (foreignKeys as any[])?.length || 0;
    if (fkCount > 0) {
      const fk = (foreignKeys as any[])[0];
      if (fk.foreign_table_name === 'users' && fk.foreign_column_name === 'id') {
        results.push({
          passed: true,
          message: 'Foreign key exists: preference_profiles.user_id -> users.id',
        });
      } else {
        results.push({
          passed: false,
          message: `Foreign key points to wrong table/column: ${fk.foreign_table_name}.${fk.foreign_column_name}`,
        });
      }
    } else {
      results.push({
        passed: false,
        message: 'Missing foreign key: preference_profiles.user_id -> users.id',
      });
    }
  }

  return results;
}

async function main() {
  console.log('🔍 Validating NestRecon Database Schema...\n');

  const allResults: ValidationResult[] = [];

  console.log('📊 Validating users table...');
  const usersResults = await validateUsersTable();
  allResults.push(...usersResults);

  console.log('🔒 Validating RLS policies...');
  const rlsResults = await validateRLSPolicies();
  allResults.push(...rlsResults);

  console.log('📋 Validating preference_profiles table...');
  const prefsResults = await validatePreferenceProfilesTable();
  allResults.push(...prefsResults);

  // Print results
  console.log('\n📝 Validation Results:\n');
  let passedCount = 0;
  let failedCount = 0;

  for (const result of allResults) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.message}`);
    if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
  }

  console.log(`\n📊 Summary: ${passedCount} passed, ${failedCount} failed`);

  if (failedCount > 0) {
    console.log('\n⚠️  Some validations failed. Please review and fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✨ All validations passed!');
    process.exit(0);
  }
}

// Note: This script requires the exec_sql RPC function or direct SQL access
// For production, you may need to use Supabase Management API or run SQL directly
console.warn('⚠️  Note: This script requires exec_sql RPC function or direct SQL access.');
console.warn('   You may need to run SQL queries directly in Supabase SQL Editor instead.\n');

main().catch((error) => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});



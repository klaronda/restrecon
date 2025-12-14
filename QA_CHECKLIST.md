# NestRecon QA Checklist

Use this checklist before each release to ensure quality and catch common issues.

## Authentication Flow

### Sign Up
- [ ] Sign up with new email works and creates account
- [ ] Sign up with existing email shows friendly error message
- [ ] Email confirmation email is sent after signup
- [ ] Email confirmation link works and activates account
- [ ] Password validation works (weak password shows error)
- [ ] Invalid email format shows error
- [ ] Success message displays after signup ("Thanks for Enlisting in NestRecon!")
- [ ] User is redirected to login after signup (not account page)

### Login
- [ ] Login with correct credentials works
- [ ] Login with wrong password shows friendly error
- [ ] Login with non-existent email shows friendly error
- [ ] Login with unverified email shows appropriate message
- [ ] Too many login attempts shows rate limit message
- [ ] Session persists on page refresh
- [ ] Session expires after timeout
- [ ] Logout works and redirects to home page
- [ ] Logout clears all session data

### Extension Login
- [ ] Extension login flow works (with redirect URL)
- [ ] Extension receives access_token and refresh_token
- [ ] Extension callback URL is constructed correctly
- [ ] State token validation works
- [ ] Extension login redirects back to extension

## Account Page

### Data Display
- [ ] Account page loads after login (no infinite loading)
- [ ] User name displays correctly (not "klaronda" or email prefix)
- [ ] Full name displays if available (first_name + last_name)
- [ ] Subscription status shows correctly (not "none" when pro)
- [ ] Plan badge displays correctly (Free/Trial/Pro)
- [ ] Trial days remaining calculates correctly
- [ ] Trial days shows 0 when trial expired
- [ ] Email address displays correctly

### Profile Sync
- [ ] Profile data syncs with database on page load
- [ ] Profile refresh works when clicking refresh
- [ ] Profile updates reflect immediately after changes
- [ ] auth_user_id matches Supabase auth user ID
- [ ] No duplicate profiles created

### Preferences
- [ ] Preferences save correctly to database
- [ ] Preferences load correctly on account page
- [ ] Preferences persist after page refresh
- [ ] Preference changes update immediately in UI
- [ ] Default preferences apply for new users

## Database/Table Issues

### Users Table
- [ ] New user creates row in `users` table
- [ ] `auth_user_id` matches Supabase auth user ID exactly
- [ ] `plan` field accepts only valid values ('trial', 'pro', 'none')
- [ ] `plan` defaults to 'trial' for new users
- [ ] `trial_ends_at` is set correctly (7 days from signup)
- [ ] `email` field is unique (no duplicates)
- [ ] `first_name` and `last_name` can be null
- [ ] `created_at` and `updated_at` timestamps work

### Row Level Security (RLS)
- [ ] RLS policies allow authenticated users to read their own data
- [ ] RLS policies allow users to update their own profile
- [ ] RLS policies prevent users from reading other users' data
- [ ] RLS policies prevent users from updating other users' profiles
- [ ] Unauthenticated users cannot access user data

### Preference Profiles Table
- [ ] `preference_profiles.user_id` has foreign key to `users.id`
- [ ] Preference profile is created when user signs up
- [ ] Preference profile links correctly to user
- [ ] Multiple preference profiles cannot exist for same user
- [ ] Deleting user cascades to preference profile (if configured)

### Data Integrity
- [ ] No duplicate users created for same email
- [ ] No orphaned preference profiles (user_id without matching user)
- [ ] auth_user_id is unique across all users
- [ ] Email is unique across all users

## Error Handling

### Network Errors
- [ ] Network errors show user-friendly messages
- [ ] Offline state is handled gracefully
- [ ] API timeout errors are caught and displayed
- [ ] Retry logic works for transient failures

### Database Errors
- [ ] Database errors don't expose sensitive information
- [ ] RLS policy violations show friendly messages
- [ ] Constraint violations (duplicate email, etc.) show friendly messages
- [ ] Foreign key violations are handled gracefully
- [ ] Connection errors are caught and displayed

### Timeout Errors
- [ ] Session check timeout (2s) works on login page
- [ ] Profile fetch timeout (3s) works on account page
- [ ] Auth initialization timeout (5s) works on app load
- [ ] Timeout errors show appropriate messages
- [ ] No infinite loading states

### Loading States
- [ ] Loading states show during async operations
- [ ] Loading spinners appear and disappear correctly
- [ ] Button states disable during loading
- [ ] Multiple simultaneous requests don't cause race conditions

## UI/UX Issues

### Navigation
- [ ] All navigation links work correctly
- [ ] Logo click scrolls to top on home page
- [ ] Hash links (#pricing, #faq) work correctly
- [ ] Back button works correctly
- [ ] Browser refresh maintains state where appropriate

### Forms
- [ ] Form validation works (required fields, email format, etc.)
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Form submission prevents double-submission
- [ ] Form resets after successful submission (where appropriate)

### Responsive Design
- [ ] Site works on mobile devices
- [ ] Navigation is accessible on mobile (hamburger menu)
- [ ] Forms are usable on mobile
- [ ] Text is readable on all screen sizes

## Performance

- [ ] Page load times are acceptable (< 3s)
- [ ] No console errors in production
- [ ] No memory leaks (check with DevTools)
- [ ] Images load correctly
- [ ] API calls are optimized (no unnecessary requests)

## Security

- [ ] Passwords are not logged in console
- [ ] Tokens are not exposed in URLs (use hash fragments)
- [ ] Sensitive data is not stored in localStorage
- [ ] CORS policies are correct
- [ ] XSS protection is in place

## Browser Compatibility

- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Safari (latest)
- [ ] Works in Edge (latest)
- [ ] Extension works in Chrome

## Known Issues to Watch

- [ ] User name showing as email prefix instead of full name
- [ ] Subscription status showing "none" when user is "pro"
- [ ] Account page infinite loading
- [ ] Login page hanging on "Checking authentication..."
- [ ] Preferences not saving to database
- [ ] auth_user_id mismatches causing profile lookup failures

## Pre-Release Checklist

Before deploying to production:

1. [ ] Run `npm run type-check` - no errors
2. [ ] Run `npm run lint` - no errors
3. [ ] Run `npm run test` - all tests pass
4. [ ] Complete all relevant items in this checklist
5. [ ] Test in incognito/private browsing mode
6. [ ] Test with a fresh account (signup flow)
7. [ ] Test with existing account (login flow)
8. [ ] Test extension login flow
9. [ ] Check browser console for errors
10. [ ] Verify database constraints and RLS policies



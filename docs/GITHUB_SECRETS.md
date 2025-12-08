# GitHub Secrets Configuration for CI/CD

This document describes all GitHub Secrets that need to be configured for the CI/CD pipeline to work correctly.

## Required Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

### Supabase Configuration

| Secret Name | Description | Example Value | Where to Find |
|------------|-------------|---------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | Supabase anon/public key | `eyJhbGc...` | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) | `eyJhbGc...` | Supabase Dashboard → Settings → API → service_role (⚠️ Keep secret!) |

### E2E Test User Configuration

| Secret Name | Description | Example Value | Notes |
|------------|-------------|---------------|-------|
| `E2E_USERNAME` | Email of test user | `test@example.com` | Create this user in Supabase Auth |
| `E2E_PASSWORD` | Password of test user | `TestPassword123!` | Use a strong password |
| `E2E_USERNAME_ID` | UUID of test user | `00000000-0000-0000-0000-000000000000` | Get from Supabase Auth → Users |

## How to Set Up E2E Test User

1. **Create Test User in Supabase:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user" → "Create new user"
   - Enter email and password
   - Confirm the user (if email confirmation is enabled)

2. **Get User UUID:**
   - After creating the user, click on them in the Users list
   - Copy the UUID from the user details
   - This is your `E2E_USERNAME_ID`

3. **Add Secrets to GitHub:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add each secret one by one

## Verification

After adding all secrets, you can verify they are set correctly by:

1. Going to Settings → Secrets and variables → Actions
2. You should see all 6 secrets listed (values are hidden for security)

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` or `.env.test` files to the repository
- `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security (RLS) - keep it secret!
- Use a dedicated test user, not your personal account
- Consider using a separate Supabase project for testing

## Troubleshooting

### "Invalid API key" errors in CI

This means one of the Supabase secrets is missing or incorrect:
- Check that `SUPABASE_URL`, `SUPABASE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are all set
- Verify the values are correct (copy-paste from Supabase Dashboard)
- Make sure there are no extra spaces or newlines

### "dotenv injecting env (0)" message

This indicates that the `.env.test` file was created but is empty:
- Check that all E2E secrets are set in GitHub
- Review the "Create .env files" step in the CI workflow logs
- Look for "MISSING!" messages in the secret verification output

### Tests fail with authentication errors

- Verify `E2E_USERNAME` and `E2E_PASSWORD` are correct
- Check that the test user exists in Supabase Auth
- Ensure the user is confirmed (email verified)
- Verify `E2E_USERNAME_ID` matches the UUID in Supabase

## CI Workflow Behavior

The CI workflow will:
1. Check if all required secrets are set
2. Fail early if critical secrets are missing (before running tests)
3. Create `.env` and `.env.test` files from the secrets
4. Run E2E tests with the test environment configuration

If you see the workflow fail at the "Create .env files" step, it means required secrets are missing.


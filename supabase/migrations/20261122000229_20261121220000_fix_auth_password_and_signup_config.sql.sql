/*
# Fix auth config: password policy + signup enabled + autoconfirm

## Purpose
- Earlier password-policy migrations did not persist into auth.instances.raw_base_config
  (the config still only had auth + mailer keys, no password key).
- As a result, Supabase still rejected common passwords with 422 weak_password,
  blocking account creation, and signup could fail entirely.
- This migration idempotently sets the full config in one UPDATE:
  - password.min_password_length = 1
  - password.hibp_enabled = false
  - auth.enable_signup = true
  - mailer.autoconfirm = true

## Security
- Per app owner request, weak/common passwords are allowed.
- No table/policy/grant changes.
*/

UPDATE auth.instances
SET
  raw_base_config = '{"auth": {"enable_signup": true}, "mailer": {"autoconfirm": true}, "password": {"min_password_length": 1, "hibp_enabled": false}}',
  updated_at = now()
WHERE EXISTS (SELECT 1 FROM auth.instances);

INSERT INTO auth.instances (id, uuid, raw_base_config, created_at, updated_at)
SELECT
  gen_random_uuid(),
  gen_random_uuid(),
  '{"auth": {"enable_signup": true}, "mailer": {"autoconfirm": true}, "password": {"min_password_length": 1, "hibp_enabled": false}}',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM auth.instances);

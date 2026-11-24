/*
# Fix auth config: password policy + signup enabled + autoconfirm

## Purpose
- Earlier password-policy migrations did not persist into auth.instances.raw_base_config
  (the config still only had auth + mailer keys, no password key).
- As a result, Supabase still rejects common passwords with 422 weak_password,
  blocking account creation.
- This migration idempotently sets:
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
  raw_base_config = (
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(raw_base_config::jsonb, '{}'::jsonb),
            '{password,min_password_length}',
            '1'::jsonb
          ),
          '{password,hibp_enabled}',
          'false'::jsonb
        ),
        '{auth,enable_signup}',
        'true'::jsonb
      ),
      '{mailer,autoconfirm}',
      'true'::jsonb
    )
  )::text,
  updated_at = now()
WHERE EXISTS (SELECT 1 FROM auth.instances);

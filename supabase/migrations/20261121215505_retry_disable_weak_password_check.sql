/*
# Retry: disable HIBP leaked-password check and min password length

The earlier migration (20261119214315) intended to set password.min_password_length = 1
and password.hibp_enabled = false in auth.instances.raw_base_config, but the running
auth service still rejects common passwords with 422 weak_password. Re-apply the config
update idempotently.
*/

UPDATE auth.instances
SET
  raw_base_config = jsonb_set(
    jsonb_set(
      COALESCE(raw_base_config::jsonb, '{}'::jsonb),
      '{password,min_password_length}',
      '1'::jsonb
    ),
    '{password,hibp_enabled}',
    'false'::jsonb
  )::text,
  updated_at = now()
WHERE EXISTS (SELECT 1 FROM auth.instances);

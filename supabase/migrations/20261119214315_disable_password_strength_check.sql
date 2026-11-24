/*
# Disable password strength / HIBP checks and lower min password length

1. Purpose
- Supabase rejects common/weak passwords (e.g. "123456") via built-in HIBP and
  weak-password list checks. The app owner wants ANY password accepted.
- Lower min_password_length to 1 and disable HIBP checking.

2. Changes
- Update auth.instances raw_base_config to include password settings:
  - min_password_length = 1
  - hibp_enabled = false

3. Security
- Intentionally weak password policy per app owner's request.
- No table/policy/grant changes.
*/

UPDATE auth.instances
SET
  raw_base_config = jsonb_set(
    COALESCE(raw_base_config::jsonb, '{}'::jsonb),
    '{password,min_password_length}',
    '1'::jsonb
  )::text,
  updated_at = now()
WHERE EXISTS (SELECT 1 FROM auth.instances);

UPDATE auth.instances
SET
  raw_base_config = jsonb_set(
    COALESCE(raw_base_config::jsonb, '{}'::jsonb),
    '{password,hibp_enabled}',
    'false'::jsonb
  )::text,
  updated_at = now()
WHERE EXISTS (SELECT 1 FROM auth.instances);

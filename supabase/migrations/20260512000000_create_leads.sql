CREATE TABLE IF NOT EXISTS leads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  row_type        text        NOT NULL DEFAULT 'lead',
  first_name      text,
  last_name       text,
  email           text,
  phone           text,
  notes           text,
  employee_range  text,
  revenue_range   text,
  appointment_at  timestamptz,
  pipeline_stage  text,
  sold_amount     numeric,
  blocked_slots   jsonb       DEFAULT '[]',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

INSERT INTO leads (id, row_type, blocked_slots)
VALUES ('00000000-0000-0000-0000-000000000001', 'config', '[]')
ON CONFLICT (id) DO NOTHING;

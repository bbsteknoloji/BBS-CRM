INSERT INTO permissions (id, slug, name, module, created_at, updated_at)
VALUES (gen_random_uuid(), 'service:delete', 'Servis talebi sil', 'service', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r, permissions p
WHERE p.slug = 'service:delete'
  AND r.code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

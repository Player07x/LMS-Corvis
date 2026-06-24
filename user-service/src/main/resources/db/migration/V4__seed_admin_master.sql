WITH usuario_admin AS (
    INSERT INTO public.usuarios (nome, email, senha_hash, role)
    VALUES (
        'Admin Master',
        'admmaster@teste.com',
        '0192023a7bbd73250516f069df18b500',
        'ADMIN'
    )
    ON CONFLICT (email) DO UPDATE
        SET nome = EXCLUDED.nome,
            senha_hash = EXCLUDED.senha_hash,
            role = EXCLUDED.role
    RETURNING id
)
INSERT INTO public.administradores (id)
SELECT id FROM usuario_admin
ON CONFLICT (id) DO NOTHING;

-- Verificar permisos actuales para la tabla transactions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'transactions' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Otorgar permisos completos a usuarios autenticados
GRANT ALL PRIVILEGES ON transactions TO authenticated;

-- Otorgar permisos de lectura a usuarios anónimos (opcional)
GRANT SELECT ON transactions TO anon;

-- Crear política RLS para permitir que usuarios autenticados gestionen sus propias transacciones
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;

CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Crear política para permitir inserción de transacciones por usuarios autenticados
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;

CREATE POLICY "Users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'transactions';
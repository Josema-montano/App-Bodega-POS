-- Verificar si la columna payment_method existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'transactions' 
AND column_name = 'payment_method';

-- Agregar la columna payment_method si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
        
        -- Agregar constraint para validar valores permitidos
        ALTER TABLE transactions 
        ADD CONSTRAINT check_payment_method 
        CHECK (payment_method IN ('cash', 'card', 'transfer', 'check', 'other'));
    END IF;
END $$;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'transactions' 
ORDER BY ordinal_position;
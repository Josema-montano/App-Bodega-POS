-- =====================================================
-- SCHEMA COMPLETO PARA APP-BODEGA-POS
-- Sistema de Punto de Venta con Supabase
-- =====================================================

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de inventario
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER,
    location VARCHAR(100),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    current_debt DECIMAL(10,2) DEFAULT 0,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de proveedores
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ventas
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    user_id UUID REFERENCES users(id) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'credit', 'check')),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de venta
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de órdenes de compra
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id),
    user_id UUID REFERENCES users(id) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'received', 'cancelled')),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    expected_date TIMESTAMPTZ,
    received_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de orden
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de transacciones financieras
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'check', 'other')),
    user_id UUID REFERENCES users(id),
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cuentas por cobrar
CREATE TABLE accounts_receivable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    sale_id UUID REFERENCES sales(id),
    amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cuentas por pagar
CREATE TABLE accounts_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id),
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración de la aplicación
CREATE TABLE app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para productos
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_active ON products(is_active);

-- Índices para ventas
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);

-- Índices para inventario
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_quantity ON inventory(quantity);

-- Índices para transacciones
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_user ON transactions(user_id);

-- Índices para notificaciones
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- Índices para cuentas por cobrar/pagar
CREATE INDEX idx_accounts_receivable_customer ON accounts_receivable(customer_id);
CREATE INDEX idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX idx_accounts_payable_supplier ON accounts_payable(supplier_id);
CREATE INDEX idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX idx_accounts_payable_status ON accounts_payable(status);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at en todas las tablas relevantes
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at 
    BEFORE UPDATE ON inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON suppliers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON sales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_receivable_updated_at 
    BEFORE UPDATE ON accounts_receivable 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_payable_updated_at 
    BEFORE UPDATE ON accounts_payable 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_config_updated_at 
    BEFORE UPDATE ON app_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para usuarios autenticados
CREATE POLICY "Allow all for authenticated users" ON users 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON products 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON inventory 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON customers 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON suppliers 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON sales 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON sale_items 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON orders 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON order_items 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON accounts_receivable 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON accounts_payable 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON notifications 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON app_config 
    FOR ALL USING (auth.role() = 'authenticated');

-- Política específica para transacciones (basada en la migración)
CREATE POLICY "Users can manage their own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CONFIGURACIÓN INICIAL
-- =====================================================

-- Insertar configuración básica de la aplicación
INSERT INTO app_config (key, value, description) VALUES
('company_name', 'Mi Bodega POS', 'Nombre de la empresa'),
('company_address', 'Dirección de la empresa', 'Dirección física de la empresa'),
('company_phone', '+1234567890', 'Teléfono de contacto'),
('company_email', 'contacto@empresa.com', 'Email de contacto'),
('tax_rate', '0.13', 'Tasa de impuesto (IVA)'),
('currency', 'USD', 'Moneda utilizada'),
('low_stock_threshold', '10', 'Umbral de stock bajo'),
('order_due_days', '30', 'Días de vencimiento para órdenes'),
('timezone', 'America/La_Paz', 'Zona horaria'),
('language', 'es', 'Idioma de la aplicación');

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, cost, category, brand, sku) VALUES
('Producto Ejemplo 1', 'Descripción del producto 1', 25.00, 15.00, 'categoria1', 'Marca A', 'PRD001'),
('Producto Ejemplo 2', 'Descripción del producto 2', 32.50, 20.00, 'categoria2', 'Marca B', 'PRD002'),
('Producto Ejemplo 3', 'Descripción del producto 3', 15.75, 10.00, 'categoria1', 'Marca A', 'PRD003');

-- Insertar inventario inicial para los productos
INSERT INTO inventory (product_id, quantity, min_stock, max_stock) 
SELECT id, 100, 10, 500 FROM products;

-- Insertar clientes de ejemplo
INSERT INTO customers (name, email, phone, address, credit_limit) VALUES
('Cliente Ejemplo 1', 'cliente1@email.com', '+1234567890', 'Dirección Cliente 1', 1000.00),
('Cliente Ejemplo 2', 'cliente2@email.com', '+1234567891', 'Dirección Cliente 2', 1500.00),
('Cliente Contado', NULL, NULL, NULL, 0.00);

-- Insertar proveedores de ejemplo
INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES
('Proveedor Ejemplo 1', 'Juan Pérez', 'ventas@proveedor1.com', '+1234567892', 'Dirección Proveedor 1'),
('Proveedor Ejemplo 2', 'María García', 'compras@proveedor2.com', '+1234567893', 'Dirección Proveedor 2');

-- =====================================================
-- VERIFICACIONES FINALES
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar que todos los triggers se crearon
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY event_object_table, trigger_name;

-- Verificar que todas las políticas RLS se crearon
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
1. Este schema incluye todas las tablas necesarias para el sistema POS
2. Se incluyen todas las migraciones identificadas en el proyecto
3. Las políticas RLS están configuradas para permitir acceso a usuarios autenticados
4. Los triggers automatizan la actualización de campos updated_at
5. Los índices optimizan las consultas más frecuentes
6. Se incluyen datos de ejemplo para pruebas iniciales

Para usar este schema:
1. Copia todo el contenido y pégalo en el editor SQL de Supabase
2. Ejecuta el script completo
3. Configura las variables de entorno en tu aplicación
4. Verifica la conexión usando npm run dev

Para producción:
- Modifica las políticas RLS según tus necesidades de seguridad
- Elimina los datos de ejemplo si no los necesitas
- Ajusta la configuración inicial según tu empresa
*/

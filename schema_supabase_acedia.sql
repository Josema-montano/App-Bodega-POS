-- ==========================
-- Esquema POS e Inventario
-- ==========================

-- Tabla de usuarios (usando Supabase Auth como base)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'empleado')),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    costo DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    marca VARCHAR(100),
    sku VARCHAR(100) UNIQUE NOT NULL,
    codigo_barras VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de inventario
CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    stock_maximo INTEGER,
    ubicacion VARCHAR(100),
    ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    direccion TEXT,
    deuda_actual DECIMAL(10,2) DEFAULT 0,
    limite_credito DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(50),
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ventas
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id),
    usuario_id UUID REFERENCES usuarios(id) NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    impuesto DECIMAL(10,2) DEFAULT 0,
    metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'credito', 'cheque')),
    estado VARCHAR(50) DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada', 'reembolsada')),
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de venta
CREATE TABLE venta_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de órdenes de compra
CREATE TABLE ordenes_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proveedor_id UUID REFERENCES proveedores(id),
    usuario_id UUID REFERENCES usuarios(id) NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'recibida', 'cancelada')),
    fecha_orden TIMESTAMPTZ DEFAULT NOW(),
    fecha_prevista TIMESTAMPTZ,
    fecha_recepcion TIMESTAMPTZ,
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de orden
CREATE TABLE orden_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_id UUID REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    cantidad_recibida INTEGER DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de transacciones financieras
CREATE TABLE transacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
    categoria VARCHAR(100) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    descripcion TEXT,
    referencia_id UUID,
    referencia_tipo VARCHAR(50),
    metodo_pago VARCHAR(50) DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque', 'otro')),
    usuario_id UUID REFERENCES usuarios(id),
    fecha_transaccion TIMESTAMPTZ DEFAULT NOW(),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cuentas por cobrar
CREATE TABLE cuentas_cobrar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id),
    venta_id UUID REFERENCES ventas(id),
    monto DECIMAL(10,2) NOT NULL,
    monto_pagado DECIMAL(10,2) DEFAULT 0,
    fecha_vencimiento TIMESTAMPTZ NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado', 'vencido')),
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cuentas por pagar
CREATE TABLE cuentas_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proveedor_id UUID REFERENCES proveedores(id),
    orden_id UUID REFERENCES ordenes_compra(id),
    monto DECIMAL(10,2) NOT NULL,
    monto_pagado DECIMAL(10,2) DEFAULT 0,
    fecha_vencimiento TIMESTAMPTZ NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado', 'vencido')),
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
    leido BOOLEAN DEFAULT false,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración de la aplicación
CREATE TABLE configuracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

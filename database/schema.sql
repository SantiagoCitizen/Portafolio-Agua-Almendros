use almendros;

#==================================================================================================================
#Bloque de creacion de las tablas principales (sin llaves foraneas)

#1. Tabla de los roles de la purificadora (admin, repartidor, cliente, empresa)
Create table if not exists roles (
	id_rol int auto_increment primary key,
    nombre_rol varchar(50) not null
);

#2. Tabla de las colonias donde reparte la purificadora (si la colonia del usuario no está aqui, la purificadora no tiene servicio a esa colonia)
create table if not exists colonias (
	id_colonia int auto_increment primary key,
    nombre_colonia varchar(100)
);

#==================================================================================================================
#Fin del bloque de las tablas principales

#==================================================================================================================
#3. Tabla de usuarios
#Nota: apellido_materno queda como null, ya que puede existir una persona sin dos apellidos
create table if not exists usuarios (
	id_usuario int auto_increment primary key,
    nombre varchar(100) not null,
    apellido_paterno varchar(100) not null,
    apellido_materno varchar(100) null,
    telefono varchar(20) unique not null,
    password_hash varchar(255) not null,
    id_rol int not null,
    razon_social varchar(255) null,
    rfc varchar(15) null,
    foreign key (id_rol) references roles (id_rol)
);
#==================================================================================================================

#4. Tabla de las direcciones de los clientes
create table if not exists direcciones_clientes (
	id_direccion int auto_increment primary key,
    id_usuario int not null,
    id_colonia int not null,
    calle varchar(255) not null,
    numero varchar(50) not null,
    referencias_domicilio text null,
    foreign key (id_usuario) references usuarios (id_usuario),
    foreign key (id_colonia) references colonias (id_colonia)
);
#==================================================================================================================

#5. Tabla de ruta de los repartidores
create table if not exists repartidores_rutas (
	id_asignacion int auto_increment primary key,
    id_usuario_repartidor int not null,
    id_colonia int not null,
    estatus_disponibilidad boolean,
    foreign key (id_usuario_repartidor) references usuarios (id_usuario),
    foreign key (id_colonia) references colonias (id_colonia)
);
#==================================================================================================================

#6. Tabla de pedidos
create table if not exists pedidos (
	id_pedido int auto_increment primary key,
    id_cliente int not null,
    id_direccion int not null,
    cantidad_garrafones int not null,
    precio_unitario float not null,
    monto_total float not null,
    tipo_pago varchar(100) null,
    comprobante_url varchar(255) null,
	pago_confirmado boolean default false,
    estatus_entrega varchar(100) not null,
    notas_campo text null,
    fecha_hora_creacion timestamp default CURRENT_TIMESTAMP,
    id_repartidor_asignado int null,
    foreign key (id_cliente) references usuarios (id_usuario),
    foreign key (id_direccion) references direcciones_clientes (id_direccion),
    foreign key (id_repartidor_asignado) references usuarios (id_usuario)
);


#Modificacion: Columna tarifa especial
ALTER TABLE usuarios 
ADD COLUMN tarifa_especial float null AFTER rfc;

#Columna en usuarios para saber si estan trabajando hoy (registro de asistencia)
ALTER TABLE usuarios ADD COLUMN en_turno boolean default false;

#Columna en usuarios para saber si sigue siendo empleado (si sigue contratado)
ALTER TABLE usuarios ADD COLUMN estatus_contrato boolean default true;

#Tabla de configuracion para cambiar datos
CREATE TABLE IF NOT EXISTS configuracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    precio_garrafon DECIMAL(10,2) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL
);

#Valores base de la configuracion
INSERT INTO configuracion (precio_garrafon, whatsapp) 
VALUES (26.00, '9210000000');

#actualizar formato de fecha
UPDATE pedidos
SET fecha_hora_creacion = DATE_FORMAT(fecha_hora_creacion, '%d-%m-%Y %H:%i:%s')
WHERE fecha_hora_creacion IS NOT NULL;

UPDATE pedidos
SET fecha_hora_creacion = DATE_FORMAT(fecha_hora_creacion, '%d/%m/%Y');

SET SQL_SAFE_UPDATES = 0;

SET SQL_SAFE_UPDATES = 1;

ALTER TABLE pedidos ADD COLUMN notas_cliente TEXT NULL AFTER estatus_entrega;
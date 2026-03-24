CREATE DATABASE IF NOT EXISTS cie10_ontologia;
USE cie10_ontologia;

CREATE TABLE IF NOT EXISTS `auditoria` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario` VARCHAR(100) NOT NULL,
  `accion` VARCHAR(20) NOT NULL,
  `entidad` VARCHAR(50) NOT NULL,
  `entidad_id` VARCHAR(50) DEFAULT NULL,
  `datos_anteriores` JSON DEFAULT NULL,
  `datos_nuevos` JSON DEFAULT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `fecha_hora` DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `displayName` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'medico', 'enfermero') NOT NULL
);

INSERT IGNORE INTO `usuarios` (`id`, `username`, `password`, `displayName`, `role`) VALUES
(1, 'dr.garcia', 'Medico#2026', 'Dr. García', 'medico'),
(2, 'enf.lopez', 'Enfermero#2026', 'Enf. López', 'enfermero'),
(3, 'admin.sys', 'Admin#2026', 'Administrador', 'admin');

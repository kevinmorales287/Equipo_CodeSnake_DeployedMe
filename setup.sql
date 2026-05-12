-- setup.sql
-- Corre este archivo en MySQL Workbench o en la extensión MySQL de VS Code
-- Crea la base de datos, la tabla y carga el catálogo inicial

CREATE DATABASE IF NOT EXISTS expediente_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;

USE expediente_db;

CREATE TABLE IF NOT EXISTS abreviaturas (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  original   VARCHAR(20)  NOT NULL,
  expandido  VARCHAR(200) NOT NULL,
  seccion    VARCHAR(50)  NOT NULL DEFAULT 'general',
  creado_en  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_original_seccion (original, seccion)
);

-- Catálogo inicial (mismo que tenías en el JS, ahora en la base de datos)
INSERT IGNORE INTO abreviaturas (original, expandido, seccion) VALUES
-- Generales
('px',     'paciente',                                 'general'),
('dx',     'diagnóstico',                              'general'),
('tx',     'tratamiento',                              'general'),
('rx',     'receta',                                   'general'),
('cx',     'cirugía',                                  'general'),
('qx',     'quirúrgico',                               'general'),
('hx',     'historia clínica',                        'general'),
('sx',     'síntomas',                                 'general'),
-- Estudios
('RD',     'radiografía',                              'estudios'),
('ECG',    'electrocardiograma',                       'estudios'),
('TAC',    'tomografía axial computarizada',           'estudios'),
('RMN',    'resonancia magnética nuclear',             'estudios'),
('US',     'ultrasonido',                              'estudios'),
('BH',     'biometría hemática',                       'estudios'),
('QS',     'química sanguínea',                        'estudios'),
('EGO',    'examen general de orina',                  'estudios'),
-- Exploración física
('FC',     'frecuencia cardiaca',                      'exploracion'),
('FR',     'frecuencia respiratoria',                  'exploracion'),
('Temp',   'temperatura',                              'exploracion'),
('SpO2',   'saturación de oxígeno',                   'exploracion'),
('TA',     'tensión arterial',                         'exploracion'),
('Glasgow','escala de coma Glasgow',                   'exploracion'),
-- Diagnósticos
('DM2',    'diabetes mellitus tipo 2',                 'diagnostico'),
('HTA',    'hipertensión arterial',                    'diagnostico'),
('IAM',    'infarto agudo de miocardio',               'diagnostico'),
('EVC',    'evento vascular cerebral',                 'diagnostico'),
('EPOC',   'enfermedad pulmonar obstructiva crónica', 'diagnostico'),
-- Antecedentes
('AHF',    'antecedentes heredofamiliares',            'antecedentes'),
('APP',    'antecedentes personales patológicos',     'antecedentes'),
('APNP',   'antecedentes personales no patológicos',  'antecedentes'),
-- Tratamiento
('VO',     'vía oral',                                 'tratamiento'),
('IV',     'intravenosa',                              'tratamiento'),
('IM',     'intramuscular',                            'tratamiento'),
('SC',     'subcutánea',                               'tratamiento'),
('SL',     'sublingual',                               'tratamiento'),
('c/8h',   'cada 8 horas',                             'tratamiento'),
('c/12h',  'cada 12 horas',                            'tratamiento'),
('c/24h',  'cada 24 horas',                            'tratamiento');

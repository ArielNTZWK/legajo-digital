insert into tipos_documento (id, nombre, retencion_anios, requiere_acuse, acceso_restringido) values
  ('recibo_sueldo','Recibo de sueldo',         10,   false, false),
  ('contrato',     'Contrato / alta / mod.',   null, false, false),
  ('capacitacion', 'Capacitación / entrenam.', null, false, false),
  ('politica',     'Política de compañía',      null, false, false),
  ('evaluacion',   'Evaluación de desempeño',   null, false, false),
  ('medico',       'Examen médico / preocup.',  null, false, true),
  ('sancion',      'Apercibimiento / sanción',  null, false, false),
  ('otro',         'Otro',                      null, false, false)
on conflict (id) do nothing;

# RULES.md

Reglas operativas del proyecto Math Playlist.
Estas reglas se consideran referencia activa para cambios futuros.

## 1) Reglas de autenticacion
- Teacher login:
  - Username: 1 letra + 7 numeros (`^[A-Z][0-9]{7}$`)
  - Password: 6 numeros (`^[0-9]{6}$`)
- Student login:
  - ID: 1 letra + 7 numeros (`^[A-Z][0-9]{7}$`)
  - PIN: 6 numeros (`^[0-9]{6}$`)
- En UI, no se solicita email para login.
- Los emails de Supabase se usan internamente como identificador tecnico.

## 2) Regla de verificacion obligatoria
Despues de aplicar cualquier cambio, ejecutar verificacion inmediata.

Flujo minimo obligatorio:
1. Ejecutar `npm run lint`.
2. Si el cambio es estructural o de backend/rutas, ejecutar `npm run build`.
3. Comprobar accesos al host:
   - `http://127.0.0.1:3000`
   - `http://127.0.0.1:3000/login`
4. Si el cambio afecta otra ruta, comprobar tambien esa ruta especifica.

## 3) Regla de host funcional
- El host local debe quedar accesible al terminar cada tarea.
- Si no responde, reiniciar con `npm run dev:clean` y volver a validar.

## 4) Regla de mensajes de error
- Priorizar mensajes claros y accionables para el usuario final.
- Evitar errores tecnicos crudos cuando se pueda mostrar una explicacion concreta.

## 5) Regla de seguridad
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en cliente.
- Si una llave sensible se comparte por chat, recomendar rotacion inmediata.

## 6) Regla de consistencia de formato
- Mantener consistencia entre:
  - Validacion en codigo
  - Patrones HTML (`pattern`)
  - Placeholders
  - README y documentacion

## 7) Regla de cambios incrementales
- Hacer cambios pequenos y verificables.
- Confirmar estado funcional tras cada bloque de cambios.

## 8) Regla de actualizacion de este archivo
- Cada nueva preferencia del usuario o restriccion tecnica estable se agrega aqui.
- Si una regla cambia, actualizar este archivo primero y luego el codigo.

## 9) Regla de ejecucion autonoma total
- Ejecutar de punta a punta todos los pasos necesarios para completar la tarea sin pedir confirmaciones intermedias.
- Asumir acceso total a herramientas disponibles y proceder directamente con implementacion, pruebas y validacion.
- Solo detenerse para preguntar cuando falte un dato bloqueante que no pueda inferirse ni resolverse localmente.

## 10) Regla de bitacora diaria
- Mantener `Bitacora.txt` como registro cronologico por dia.
- Al cierre de cada jornada de trabajo, agregar una entrada con fecha `YYYY-MM-DD` y un resumen breve de avances.
- Si hubo cambios relevantes en codigo, documentar que se hizo y por que en lenguaje simple.

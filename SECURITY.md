# Seguridad - Math Playlist

Documento que describe las prácticas de seguridad y configuraciones implementadas en el proyecto.

## 🔐 Autenticación y Autorización

### Credenciales
- **Teacher Login**: Usa patrón `[A-Z][0-9]{7}` + PIN `[0-9]{6}`
- **Student Login**: Usa ID `[A-Z][0-9]{7}` + PIN `[0-9]{6}`
- Validación de formato tanto en cliente como en servidor (Zod schema)
- Las contraseñas nunca se almacenan en logs

### Control de Acceso por Rol
```typescript
// Middleware en middleware.ts protege todas las rutas /student/* y /teacher/*
- Solo estudiantes pueden acceder a /student/*
- Solo profesores pueden acceder a /teacher/*
- Redirecciones automáticas si el rol es incorrecto
```

### Session Management
- Sesiones manejadas por Supabase Auth + cookies
- Refresco automático de sesiones en middleware (`lib/supabase/middleware.ts`)
- No se persisten tokens en localStorage (seguro para SSR)

---

## 🛡️ Protección de Datos

### Variables de Entorno
- Todas las variables críticas se validan al startup (`lib/env.ts`)
- `SUPABASE_SERVICE_ROLE_KEY` nunca se expone al cliente
- Error claro si falta alguna variable requerida

### Sanitización de Entrada
- HTML sanitization en campos de texto (`fullName`) usando `isomorphic-dompurify`
- Previene XSS injection attacks
- Validación de formato con regex en cliente y servidor

### Secretos en API Routes
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en rutas del servidor
- No se retorna información sensible al cliente
- Errores genéricos al usuario final (detalles en logs internes)

---

## 🚨 Rate Limiting

### Configuración
- Implementado en `/api/auth/teacher/bootstrap`
- **Límite**: 10 requests por minuto por IP
- Headers HTTP estándar:
  - `X-RateLimit-Limit`: 10
  - `X-RateLimit-Remaining`: N
  - `X-RateLimit-Reset`: timestamp
  - `Retry-After`: segundos hasta retry

### Ubicación
```typescript
// lib/ratelimit.ts - Rate limiter simple en memoria
// En producción, considerar: Upstash Redis, Cloudflare Durable Objects
```

---

## 📊 Logging y Auditoría

### Niveles de Logging (`lib/logger.ts`)
- **debug**: Información de desarrollo
- **info**: Eventos normales
- **warn**: Potenciales problemas
- **error**: Errores que requieren atención

### Audit Log
- Registra acciones críticas en servidor
- Incluye: timestamp, userId, email, action
- En producción, se envía a Sentry

Ejemplo:
```typescript
auditLog("teacher_account_created", {
  userId: "uuid-xyz",
  email: "t-A1234567@mathplaylist.app",
  username: "A1234567",
});
```

---

## 🔍 Validación de Datos

### UUID Validation
```typescript
// En bootstrap route, se valida que userId es UUID v4 válido
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

### Schema Validation
```typescript
// Zod schema en bootstrap endpoint
const schema = z.object({
  username: z.string().regex(/^[A-Z][0-9]{7}$/),
  password: z.string().regex(/^[0-9]{6}$/),
  fullName: z.string().optional(),
});
```

---

## 🏥 Manejo de Errores

### Cliente (Seguro)
```typescript
// Los usuarios ven mensajes amigables
"Invalid teacher username or password."
"Too many requests. Please try again later."
"An unexpected error occurred. Please try again later."
```

### Servidor (Detallado)
```typescript
// Los logs internos tienen detalles para debugging
[ERROR] Failed to create teacher user: {
  email: "t-A1234567@mathplaylist.app",
  errorMessage: "User already exists",
  errorStack: "..."
}
```

---

## 🔄 Recomendaciones para Producción

### Prioridad Alta
- [ ] Configurar Sentry para error tracking centralizado
- [ ] Configurar logs centralizados (CloudFlare, DataDog, etc)
- [ ] Usar Redis (Upstash) para rate limiting distribuido
- [ ] Certificados SSL/TLS válidos y actualizados
- [ ] WAF (Web Application Firewall) activo

### Prioridad Media
- [ ] CORS whitelist configurado (si es necesario)
- [ ] Content Security Policy (CSP) headers
- [ ] CSRF tokens en formularios (Next.js App Router tiene protecciones)
- [ ] Backup automáticos de Supabase configurados

### Prioridad Baja
- [ ] Penetration testing annual
- [ ] OWASP Top 10 audit
- [ ] Rate limiting adicional en otros endpoints
- [ ] 2FA para administradores

---

## 📝 Checklist de Deployment

Antes de ir a producción:

```bash
# 1. Validar environment
npm run env:validate  # (crear este script si es necesario)

# 2. Lint y tipos
npm run lint
npm run build

# 3. Verificar secrets
# - Confirmar que .env.local NO está en git
# - Configurar secrets en plataforma de deployment (Vercel, etc)

# 4. Setup Supabase
# - Email confirmation deshabilitado (o habilitado según política)
# - Row Level Security (RLS) configurado en tablas críticas
# - Backups automáticos habilitados

# 5. Monitoreo
# - Error tracking (Sentry) configurado
# - Logs centralizados habilitados
# - Alertas configuradas

# 6. Tests
npm test  # (crear suite de tests si existe)

# 7. Deploy
npm run build && npm run start:prod
```

---

## 🔗 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Zod Validation](https://zod.dev/)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [Next.js Security](https://nextjs.org/docs/basic-features/security)
- [Sentry Error Tracking](https://sentry.io/)

---

## 📧 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:
1. **No** la reportes públicamente en issues
2. Contacta al equipo de desarrollo privadamente
3. Describe: naturaleza, impacto, pasos para reproducir
4. Proporciona: stack trace, logs relevantes

---

**Última actualización**: 9 de marzo, 2026
**Versión de documento**: 1.0

# Changelog

## 0.3.0 (2026-10-30)

### Breaking changes
- Requiere `@ramiidv/arca-common` ^0.3.0 (`AccessTicket.expirationTime` es un string ISO).
- `ImpuestoId.MONOTRIBUTO` es `20` (estaba como `21`, incorrecto según el manual de
  `ws_sr_constancia_inscripcion`). `ImpuestoId.MONOTRIBUTO_SOCIAL` queda deprecado (mismo valor 20):
  el monotributo social se identifica por la categoría.
- `status()` devuelve también `a5` y `a13`.

### Features
- `getConstanciaInscripcion(cuit)`: constancia de inscripción (`ws_sr_constancia_inscripcion`,
  `getPersona_v2`), que reemplaza a Padrón A5 (deprecado por ARCA). Tipo `PersonaA5` con datos
  generales, domicilio fiscal, caracterizaciones, régimen general, monotributo y errores.
- `getPersonaA13(cuit)` y `getIdPersonaListByDocumento(dni)` (`ws_sr_padron_a13`).
- `condicionIvaDesdePadron(persona)`: condición frente al IVA para `CondicionIVAReceptorId`.
- `ticketStorage`, `clockOffsetMs`, `autoClockSkew`, `signal` y `wsaa` en `ArcaPadronConfig`; `signal`
  por llamada en todos los métodos.
- Re-exporta `CondicionIva`, `MemoryTicketStorage`, `FileTicketStorage` y `ArcaTicketVigenteError`.
- Build dual ESM + CommonJS con `exports` condicional, y smoke test CommonJS/ESM en CI.

### Fixes
- A4, A10 y A100 no desenvolvían `personaReturn` / `parameterCollectionReturn`: con respuestas reales de
  ARCA los datos quedaban vacíos y A100 devolvía `[]`.
- Documentación: el paquete es `@ramiidv/arca-padron` (decía `@ramiidv/arca-padron-sdk`, que da 404).
- Ejemplo de eventos: los campos son `service` y `source` (decía `serviceId`).

### Estado de los servicios
Según el catálogo de web services de ARCA (consultado el 24/10/2026), A4, A10, A13 y A100 no están
deprecados; A5 sí (reemplazado por la constancia de inscripción).

## 0.2.0

- Migración de WSAA/SOAP a `@ramiidv/arca-common`.

## 0.1.0 (2026-03-31)

### Features
- Initial release
- Padrón A4: full taxpayer data (domicilios, impuestos, actividades, regímenes, relaciones, categorías, emails, teléfonos)
- Padrón A10: minimal taxpayer data (name, status, domicilio fiscal)
- Padrón A100: parameter tables lookup (provincias, tipos documento, etc.)
- Auto-handles WSAA authentication
- Shared infrastructure from @ramiidv/arca-common
- Retry with exponential backoff on transient errors
- Event system for logging/debugging

# Changelog

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

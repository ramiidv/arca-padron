# @ramiidv/arca-padron-sdk

SDK de TypeScript para los web services de Padron de ARCA (ex AFIP). Soporta los alcances A4 (datos completos), A10 (datos basicos) y A100 (tablas de parametros).

## Caracteristicas

- Zero dependencias SOAP: construye los envelopes SOAP manualmente
- Zero dependencias HTTP: usa `fetch` nativo (Node 18+)
- Firma CMS/PKCS#7 con node-forge
- ESM only
- TypeScript estricto con tipos completos
- Cache automatico de tokens WSAA
- Reintentos con backoff exponencial
- Sistema de eventos para monitoreo

## Instalacion

```bash
npm install @ramiidv/arca-padron-sdk
```

## Inicio rapido

```typescript
import { readFileSync } from 'fs';
import { ArcaPadron } from '@ramiidv/arca-padron-sdk';

const padron = new ArcaPadron({
  cert: readFileSync('./cert.pem', 'utf-8'),
  key: readFileSync('./key.pem', 'utf-8'),
  cuit: '20123456789',
  production: false, // false = homologacion
});

// Consulta completa (A4)
const contribuyente = await padron.getPersona('20123456789');
console.log(contribuyente.tipoPersona, contribuyente.nombre);

// Consulta basica (A10)
const contribuyenteBasico = await padron.getPersonaBasic('20123456789');
console.log(contribuyenteBasico.domicilio?.[0]?.direccion);

// Tablas de parametros (A100)
import { CollectionName } from '@ramiidv/arca-padron-sdk';
const provincias = await padron.getParametros(CollectionName.PROVINCIA);
console.log(provincias.length, 'provincias');
```

## Configuracion

```typescript
interface ArcaPadronConfig {
  /** Certificado X.509 en formato PEM */
  cert: string;
  /** Clave privada RSA en formato PEM */
  key: string;
  /** CUIT de la entidad representada */
  cuit: string;
  /** Usar endpoints de produccion (default: false) */
  production?: boolean;
  /** Cantidad de reintentos en errores 5xx/red (default: 1) */
  retries?: number;
  /** Delay base en ms para backoff exponencial (default: 1000) */
  retryDelayMs?: number;
  /** Callback de eventos para monitoreo */
  onEvent?: (event: ArcaPadronEvent) => void;
}
```

## API

### Metodos de alto nivel

#### `getPersona(cuit: string): Promise<PersonaA4>`

Obtiene los datos completos de un contribuyente via ws_sr_padron_a4. Autentica automaticamente con WSAA.

```typescript
const contribuyente = await padron.getPersona('20123456789');
```

#### `getPersonaBasic(cuit: string): Promise<PersonaA10>`

Obtiene los datos basicos de un contribuyente via ws_sr_padron_a10.

```typescript
const contribuyenteBasico = await padron.getPersonaBasic('20123456789');
```

#### `getParametros(collection: string): Promise<ParameterRecord[]>`

Obtiene una tabla de parametros via ws_sr_padron_a100.

```typescript
import { CollectionName } from '@ramiidv/arca-padron-sdk';

const provincias = await padron.getParametros(CollectionName.PROVINCIA);
const tiposDocumento = await padron.getParametros(CollectionName.TIPO_DOCUMENTO);
const tiposRelacion = await padron.getParametros(CollectionName.TIPO_RELACION);
```

Colecciones disponibles (enum `CollectionName`, valores SUPA.\* prefijados): `PROVINCIA`, `TIPO_DOCUMENTO`, `TIPO_DOMICILIO`, `TIPO_CLAVE`, `TIPO_EMPRESA_JURIDICA`, `TIPO_EMPRESA_JURIDICA_SUBGRUPO`, `TIPO_RELACION`, `TIPO_SUBTIPO_RELACION`, `TIPO_COMPONENTE_SOCIEDAD`, `TIPO_RELACION_COMPONENTE_SOC`, `TIPO_EMAIL`, `TIPO_TELEFONO`, `TIPO_RESIDENCIA`, `TIPO_DATO_ADICIONAL_DOMICILIO`, `ORGANISMO_INFORMANTE`, `ORGANISMO_CONTROL`, `PROVINCIA_SOCIEDAD_ORG`, `SEXO`, `CALLE`, `LOCALIDAD`.

#### `status(): Promise<{ a4: ServerStatus, a10: ServerStatus, a100: ServerStatus }>`

Verifica el estado de los tres servicios (no requiere autenticacion).

```typescript
const estadoServicios = await padron.status();
console.log(estadoServicios.a4.appserver); // "OK"
```

### Acceso a clientes de bajo nivel

Para casos avanzados, se pueden usar los clientes individuales directamente:

```typescript
const padron = new ArcaPadron({ /* ... */ });

// Obtener ticket de acceso manualmente
const ticket = await padron.wsaa.getAccessTicket('ws_sr_padron_a4');

const credenciales = {
  Token: ticket.token,
  Sign: ticket.sign,
  CuitRepresentada: '20123456789',
};

// Llamar directamente al servicio
const contribuyente = await padron.a4.getPersona(credenciales, '20123456789');
```

## Tipos de respuesta

### PersonaA4 (datos completos)

```typescript
interface PersonaA4 {
  idPersona: string;
  tipoPersona: 'FISICA' | 'JURIDICA';
  tipoClave?: string;
  estadoClave?: string;
  apellido?: string;
  nombre?: string;
  razonSocial?: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  fechaNacimiento?: string;
  sexo?: string;
  numeroInscripcion?: string;
  formaJuridica?: string;
  mesCierre?: number;
  fechaInscripcion?: string;
  fechaContratoSocial?: string;
  fechaFallecimiento?: string;
  fechaJubilado?: string;
  fechaVencimientoMigracion?: string;
  localidadInscripcion?: string;
  provinciaInscripcion?: string;
  organismoInscripcion?: string;
  organismoOriginante?: string;
  tipoOrganismoOriginante?: string;
  tipoResidencia?: string;
  porcentajeCapitalNacional?: number;
  cantidadSociosEmpresaMono?: number;
  leyJubilacion?: number;
  dependencia?: DependenciaA4;
  claveInactivaAsociada?: string[];
  domicilio?: DomicilioA4[];
  impuesto?: ImpuestoA4[];
  actividad?: ActividadA4[];
  regimen?: RegimenA4[];
  relacion?: RelacionA4[];
  categoria?: CategoriaA4[];
  email?: EmailA4[];
  telefono?: TelefonoA4[];
}
```

### PersonaA10 (datos basicos)

```typescript
interface PersonaA10 {
  idPersona: string;
  tipoPersona: 'FISICA' | 'JURIDICA';
  tipoClave?: string;
  estadoClave?: string;
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  idActividadPrincipal?: string;
  descripcionActividadPrincipal?: string;
  dependencia?: DependenciaA10;
  claveInactivaAsociada?: string[];
  domicilio?: DomicilioA10[];
}
```

### ParameterRecord (tablas A100)

```typescript
interface ParameterRecord {
  id: string;
  descripcion: string;
  atributos?: ParameterAttribute[];
}

interface ParameterAttribute {
  name: string;
  value: string;
}
```

## Manejo de errores

El SDK usa una jerarquia de errores de 4 clases:

```
Error
  └── ArcaPadronError (base)
        ├── ArcaAuthError (errores de WSAA)
        ├── ArcaPadronServiceError (errores de negocio)
        └── ArcaSoapError (errores HTTP/transporte)
```

```typescript
import {
  ArcaAuthError,
  ArcaPadronServiceError,
  ArcaSoapError,
} from '@ramiidv/arca-padron-sdk';

try {
  await padron.getPersona('20123456789');
} catch (error) {
  if (error instanceof ArcaAuthError) {
    // Certificado vencido, servicio no autorizado, WSAA caido
    console.error('Error de autenticacion:', error.message);
  } else if (error instanceof ArcaPadronServiceError) {
    // Errores de negocio (CUIT no encontrada, etc.)
    for (const detalle of error.errors) {
      console.error(`[${detalle.code}] ${detalle.msg}`);
    }
  } else if (error instanceof ArcaSoapError) {
    // Errores HTTP/red
    console.error('Error HTTP:', error.statusCode, error.message);
  }
}
```

## Eventos

El SDK emite eventos para monitoreo y debugging:

```typescript
const padron = new ArcaPadron({
  // ...
  onEvent: (evento) => {
    switch (evento.type) {
      case 'auth:login':
        console.log(`Login para ${evento.serviceId}`);
        break;
      case 'auth:cache-hit':
        console.log(`Token cacheado para ${evento.serviceId}`);
        break;
      case 'request:start':
        console.log(`Inicio ${evento.method}`);
        break;
      case 'request:end':
        console.log(`Fin ${evento.method} (${evento.durationMs}ms)`);
        break;
      case 'request:retry':
        console.log(`Reintento #${evento.attempt}`);
        break;
      case 'request:error':
        console.log(`Error: ${evento.error.message}`);
        break;
    }
  },
});
```

## Enums utiles

```typescript
import {
  Provincia,
  TipoDomicilio,
  TipoPersona,
  ImpuestoId,
  CollectionName,
} from '@ramiidv/arca-padron-sdk';

// Verificar si el contribuyente esta inscripto en IVA
const tieneIva = contribuyente.impuesto?.some(
  (imp) => imp.idImpuesto === ImpuestoId.IVA_RESPONSABLE_INSCRIPTO && imp.estado === 'AC'
);
```

## Requisitos

- Node.js >= 18 (soporte nativo de `fetch`)
- Certificado digital emitido por ARCA/AFIP
- Autorizacion para los servicios web correspondientes

## Licencia

MIT

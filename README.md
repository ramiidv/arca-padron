# @ramiidv/arca-padron

SDK de TypeScript para los web services de Padron de ARCA (ex AFIP): Constancia de Inscripcion
(`ws_sr_constancia_inscripcion`, ex A5), A4 (datos completos), A10 y A13 (datos basicos) y A100
(tablas de parametros). Incluye `condicionIvaDesdePadron` para obtener la condicion frente al IVA
que pide la factura electronica (`CondicionIVAReceptorId`).

## Caracteristicas

- Zero dependencias SOAP: construye los envelopes SOAP manualmente
- Zero dependencias HTTP: usa `fetch` nativo (Node 18+)
- Firma CMS/PKCS#7 con node-forge
- ESM y CommonJS (funciona con `import` y con `require`, incluido TypeScript con `"module": "CommonJS"`)
- TypeScript estricto con tipos completos
- Cache automatico de tokens WSAA, con persistencia opcional (`ticketStorage`) y ajuste de reloj
- Cancelacion con `AbortSignal` (global o por llamada)
- Reintentos con backoff exponencial
- Sistema de eventos para monitoreo

## Instalacion

```bash
npm install @ramiidv/arca-padron
```

## Inicio rapido

```typescript
import { readFileSync } from 'fs';
import { ArcaPadron, FileTicketStorage } from '@ramiidv/arca-padron';

const padron = new ArcaPadron({
  cert: readFileSync('./cert.pem', 'utf-8'),
  key: readFileSync('./key.pem', 'utf-8'),
  cuit: '20123456789',
  production: false, // false = homologacion
  ticketStorage: new FileTicketStorage('./.arca-tickets'), // recomendado
});

// Constancia de inscripcion (ex A5) + condicion frente al IVA para facturar
import { condicionIvaDesdePadron } from '@ramiidv/arca-padron';
const constancia = await padron.getConstanciaInscripcion('30712345674');
const { condicionIva, motivo } = condicionIvaDesdePadron(constancia);
// condicionIva: CondicionIva.RESPONSABLE_INSCRIPTO (1), motivo: "Inscripto en IVA (impuesto 30)."

// Consulta completa (A4)
const contribuyente = await padron.getPersona('20123456789');
console.log(contribuyente.tipoPersona, contribuyente.nombre);

// Consulta basica (A10)
const contribuyenteBasico = await padron.getPersonaBasic('20123456789');
console.log(contribuyenteBasico.domicilio?.[0]?.direccion);

// Tablas de parametros (A100)
import { CollectionName } from '@ramiidv/arca-padron';
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
  onEvent?: (event: ArcaEvent) => void;
  /** Persistencia de tickets WSAA entre reinicios (recomendado) */
  ticketStorage?: TicketStorage;
  /** Desfase relojARCA - relojLocal en ms (default: 0) */
  clockOffsetMs?: number;
  /** Ajustar el desfase si WSAA rechaza el login por reloj (default: true) */
  autoClockSkew?: boolean;
  /** Cancela todas las llamadas de la instancia */
  signal?: AbortSignal;
  /** WsaaClient compartido (ej: `arca.wsaa` de arca-facturacion con el mismo certificado) */
  wsaa?: WsaaClient;
}
```

> **Persisti el Ticket de Acceso.** WSAA rechaza el login si ya hay un TA vigente para el
> certificado y servicio. Sin `ticketStorage`, un reinicio del proceso te deja sin poder consultar
> hasta que venza (hasta 12 horas, `ArcaTicketVigenteError`). Ver `TicketStorage` en
> [`@ramiidv/arca-common`](https://github.com/ramiidv/arca-common).

Si usas tambien `@ramiidv/arca-facturacion` con el mismo certificado, comparti el cliente WSAA:

```typescript
const arca = new Arca({ cuit, cert, key, ticketStorage });
const padron = new ArcaPadron({ cuit: String(cuit), cert, key, wsaa: arca.wsaa });
```

Todos los metodos aceptan un ultimo parametro opcional `{ signal }`.

## API

### Metodos de alto nivel

#### `getConstanciaInscripcion(cuit: string): Promise<PersonaA5>`

Constancia de inscripcion via `ws_sr_constancia_inscripcion` (metodo `getPersona_v2`). Reemplaza a
Padron A5 (`ws_sr_padron_a5`), deprecado por ARCA. Incluye datos generales, domicilio fiscal,
caracterizaciones, regimen general (impuestos, actividades, regimenes), monotributo (categoria,
impuestos, actividad) y, si ARCA no puede emitir la constancia, `errorConstancia`.

```typescript
const constancia = await padron.getConstanciaInscripcion('30712345674');
constancia.domicilioFiscal;        // { direccion, localidad, codPostal, idProvincia, ... }
constancia.impuestos;              // impuestos de ambos regimenes
constancia.monotributo?.categoria; // { idCategoria, descripcionCategoria, ... }
```

#### `condicionIvaDesdePadron(persona): { condicionIva: CondicionIva | null; motivo: string }`

Funcion pura (no consulta ARCA). Acepta una constancia (`PersonaA5`) o una persona de A4:

| Padron | `condicionIva` |
| --- | --- |
| Monotributo activo (impuesto 20 o categoria) | `MONOTRIBUTISTA` (6) |
| Monotributo social (categorias 61, 99, 100) | `MONOTRIBUTO_SOCIAL` (13) |
| Trabajador independiente promovido | `MONOTRIBUTO_INDEPENDIENTE_PROMOVIDO` (16) |
| IVA activo (impuesto 30) | `RESPONSABLE_INSCRIPTO` (1) |
| IVA exento (impuesto 32) | `EXENTO` (4) |
| IVA no alcanzado (impuesto 34) | `IVA_NO_ALCANZADO` (15) |
| Ninguno de los anteriores, o constancia no emitida | `null` (con el motivo) |

Si el padron no alcanza, devuelve `null` en lugar de asumir consumidor final: decidilo segun la
operacion. Fuente: manual de `ws_sr_constancia_inscripcion` v4.1 (impuestos 20 y 30, estado `AC`,
categorias de monotributo social). Los impuestos 32 y 34 se reconocen tambien por su descripcion.

#### `getPersonaA13(cuit: string): Promise<PersonaA13>`

Datos basicos via `ws_sr_padron_a13`. Tambien `getIdPersonaListByDocumento(dni)` devuelve los
CUIT/CUIL asociados a un documento.

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
import { CollectionName } from '@ramiidv/arca-padron';

const provincias = await padron.getParametros(CollectionName.PROVINCIA);
const tiposDocumento = await padron.getParametros(CollectionName.TIPO_DOCUMENTO);
const tiposRelacion = await padron.getParametros(CollectionName.TIPO_RELACION);
```

Colecciones disponibles (enum `CollectionName`, valores SUPA.\* prefijados): `PROVINCIA`, `TIPO_DOCUMENTO`, `TIPO_DOMICILIO`, `TIPO_CLAVE`, `TIPO_EMPRESA_JURIDICA`, `TIPO_EMPRESA_JURIDICA_SUBGRUPO`, `TIPO_RELACION`, `TIPO_SUBTIPO_RELACION`, `TIPO_COMPONENTE_SOCIEDAD`, `TIPO_RELACION_COMPONENTE_SOC`, `TIPO_EMAIL`, `TIPO_TELEFONO`, `TIPO_RESIDENCIA`, `TIPO_DATO_ADICIONAL_DOMICILIO`, `ORGANISMO_INFORMANTE`, `ORGANISMO_CONTROL`, `PROVINCIA_SOCIEDAD_ORG`, `SEXO`, `CALLE`, `LOCALIDAD`.

#### `status(): Promise<{ a5, a4, a10, a13, a100 }>`

Verifica el estado de los servicios (no requiere autenticacion).

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

Clientes disponibles: `padron.wsaa`, `padron.a5` (constancia), `padron.a4`, `padron.a10`,
`padron.a13`, `padron.a100`.

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
  └── ArcaError (base, de @ramiidv/arca-common)
        ├── ArcaPadronError
        ├── ArcaAuthError (errores de WSAA)
        │     └── ArcaTicketVigenteError (TA vigente que no esta en memoria ni en el storage)
        ├── ArcaServiceError
        │     └── ArcaPadronServiceError (errores de negocio)
        └── ArcaSoapError (errores HTTP/transporte, SOAP Faults)
```

Todos tienen un `code` estable y `instanceof` funciona aunque haya mas de una copia del paquete
cargada. ARCA informa "persona inexistente" y similares como SOAP Fault (`ArcaSoapError` con
`faultString`).

```typescript
import {
  ArcaAuthError,
  ArcaPadronServiceError,
  ArcaSoapError,
} from '@ramiidv/arca-padron';

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
        console.log(`Login para ${evento.service}`);
        break;
      case 'auth:cache-hit':
        console.log(`Token reutilizado para ${evento.service} (${evento.source})`);
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
} from '@ramiidv/arca-padron';

// Verificar si el contribuyente esta inscripto en IVA (mejor: condicionIvaDesdePadron)
const tieneIva = contribuyente.impuesto?.some(
  (imp) => imp.idImpuesto === ImpuestoId.IVA_RESPONSABLE_INSCRIPTO && imp.estado === 'ACTIVO'
);

// ImpuestoId.MONOTRIBUTO = 20 (antes figuraba como 21, que era incorrecto)
```

## Requisitos

- Node.js >= 18 (soporte nativo de `fetch`)
- Certificado digital emitido por ARCA/AFIP
- Autorizacion para los servicios web correspondientes: `ws_sr_constancia_inscripcion`,
  `ws_sr_padron_a4`, `ws_sr_padron_a10`, `ws_sr_padron_a13`, `ws_sr_padron_a100` (cada uno por separado)

## Licencia

MIT

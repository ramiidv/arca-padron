// Shared types from common
export type {
  AccessTicket,
  ArcaEvent,
  ServerStatus,
  SoapCallOptions,
  TicketStorage,
  CallOptions,
} from '@ramiidv/arca-common';
import type { ArcaEvent, CondicionIva, TicketStorage, WsaaClient } from '@ramiidv/arca-common';

// ---------------------------------------------------------------------------
// Backward-compatible alias
// ---------------------------------------------------------------------------

/** @deprecated Use ArcaEvent from @ramiidv/arca-common instead. */
export type ArcaPadronEvent = ArcaEvent;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ArcaPadronConfig {
  /** PEM-encoded X.509 certificate */
  cert: string;
  /** PEM-encoded RSA private key */
  key: string;
  /** CUIT of the entity represented (e.g. "20123456789") */
  cuit: string;
  /** Use production endpoints (default: false = testing / homologacion) */
  production?: boolean;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retries on 5xx / network errors (default: 1) */
  retries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  retryDelayMs?: number;
  /** Optional event callback */
  onEvent?: (event: ArcaEvent) => void;
  /**
   * Persistencia de Tickets de Acceso entre reinicios. Sin storage, al
   * reiniciar el proceso WSAA rechaza el login hasta que venza el ticket
   * anterior (`ArcaTicketVigenteError`).
   */
  ticketStorage?: TicketStorage;
  /** Diferencia `relojARCA - relojLocal` en ms (default: 0). */
  clockOffsetMs?: number;
  /** Ajustar el desfase de reloj si WSAA rechaza el login (default: true). */
  autoClockSkew?: boolean;
  /** Signal global: cancela todas las llamadas de esta instancia. */
  signal?: AbortSignal;
  /**
   * WsaaClient compartido (ej: `arca.wsaa` de arca-facturacion, mismo
   * certificado). Si se provee, se ignoran `cert`, `key`, `ticketStorage`,
   * `clockOffsetMs` y `autoClockSkew`.
   */
  wsaa?: WsaaClient;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export interface WsAuth {
  Token: string;
  Sign: string;
  CuitRepresentada: string;
}

// ---------------------------------------------------------------------------
// Padron A4 - Full persona
// ---------------------------------------------------------------------------

export interface DependenciaA4 {
  idDependencia: number;
  descripcionDependencia: string;
}

export interface DomicilioA4 {
  direccion: string;
  localidad?: string;
  codPostal?: string;
  idProvincia?: number;
  descripcionProvincia?: string;
  tipoDomicilio: string;
  estadoDomicilio?: string;
  datoAdicional?: string;
  tipoDatoAdicional?: string;
  orden?: number;
}

export interface ImpuestoA4 {
  idImpuesto: number;
  descripcionImpuesto?: string;
  estado: string;
  periodo?: number;
  diaPeriodo?: number;
  ffInscripcion?: string;
}

export interface ActividadA4 {
  idActividad: string;
  descripcionActividad?: string;
  nomenclador?: number;
  orden?: number;
  periodo?: number;
}

export interface RegimenA4 {
  idRegimen: number;
  descripcionRegimen?: string;
  estado?: string;
  periodo?: number;
  diaPeriodo?: number;
  tipoRegimen?: string;
  idImpuesto?: number;
}

export interface RelacionA4 {
  idPersona: string;
  idPersonaAsociada?: string;
  tipoRelacion?: string;
  subtipoRelacion?: string;
  ffRelacion?: string;
  ffVencimiento?: string;
}

export interface CategoriaA4 {
  idCategoria: number;
  descripcionCategoria?: string;
  idImpuesto?: number;
  estado?: string;
  periodo?: number;
}

export interface EmailA4 {
  direccion: string;
  tipoEmail?: string;
  estado?: string;
}

export interface TelefonoA4 {
  numero: string;
  tipoTelefono?: string;
  tipoLinea?: string;
}

export interface PersonaA4 {
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

// ---------------------------------------------------------------------------
// Padron A10 - Minimal persona
// ---------------------------------------------------------------------------

export interface DependenciaA10 {
  idDependencia: number;
  descripcionDependencia: string;
}

export interface DomicilioA10 {
  direccion?: string;
  localidad?: string;
  codPostal?: string;
  idProvincia?: number;
  descripcionProvincia?: string;
  tipoDomicilio?: string;
  datoAdicional?: string;
  tipoDatoAdicional?: string;
}

export interface PersonaA10 {
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

// ---------------------------------------------------------------------------
// Padron A100 - Parameter tables
// ---------------------------------------------------------------------------

export interface ParameterAttribute {
  name: string;
  value: string;
}

export interface ParameterRecord {
  id: string;
  descripcion: string;
  atributos?: ParameterAttribute[];
}

// ---------------------------------------------------------------------------
// Padrón A13
// ---------------------------------------------------------------------------

export interface DomicilioA13 {
  direccion?: string;
  calle?: string;
  numero?: number;
  piso?: string;
  oficinaDptoLocal?: string;
  sector?: string;
  torre?: string;
  manzana?: string;
  codigoPostal?: string;
  localidad?: string;
  idProvincia?: number;
  descripcionProvincia?: string;
  tipoDomicilio?: string;
  estadoDomicilio?: string;
  datoAdicional?: string;
  tipoDatoAdicional?: string;
}

export interface PersonaA13 {
  idPersona: string;
  tipoPersona: 'FISICA' | 'JURIDICA';
  tipoClave?: string;
  estadoClave?: string;
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  formaJuridica?: string;
  mesCierre?: number;
  fechaNacimiento?: string;
  fechaFallecimiento?: string;
  fechaContratoSocial?: string;
  idActividadPrincipal?: string;
  descripcionActividadPrincipal?: string;
  periodoActividadPrincipal?: number;
  claveInactivaAsociada?: string[];
  domicilio?: DomicilioA13[];
}

// ---------------------------------------------------------------------------
// Constancia de inscripción (ws_sr_constancia_inscripcion, ex Padrón A5)
// ---------------------------------------------------------------------------

export interface DomicilioA5 {
  direccion?: string;
  localidad?: string;
  codPostal?: string;
  idProvincia?: number;
  descripcionProvincia?: string;
  tipoDomicilio?: string;
  datoAdicional?: string;
  tipoDatoAdicional?: string;
}

export interface DependenciaA5 {
  idDependencia?: number;
  descripcionDependencia?: string;
  direccion?: string;
  localidad?: string;
  codPostal?: string;
  idProvincia?: number;
  descripcionProvincia?: string;
}

export interface CaracterizacionA5 {
  idCaracterizacion: number;
  descripcionCaracterizacion?: string;
  periodo?: number;
  /** Desde 11/02/2026 (opcional) */
  fechaSolicitud?: number;
}

export interface ImpuestoA5 {
  idImpuesto: number;
  descripcionImpuesto?: string;
  /** Estado en SUPA (ej: "AC" = activo) */
  estadoImpuesto?: string;
  motivo?: string;
  periodo?: number;
}

export interface ActividadA5 {
  idActividad: string;
  descripcionActividad?: string;
  nomenclador?: number;
  orden?: number;
  periodo?: number;
}

export interface CategoriaA5 {
  idCategoria: number;
  descripcionCategoria?: string;
  idImpuesto?: number;
  periodo?: number;
}

export interface RegimenA5 {
  idRegimen: number;
  descripcionRegimen?: string;
  idImpuesto?: number;
  periodo?: number;
  tipoRegimen?: string;
}

export interface RegimenGeneralA5 {
  impuestos: ImpuestoA5[];
  actividades: ActividadA5[];
  regimenes: RegimenA5[];
  categoriaAutonomo?: CategoriaA5;
}

export interface MonotributoA5 {
  impuestos: ImpuestoA5[];
  actividades: ActividadA5[];
  actividadMonotributista?: ActividadA5;
  categoria?: CategoriaA5;
}

export interface ErrorConstanciaA5 {
  /** Mensajes de error (ej: "La CUIT no está activa", constancia bloqueada, etc.) */
  error: string[];
  idPersona?: string;
  nombre?: string;
  apellido?: string;
}

export interface ErrorRegimenA5 {
  error: string[];
  mensaje?: string;
}

/**
 * Constancia de inscripción de un contribuyente (`getPersona_v2`).
 *
 * Si ARCA no puede emitir la constancia, los datos pueden venir incompletos y
 * `errorConstancia` / `errorRegimenGeneral` / `errorMonotributo` indican por qué.
 */
export interface PersonaA5 {
  idPersona: string;
  tipoPersona?: 'FISICA' | 'JURIDICA';
  tipoClave?: string;
  estadoClave?: string;
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  mesCierre?: number;
  fechaContratoSocial?: string;
  fechaFallecimiento?: string;
  esSucesion?: string;
  domicilioFiscal?: DomicilioA5;
  dependencia?: DependenciaA5;
  caracterizacion?: CaracterizacionA5[];
  /** Régimen general (IVA, ganancias, autónomos, etc.). Ausente si no está inscripto. */
  regimenGeneral?: RegimenGeneralA5;
  /** Monotributo (categoría e impuestos). Ausente si no es monotributista. */
  monotributo?: MonotributoA5;
  /** Impuestos de ambos regímenes, juntos. */
  impuestos: ImpuestoA5[];
  errorConstancia?: ErrorConstanciaA5;
  errorRegimenGeneral?: ErrorRegimenA5;
  errorMonotributo?: ErrorRegimenA5;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export interface CondicionIvaPadron {
  /**
   * Condición frente al IVA (`CondicionIVAReceptorId` de WSFEv1), o `null` si
   * el padrón no alcanza para determinarla (ver `motivo`).
   */
  condicionIva: CondicionIva | null;
  /** Explicación legible de cómo se determinó (o por qué no se pudo). */
  motivo: string;
}

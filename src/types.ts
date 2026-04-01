// Shared types from common
export type { AccessTicket, ArcaEvent, ServerStatus, SoapCallOptions } from '@ramiidv/arca-common';
import type { ArcaEvent } from '@ramiidv/arca-common';

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

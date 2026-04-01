// Main class
export { ArcaPadron } from './arca-padron.js';

// Error classes (base from common, domain-specific local)
export {
  ArcaError,
  ArcaAuthError,
  ArcaSoapError,
  ArcaServiceError,
  ArcaPadronError,
  ArcaPadronServiceError,
} from './errors.js';

// Base class
export { BasePadronClient, type PadronClientConfig } from './base-client.js';

// Low-level clients
export { WsaaClient } from './wsaa.js';
export type { WsaaClientConfig } from './wsaa.js';
export { PadronA4Client, type PadronA4ClientConfig } from './padron-a4.js';
export { PadronA10Client, type PadronA10ClientConfig } from './padron-a10.js';
export { PadronA100Client, type PadronA100ClientConfig } from './padron-a100.js';

// Types
export type {
  ArcaPadronConfig,
  AccessTicket,
  WsAuth,
  SoapCallOptions,
  ServerStatus,
  ArcaEvent,
  ArcaPadronEvent,
  PersonaA4,
  DependenciaA4,
  DomicilioA4,
  ImpuestoA4,
  ActividadA4,
  RegimenA4,
  RelacionA4,
  CategoriaA4,
  EmailA4,
  TelefonoA4,
  PersonaA10,
  DependenciaA10,
  DomicilioA10,
  ParameterRecord,
  ParameterAttribute,
} from './types.js';

// Constants and enums
export {
  ENDPOINTS,
  Provincia,
  TipoDocumento,
  TipoDomicilio,
  TipoPersona,
  ImpuestoId,
  EstadoClave,
  CollectionName,
} from './constants.js';

// Utilities (from common)
export { ensureArray, parseXml, buildXml, checkServiceErrors } from './soap-client.js';

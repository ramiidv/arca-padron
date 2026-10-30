// Base errors re-exported from common
export { ArcaError, ArcaAuthError, ArcaSoapError, ArcaServiceError, ArcaTicketVigenteError } from '@ramiidv/arca-common';
import { ArcaError, ArcaServiceError } from '@ramiidv/arca-common';

/**
 * Base error for Padrón SDK.
 * Extends ArcaError from common for backward compatibility.
 */
export class ArcaPadronError extends ArcaError {
  static override readonly code: string = 'ARCA_PADRON_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ArcaPadronError';
  }
}

/**
 * Error de servicio de Padrón (errores de negocio).
 * Extiende ArcaServiceError de common.
 */
export class ArcaPadronServiceError extends ArcaServiceError {
  static override readonly code: string = 'ARCA_PADRON_SERVICE_ERROR';

  constructor(message: string, errors: { code: number; msg: string }[]) {
    super(message, errors);
    this.name = 'ArcaPadronServiceError';
  }
}

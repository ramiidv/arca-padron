// Base errors re-exported from common
export { ArcaError, ArcaAuthError, ArcaSoapError, ArcaServiceError } from '@ramiidv/arca-common';
import { ArcaError, ArcaServiceError } from '@ramiidv/arca-common';

/**
 * Base error for Padrón SDK.
 * Extends ArcaError from common for backward compatibility.
 */
export class ArcaPadronError extends ArcaError {
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
  constructor(message: string, errors: { code: number; msg: string }[]) {
    super(message, errors);
    this.name = 'ArcaPadronServiceError';
  }
}

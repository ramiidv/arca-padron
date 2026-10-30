import { WsaaClient, anySignal } from '@ramiidv/arca-common';
import type { ArcaEvent, CallOptions, SoapCallOptions } from '@ramiidv/arca-common';
import { ENDPOINTS } from './constants.js';
import { PadronA4Client } from './padron-a4.js';
import { PadronA5Client } from './padron-a5.js';
import { PadronA10Client } from './padron-a10.js';
import { PadronA13Client } from './padron-a13.js';
import { PadronA100Client } from './padron-a100.js';
import type {
  ArcaPadronConfig,
  ParameterRecord,
  PersonaA4,
  PersonaA5,
  PersonaA10,
  PersonaA13,
  ServerStatus,
  WsAuth,
} from './types.js';

/**
 * Main orchestrator class for ARCA Padrón web services.
 *
 * Provides high-level methods that handle WSAA authentication automatically
 * and expose results from the Constancia de Inscripción (ex A5), A4 (full),
 * A10 (basic), A13 (basic) and A100 (parameters) web services.
 *
 * @example
 * ```ts
 * import { ArcaPadron, condicionIvaDesdePadron, FileTicketStorage } from '@ramiidv/arca-padron';
 * import { readFileSync } from 'fs';
 *
 * const client = new ArcaPadron({
 *   cert: readFileSync('cert.pem', 'utf-8'),
 *   key: readFileSync('key.pem', 'utf-8'),
 *   cuit: '20123456789',
 *   production: false,
 *   ticketStorage: new FileTicketStorage('./.arca-tickets'),
 * });
 *
 * const persona = await client.getConstanciaInscripcion('30712345674');
 * const { condicionIva, motivo } = condicionIvaDesdePadron(persona);
 * ```
 */
export class ArcaPadron {
  /** Low-level WSAA client for direct access (se puede compartir con arca-facturacion) */
  public readonly wsaa: WsaaClient;
  /** Low-level Constancia de Inscripción (ex Padrón A5) client */
  public readonly a5: PadronA5Client;
  /** Low-level Padrón A4 client for direct access */
  public readonly a4: PadronA4Client;
  /** Low-level Padrón A10 client for direct access */
  public readonly a10: PadronA10Client;
  /** Low-level Padrón A13 client for direct access */
  public readonly a13: PadronA13Client;
  /** Low-level Padrón A100 client for direct access */
  public readonly a100: PadronA100Client;

  private readonly cuit: string;
  private readonly signal?: AbortSignal;

  constructor(config: ArcaPadronConfig) {
    const isProduction = config.production ?? false;
    const env = isProduction ? 'production' : 'testing';
    this.cuit = config.cuit;
    this.signal = config.signal;
    const onEvent: ((event: ArcaEvent) => void) | undefined = config.onEvent;

    const soapOptions: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'> = {
      timeout: config.timeout,
      retries: config.retries,
      retryDelayMs: config.retryDelayMs,
    };

    this.wsaa =
      config.wsaa ??
      new WsaaClient({
        cert: config.cert,
        key: config.key,
        production: isProduction,
        timeout: config.timeout,
        retries: config.retries,
        retryDelayMs: config.retryDelayMs,
        onEvent,
        ticketStorage: config.ticketStorage,
        clockOffsetMs: config.clockOffsetMs,
        autoClockSkew: config.autoClockSkew,
      });

    const clientConfig = (svc: { testing: string; production: string; namespace: string }) => ({
      endpoint: svc[env],
      namespace: svc.namespace,
      soapOptions,
      onEvent,
    });

    this.a5 = new PadronA5Client(clientConfig(ENDPOINTS.a5));
    this.a4 = new PadronA4Client(clientConfig(ENDPOINTS.a4));
    this.a10 = new PadronA10Client(clientConfig(ENDPOINTS.a10));
    this.a13 = new PadronA13Client(clientConfig(ENDPOINTS.a13));
    this.a100 = new PadronA100Client(clientConfig(ENDPOINTS.a100));
  }

  /**
   * Constancia de inscripción (ws_sr_constancia_inscripcion, ex Padrón A5):
   * datos generales, domicilio fiscal, impuestos del régimen general y
   * monotributo. Combinar con `condicionIvaDesdePadron` para facturar.
   * @param cuit - CUIT of the taxpayer to query
   */
  async getConstanciaInscripcion(cuit: string, call?: CallOptions): Promise<PersonaA5> {
    const opts = this.opts(call);
    const auth = await this.getAuth(ENDPOINTS.a5.serviceId, opts);
    return this.a5.getPersona(auth, cuit, opts);
  }

  /**
   * Get full taxpayer data (Padrón A4) for a given CUIT.
   * Authenticates automatically via WSAA.
   * @param cuit - CUIT of the taxpayer to query
   */
  async getPersona(cuit: string, call?: CallOptions): Promise<PersonaA4> {
    const opts = this.opts(call);
    const auth = await this.getAuth(ENDPOINTS.a4.serviceId, opts);
    return this.a4.getPersona(auth, cuit, opts);
  }

  /**
   * Get basic taxpayer data (Padrón A10) for a given CUIT.
   * Authenticates automatically via WSAA.
   * @param cuit - CUIT of the taxpayer to query
   */
  async getPersonaBasic(cuit: string, call?: CallOptions): Promise<PersonaA10> {
    const opts = this.opts(call);
    const auth = await this.getAuth(ENDPOINTS.a10.serviceId, opts);
    return this.a10.getPersona(auth, cuit, opts);
  }

  /**
   * Get basic taxpayer data (Padrón A13) for a given CUIT.
   * @param cuit - CUIT of the taxpayer to query
   */
  async getPersonaA13(cuit: string, call?: CallOptions): Promise<PersonaA13> {
    const opts = this.opts(call);
    const auth = await this.getAuth(ENDPOINTS.a13.serviceId, opts);
    return this.a13.getPersona(auth, cuit, opts);
  }

  /**
   * CUITs/CUILs asociados a un número de documento (Padrón A13).
   * @param documento - Número de documento (DNI)
   */
  async getIdPersonaListByDocumento(documento: string, call?: CallOptions): Promise<string[]> {
    const opts = this.opts(call);
    const auth = await this.getAuth(ENDPOINTS.a13.serviceId, opts);
    return this.a13.getIdPersonaListByDocumento(auth, documento, opts);
  }

  /**
   * Get a parameter table (Padrón A100) by collection name.
   * Authenticates automatically via WSAA.
   * @param collection - Name of the collection (e.g. CollectionName.PROVINCIA, CollectionName.TIPO_DOCUMENTO)
   */
  async getParametros(collection: string, call?: CallOptions): Promise<ParameterRecord[]> {
    const opts = this.opts(call);
    const auth = await this.getAuth(ENDPOINTS.a100.serviceId, opts);
    return this.a100.getParameterCollectionByName(auth, collection, opts);
  }

  /**
   * Health check for the Padrón services.
   * Does not require authentication.
   */
  async status(call?: CallOptions): Promise<{
    a5: ServerStatus;
    a4: ServerStatus;
    a10: ServerStatus;
    a13: ServerStatus;
    a100: ServerStatus;
  }> {
    const opts = this.opts(call);
    const [a5, a4, a10, a13, a100] = await Promise.all([
      this.a5.dummy(opts),
      this.a4.dummy(opts),
      this.a10.dummy(opts),
      this.a13.dummy(opts),
      this.a100.dummy(opts),
    ]);
    return { a5, a4, a10, a13, a100 };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private opts(call?: CallOptions): CallOptions {
    return { signal: anySignal(this.signal, call?.signal) };
  }

  private async getAuth(serviceId: string, opts?: CallOptions): Promise<WsAuth> {
    const ticket = await this.wsaa.getAccessTicket(serviceId, opts);
    return {
      Token: ticket.token,
      Sign: ticket.sign,
      CuitRepresentada: this.cuit,
    };
  }
}

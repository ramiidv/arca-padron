import { WsaaClient } from '@ramiidv/arca-common';
import type { ArcaEvent, SoapCallOptions } from '@ramiidv/arca-common';
import { ENDPOINTS } from './constants.js';
import { PadronA4Client } from './padron-a4.js';
import { PadronA10Client } from './padron-a10.js';
import { PadronA100Client } from './padron-a100.js';
import type {
  ArcaPadronConfig,
  ParameterRecord,
  PersonaA4,
  PersonaA10,
  ServerStatus,
  WsAuth,
} from './types.js';

/**
 * Main orchestrator class for ARCA Padrón web services.
 *
 * Provides high-level methods that handle WSAA authentication automatically
 * and expose results from the A4 (full), A10 (basic), and A100 (parameters)
 * web services.
 *
 * @example
 * ```ts
 * import { ArcaPadron } from '@ramiidv/arca-padron';
 * import { readFileSync } from 'fs';
 *
 * const client = new ArcaPadron({
 *   cert: readFileSync('cert.pem', 'utf-8'),
 *   key: readFileSync('key.pem', 'utf-8'),
 *   cuit: '20123456789',
 *   production: false,
 * });
 *
 * const persona = await client.getPersona('20123456789');
 * console.log(persona.tipoPersona, persona.nombre);
 * ```
 */
export class ArcaPadron {
  /** Low-level WSAA client for direct access */
  public readonly wsaa: WsaaClient;
  /** Low-level Padrón A4 client for direct access */
  public readonly a4: PadronA4Client;
  /** Low-level Padrón A10 client for direct access */
  public readonly a10: PadronA10Client;
  /** Low-level Padrón A100 client for direct access */
  public readonly a100: PadronA100Client;

  private readonly cuit: string;
  private readonly onEvent?: (event: ArcaEvent) => void;

  constructor(config: ArcaPadronConfig) {
    const isProduction = config.production ?? false;
    const env = isProduction ? 'production' : 'testing';
    this.cuit = config.cuit;
    this.onEvent = config.onEvent;

    const soapOptions: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'> = {
      timeout: config.timeout,
      retries: config.retries,
      retryDelayMs: config.retryDelayMs,
    };

    this.wsaa = new WsaaClient({
      cert: config.cert,
      key: config.key,
      production: isProduction,
      timeout: config.timeout,
      retries: config.retries,
      retryDelayMs: config.retryDelayMs,
      onEvent: config.onEvent,
    });

    this.a4 = new PadronA4Client({
      endpoint: ENDPOINTS.a4[env],
      namespace: ENDPOINTS.a4.namespace,
      soapOptions,
      onEvent: config.onEvent,
    });

    this.a10 = new PadronA10Client({
      endpoint: ENDPOINTS.a10[env],
      namespace: ENDPOINTS.a10.namespace,
      soapOptions,
      onEvent: config.onEvent,
    });

    this.a100 = new PadronA100Client({
      endpoint: ENDPOINTS.a100[env],
      namespace: ENDPOINTS.a100.namespace,
      soapOptions,
      onEvent: config.onEvent,
    });
  }

  /**
   * Get full taxpayer data (Padrón A4) for a given CUIT.
   * Authenticates automatically via WSAA.
   * @param cuit - CUIT of the taxpayer to query
   */
  async getPersona(cuit: string): Promise<PersonaA4> {
    const auth = await this.getAuth(ENDPOINTS.a4.serviceId);
    return this.a4.getPersona(auth, cuit);
  }

  /**
   * Get basic taxpayer data (Padrón A10) for a given CUIT.
   * Authenticates automatically via WSAA.
   * @param cuit - CUIT of the taxpayer to query
   */
  async getPersonaBasic(cuit: string): Promise<PersonaA10> {
    const auth = await this.getAuth(ENDPOINTS.a10.serviceId);
    return this.a10.getPersona(auth, cuit);
  }

  /**
   * Get a parameter table (Padrón A100) by collection name.
   * Authenticates automatically via WSAA.
   * @param collection - Name of the collection (e.g. CollectionName.PROVINCIA, CollectionName.TIPO_DOCUMENTO)
   */
  async getParametros(collection: string): Promise<ParameterRecord[]> {
    const auth = await this.getAuth(ENDPOINTS.a100.serviceId);
    return this.a100.getParameterCollectionByName(auth, collection);
  }

  /**
   * Health check for all three Padrón services.
   * Does not require authentication.
   */
  async status(): Promise<{ a4: ServerStatus; a10: ServerStatus; a100: ServerStatus }> {
    const [a4, a10, a100] = await Promise.all([
      this.a4.dummy(),
      this.a10.dummy(),
      this.a100.dummy(),
    ]);
    return { a4, a10, a100 };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async getAuth(serviceId: string): Promise<WsAuth> {
    const ticket = await this.wsaa.getAccessTicket(serviceId);
    return {
      Token: ticket.token,
      Sign: ticket.sign,
      CuitRepresentada: this.cuit,
    };
  }
}

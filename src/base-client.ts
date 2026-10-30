import { afipSoapCall } from './soap-client.js';
import type { ArcaEvent, CallOptions, SoapCallOptions, ServerStatus } from '@ramiidv/arca-common';
import type { WsAuth } from './types.js';

/** Shared configuration for all Padrón service clients. */
export interface PadronClientConfig {
  /** SOAP endpoint URL */
  endpoint: string;
  /** SOAP namespace */
  namespace: string;
  /** SOAP call options (retries, timeout) */
  soapOptions?: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'>;
  /** Optional event callback */
  onEvent?: (event: ArcaEvent) => void;
}

/**
 * Abstract base class for Padrón web service clients.
 * Provides shared constructor logic and health-check method.
 *
 * Los WS de Padrón declaran los parámetros sin namespace
 * (`elementFormDefault="unqualified"`): `afipSoapCall` de arca-common prefija
 * el método y deja los parámetros sin namespace. Todas las consultas se
 * reintentan ante errores transitorios.
 */
export abstract class BasePadronClient {
  protected readonly endpoint: string;
  protected readonly namespace: string;
  protected readonly soapOptions?: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'>;
  protected readonly onEvent?: (event: ArcaEvent) => void;

  constructor(config: PadronClientConfig) {
    this.endpoint = config.endpoint;
    this.namespace = config.namespace;
    this.soapOptions = config.soapOptions;
    this.onEvent = config.onEvent;
  }

  /** Llama a un método del servicio. */
  protected call(
    method: string,
    params: Record<string, unknown>,
    opts?: CallOptions,
  ): Promise<Record<string, unknown>> {
    return afipSoapCall(this.endpoint, this.namespace, method, params, {
      ...this.soapOptions,
      onEvent: this.onEvent,
      signal: opts?.signal,
    });
  }

  /** Parámetros de autenticación en el orden del WSDL: token, sign, cuitRepresentada. */
  protected authParams(auth: WsAuth): Record<string, unknown> {
    return {
      token: auth.Token,
      sign: auth.Sign,
      cuitRepresentada: auth.CuitRepresentada,
    };
  }

  /** Health check for this service. */
  async dummy(opts?: CallOptions): Promise<ServerStatus> {
    const result = await this.call('dummy', {}, opts);

    return {
      appserver: (result['appserver'] ?? '') as string,
      dbserver: (result['dbserver'] ?? '') as string,
      authserver: (result['authserver'] ?? '') as string,
    };
  }
}

import { afipSoapCall } from '@ramiidv/arca-common';
import type { ArcaEvent, SoapCallOptions, ServerStatus } from '@ramiidv/arca-common';

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

  /** Health check for this service. */
  async dummy(): Promise<ServerStatus> {
    const result = await afipSoapCall(
      this.endpoint,
      this.namespace,
      'dummy',
      {},
      { ...this.soapOptions, onEvent: this.onEvent },
    );

    return {
      appserver: (result['appserver'] ?? '') as string,
      dbserver: (result['dbserver'] ?? '') as string,
      authserver: (result['authserver'] ?? '') as string,
    };
  }
}

import { afipSoapCall, ensureArray } from './soap-client.js';
import { BasePadronClient, type PadronClientConfig } from './base-client.js';
import type {
  ParameterRecord,
  WsAuth,
} from './types.js';

export type PadronA100ClientConfig = PadronClientConfig;

/**
 * Client for ws_sr_padron_a100 - Parameter tables.
 */
export class PadronA100Client extends BasePadronClient {
  /**
   * Get a parameter table by collection name.
   * @param auth - Authentication object with Token, Sign, and CuitRepresentada
   * @param collectionName - Name of the collection to query (e.g. "SUPA.E_PROVINCIA")
   */
  async getParameterCollectionByName(
    auth: WsAuth,
    collectionName: string,
  ): Promise<ParameterRecord[]> {
    const params = {
      token: auth.Token,
      sign: auth.Sign,
      cuitRepresentada: auth.CuitRepresentada,
      collectionName: collectionName,
    };

    const result = await afipSoapCall(
      this.endpoint,
      this.namespace,
      'getParameterCollectionByName',
      params,
      { ...this.soapOptions, onEvent: this.onEvent },
    );

    // Extract parameter collection
    const collection = result['parameterCollection'] as Record<string, unknown> | undefined;
    if (!collection) {
      return [];
    }

    type R = Record<string, unknown>;
    const parameterList = ensureArray<R>((collection['parameterList'] ?? []) as R | R[]);

    return parameterList.map((p) => {
      const attrList = ensureArray<R>((p['attributeList'] ?? []) as R | R[]);
      const atributos = attrList.map((a) => ({
        name: String(a['name'] ?? ''),
        value: String(a['value'] ?? ''),
      }));

      return {
        id: String(p['id'] ?? ''),
        descripcion: String(p['description'] ?? ''),
        atributos: atributos.length > 0 ? atributos : undefined,
      };
    });
  }
}

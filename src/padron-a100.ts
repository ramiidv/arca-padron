import { ensureArray } from './soap-client.js';
import type { CallOptions } from '@ramiidv/arca-common';
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
    opts?: CallOptions,
  ): Promise<ParameterRecord[]> {
    const result = await this.call(
      'getParameterCollectionByName',
      { ...this.authParams(auth), collectionName },
      opts,
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

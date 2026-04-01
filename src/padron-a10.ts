import { afipSoapCall, ensureArray } from './soap-client.js';
import { BasePadronClient, type PadronClientConfig } from './base-client.js';
import type {
  PersonaA10,
  WsAuth,
} from './types.js';

export type PadronA10ClientConfig = PadronClientConfig;

/**
 * Client for ws_sr_padron_a10 - Minimal taxpayer data.
 */
export class PadronA10Client extends BasePadronClient {
  /**
   * Get minimal taxpayer data for a given CUIT.
   * @param auth - Authentication object with Token, Sign, and CuitRepresentada
   * @param cuit - CUIT of the taxpayer to query
   */
  async getPersona(auth: WsAuth, cuit: string): Promise<PersonaA10> {
    const params = {
      token: auth.Token,
      sign: auth.Sign,
      cuitRepresentada: auth.CuitRepresentada,
      idPersona: cuit,
    };

    const result = await afipSoapCall(
      this.endpoint,
      this.namespace,
      'getPersona',
      params,
      { ...this.soapOptions, onEvent: this.onEvent },
    );

    // Extract persona data
    const persona = (result['persona'] ?? result) as Record<string, unknown>;

    return this.mapPersona(persona);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private mapPersona(raw: Record<string, unknown>): PersonaA10 {
    const persona: PersonaA10 = {
      idPersona: String(raw['idPersona'] ?? ''),
      tipoPersona: (raw['tipoPersona'] ?? 'FISICA') as 'FISICA' | 'JURIDICA',
      tipoClave: raw['tipoClave'] as string | undefined,
      estadoClave: raw['estadoClave'] as string | undefined,
      nombre: raw['nombre'] as string | undefined,
      apellido: raw['apellido'] as string | undefined,
      razonSocial: raw['razonSocial'] as string | undefined,
      numeroDocumento: raw['numeroDocumento'] != null
        ? String(raw['numeroDocumento'])
        : undefined,
      tipoDocumento: raw['tipoDocumento'] as string | undefined,
      idActividadPrincipal: raw['idActividadPrincipal'] != null
        ? String(raw['idActividadPrincipal'])
        : undefined,
      descripcionActividadPrincipal: raw['descripcionActividadPrincipal'] as string | undefined,
    };

    // Dependencia (single object)
    const dep = raw['dependencia'] as Record<string, unknown> | undefined;
    if (dep) {
      persona.dependencia = {
        idDependencia: Number(dep['idDependencia'] ?? 0),
        descripcionDependencia: String(dep['descripcionDependencia'] ?? ''),
      };
    }

    // claveInactivaAsociada (array of strings)
    const clavesInactivas = raw['claveInactivaAsociada'];
    if (clavesInactivas) {
      persona.claveInactivaAsociada = ensureArray<string>(clavesInactivas as string | string[]);
    }

    // Domicilio (array)
    type R = Record<string, unknown>;
    const domicilios = raw['domicilio'];
    if (domicilios) {
      persona.domicilio = ensureArray<R>(domicilios as R | R[]).map((d) => ({
        direccion: d['direccion'] as string | undefined,
        localidad: d['localidad'] as string | undefined,
        codPostal: d['codPostal'] as string | undefined,
        idProvincia: d['idProvincia'] != null ? Number(d['idProvincia']) : undefined,
        descripcionProvincia: d['descripcionProvincia'] as string | undefined,
        tipoDomicilio: d['tipoDomicilio'] as string | undefined,
        datoAdicional: d['datoAdicional'] as string | undefined,
        tipoDatoAdicional: d['tipoDatoAdicional'] as string | undefined,
      }));
    }

    return persona;
  }
}

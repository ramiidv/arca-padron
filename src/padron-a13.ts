import { ensureArray } from './soap-client.js';
import type { CallOptions } from '@ramiidv/arca-common';
import { optNumber as num, optString as str, records as list, type SoapRecord as R } from './mapping.js';
import { BasePadronClient, type PadronClientConfig } from './base-client.js';
import type { DomicilioA13, PersonaA13, WsAuth } from './types.js';

export type PadronA13ClientConfig = PadronClientConfig;

/**
 * Client for ws_sr_padron_a13 - Datos básicos de un contribuyente.
 */
export class PadronA13Client extends BasePadronClient {
  /**
   * Datos de un contribuyente por CUIT.
   * @param auth - Authentication object with Token, Sign, and CuitRepresentada
   * @param cuit - CUIT of the taxpayer to query
   * @param opts - Opciones por llamada (signal)
   */
  async getPersona(auth: WsAuth, cuit: string, opts?: CallOptions): Promise<PersonaA13> {
    const result = await this.call('getPersona', { ...this.authParams(auth), idPersona: cuit }, opts);
    return mapPersonaA13((result['persona'] ?? result) as R);
  }

  /**
   * CUITs/CUILs asociados a un número de documento.
   * @param documento - Número de documento (DNI)
   */
  async getIdPersonaListByDocumento(auth: WsAuth, documento: string, opts?: CallOptions): Promise<string[]> {
    const result = await this.call('getIdPersonaListByDocumento', { ...this.authParams(auth), documento }, opts);
    return ensureArray(result['idPersona'] as unknown).map((id) => String(id));
  }
}

function mapDomicilio(d: R): DomicilioA13 {
  return {
    direccion: str(d['direccion']),
    calle: str(d['calle']),
    numero: num(d['numero']),
    piso: str(d['piso']),
    oficinaDptoLocal: str(d['oficinaDptoLocal']),
    sector: str(d['sector']),
    torre: str(d['torre']),
    manzana: str(d['manzana']),
    codigoPostal: str(d['codigoPostal']),
    localidad: str(d['localidad']),
    idProvincia: num(d['idProvincia']),
    descripcionProvincia: str(d['descripcionProvincia']),
    tipoDomicilio: str(d['tipoDomicilio']),
    estadoDomicilio: str(d['estadoDomicilio']),
    datoAdicional: str(d['datoAdicional']),
    tipoDatoAdicional: str(d['tipoDatoAdicional']),
  };
}

export function mapPersonaA13(raw: R): PersonaA13 {
  const persona: PersonaA13 = {
    idPersona: String(raw['idPersona'] ?? ''),
    tipoPersona: (raw['tipoPersona'] ?? 'FISICA') as 'FISICA' | 'JURIDICA',
    tipoClave: str(raw['tipoClave']),
    estadoClave: str(raw['estadoClave']),
    nombre: str(raw['nombre']),
    apellido: str(raw['apellido']),
    razonSocial: str(raw['razonSocial']),
    numeroDocumento: str(raw['numeroDocumento']),
    tipoDocumento: str(raw['tipoDocumento']),
    formaJuridica: str(raw['formaJuridica']),
    mesCierre: num(raw['mesCierre']),
    fechaNacimiento: str(raw['fechaNacimiento']),
    fechaFallecimiento: str(raw['fechaFallecimiento']),
    fechaContratoSocial: str(raw['fechaContratoSocial']),
    idActividadPrincipal: str(raw['idActividadPrincipal']),
    descripcionActividadPrincipal: str(raw['descripcionActividadPrincipal']),
    periodoActividadPrincipal: num(raw['periodoActividadPrincipal']),
  };
  if (raw['claveInactivaAsociada'] !== undefined) {
    persona.claveInactivaAsociada = ensureArray(raw['claveInactivaAsociada'] as unknown).map(String);
  }
  if (raw['domicilio'] !== undefined) {
    persona.domicilio = list(raw['domicilio']).map(mapDomicilio);
  }
  return persona;
}

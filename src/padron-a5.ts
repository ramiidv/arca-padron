import { ensureArray } from './soap-client.js';
import type { CallOptions } from '@ramiidv/arca-common';
import { BasePadronClient, type PadronClientConfig } from './base-client.js';
import type {
  ActividadA5,
  CategoriaA5,
  DomicilioA5,
  ErrorRegimenA5,
  ImpuestoA5,
  PersonaA5,
  WsAuth,
} from './types.js';

export type PadronA5ClientConfig = PadronClientConfig;

type R = Record<string, unknown>;

const str = (v: unknown): string | undefined => (v === undefined || v === null ? undefined : String(v));
const num = (v: unknown): number | undefined => (v === undefined || v === null || v === '' ? undefined : Number(v));
const list = (v: unknown): R[] => ensureArray(v as R | R[] | undefined);

/**
 * Client for ws_sr_constancia_inscripcion (ex ws_sr_padron_a5, deprecado por
 * ARCA) - Constancia de inscripción: datos generales, domicilio fiscal,
 * impuestos del régimen general y monotributo.
 *
 * Usa `getPersona_v2`, el método vigente según el manual del servicio (v4.1).
 */
export class PadronA5Client extends BasePadronClient {
  /**
   * Constancia de inscripción de un contribuyente.
   * @param auth - Authentication object with Token, Sign, and CuitRepresentada
   * @param cuit - CUIT of the taxpayer to query
   * @param opts - Opciones por llamada (signal)
   */
  async getPersona(auth: WsAuth, cuit: string, opts?: CallOptions): Promise<PersonaA5> {
    const result = await this.call('getPersona_v2', { ...this.authParams(auth), idPersona: cuit }, opts);
    return mapPersonaA5(result);
  }
}

function mapDomicilio(d: R | undefined): DomicilioA5 | undefined {
  if (!d) return undefined;
  return {
    direccion: str(d['direccion']),
    localidad: str(d['localidad']),
    codPostal: str(d['codPostal']),
    idProvincia: num(d['idProvincia']),
    descripcionProvincia: str(d['descripcionProvincia']),
    tipoDomicilio: str(d['tipoDomicilio']),
    datoAdicional: str(d['datoAdicional']),
    tipoDatoAdicional: str(d['tipoDatoAdicional']),
  };
}

function mapImpuesto(i: R): ImpuestoA5 {
  return {
    idImpuesto: Number(i['idImpuesto'] ?? 0),
    descripcionImpuesto: str(i['descripcionImpuesto']),
    estadoImpuesto: str(i['estadoImpuesto']),
    motivo: str(i['motivo']),
    periodo: num(i['periodo']),
  };
}

function mapActividad(a: R): ActividadA5 {
  return {
    idActividad: String(a['idActividad'] ?? ''),
    descripcionActividad: str(a['descripcionActividad']),
    nomenclador: num(a['nomenclador']),
    orden: num(a['orden']),
    periodo: num(a['periodo']),
  };
}

function mapCategoria(c: R | undefined): CategoriaA5 | undefined {
  if (!c) return undefined;
  return {
    idCategoria: Number(c['idCategoria'] ?? 0),
    descripcionCategoria: str(c['descripcionCategoria']),
    idImpuesto: num(c['idImpuesto']),
    periodo: num(c['periodo']),
  };
}

function mapErrorRegimen(e: R | undefined): ErrorRegimenA5 | undefined {
  if (!e) return undefined;
  return { error: ensureArray(e['error'] as unknown).map(String), mensaje: str(e['mensaje']) };
}

/** Mapea `personaReturn` de `getPersona_v2`. */
export function mapPersonaA5(raw: R): PersonaA5 {
  const g = (raw['datosGenerales'] ?? {}) as R;
  const rg = raw['datosRegimenGeneral'] as R | undefined;
  const mt = raw['datosMonotributo'] as R | undefined;
  const ec = raw['errorConstancia'] as R | undefined;

  const persona: PersonaA5 = {
    idPersona: String(g['idPersona'] ?? ec?.['idPersona'] ?? ''),
    tipoPersona: str(g['tipoPersona']) as PersonaA5['tipoPersona'],
    tipoClave: str(g['tipoClave']),
    estadoClave: str(g['estadoClave']),
    nombre: str(g['nombre'] ?? ec?.['nombre']),
    apellido: str(g['apellido'] ?? ec?.['apellido']),
    razonSocial: str(g['razonSocial']),
    mesCierre: num(g['mesCierre']),
    fechaContratoSocial: str(g['fechaContratoSocial']),
    fechaFallecimiento: str(g['fechaFallecimiento']),
    esSucesion: str(g['esSucesion']),
    domicilioFiscal: mapDomicilio(g['domicilioFiscal'] as R | undefined),
    impuestos: [],
  };

  const dep = g['dependencia'] as R | undefined;
  if (dep) {
    persona.dependencia = {
      idDependencia: num(dep['idDependencia']),
      descripcionDependencia: str(dep['descripcionDependencia']),
      direccion: str(dep['direccion']),
      localidad: str(dep['localidad']),
      codPostal: str(dep['codPostal']),
      idProvincia: num(dep['idProvincia']),
      descripcionProvincia: str(dep['descripcionProvincia']),
    };
  }

  if (g['caracterizacion'] !== undefined) {
    persona.caracterizacion = list(g['caracterizacion']).map((c) => ({
      idCaracterizacion: Number(c['idCaracterizacion'] ?? 0),
      descripcionCaracterizacion: str(c['descripcionCaracterizacion']),
      periodo: num(c['periodo']),
      fechaSolicitud: num(c['fechaSolicitud']),
    }));
  }

  if (rg) {
    persona.regimenGeneral = {
      impuestos: list(rg['impuesto']).map(mapImpuesto),
      actividades: list(rg['actividad']).map(mapActividad),
      regimenes: list(rg['regimen']).map((r) => ({
        idRegimen: Number(r['idRegimen'] ?? 0),
        descripcionRegimen: str(r['descripcionRegimen']),
        idImpuesto: num(r['idImpuesto']),
        periodo: num(r['periodo']),
        tipoRegimen: str(r['tipoRegimen']),
      })),
      categoriaAutonomo: mapCategoria(rg['categoriaAutonomo'] as R | undefined),
    };
  }

  if (mt) {
    const actividadMonotributista = mt['actividadMonotributista'] as R | undefined;
    persona.monotributo = {
      impuestos: list(mt['impuesto']).map(mapImpuesto),
      actividades: list(mt['actividad']).map(mapActividad),
      actividadMonotributista: actividadMonotributista ? mapActividad(actividadMonotributista) : undefined,
      categoria: mapCategoria(mt['categoriaMonotributo'] as R | undefined),
    };
  }

  persona.impuestos = [...(persona.regimenGeneral?.impuestos ?? []), ...(persona.monotributo?.impuestos ?? [])];

  if (ec) {
    persona.errorConstancia = {
      error: ensureArray(ec['error'] as unknown).map(String),
      idPersona: str(ec['idPersona']),
      nombre: str(ec['nombre']),
      apellido: str(ec['apellido']),
    };
  }
  persona.errorRegimenGeneral = mapErrorRegimen(raw['errorRegimenGeneral'] as R | undefined);
  persona.errorMonotributo = mapErrorRegimen(raw['errorMonotributo'] as R | undefined);
  if (!persona.errorRegimenGeneral) delete persona.errorRegimenGeneral;
  if (!persona.errorMonotributo) delete persona.errorMonotributo;

  return persona;
}

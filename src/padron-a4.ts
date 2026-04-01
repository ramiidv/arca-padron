import { afipSoapCall, ensureArray } from './soap-client.js';
import { BasePadronClient, type PadronClientConfig } from './base-client.js';
import type {
  PersonaA4,
  WsAuth,
} from './types.js';

export type PadronA4ClientConfig = PadronClientConfig;

/**
 * Client for ws_sr_padron_a4 - Full taxpayer data.
 */
export class PadronA4Client extends BasePadronClient {
  /**
   * Get full taxpayer data for a given CUIT.
   * @param auth - Authentication object with Token, Sign, and CuitRepresentada
   * @param cuit - CUIT of the taxpayer to query
   */
  async getPersona(auth: WsAuth, cuit: string): Promise<PersonaA4> {
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

  private mapPersona(raw: Record<string, unknown>): PersonaA4 {
    const data = (raw['datosGenerales'] ?? raw) as Record<string, unknown>;

    const persona: PersonaA4 = {
      idPersona: String(data['idPersona'] ?? ''),
      tipoPersona: (data['tipoPersona'] ?? 'FISICA') as 'FISICA' | 'JURIDICA',
      tipoClave: data['tipoClave'] as string | undefined,
      estadoClave: data['estadoClave'] as string | undefined,
      nombre: data['nombre'] as string | undefined,
      apellido: data['apellido'] as string | undefined,
      razonSocial: data['razonSocial'] as string | undefined,
      numeroDocumento: data['numeroDocumento'] != null
        ? String(data['numeroDocumento'])
        : undefined,
      tipoDocumento: data['tipoDocumento'] as string | undefined,
      fechaNacimiento: data['fechaNacimiento'] as string | undefined,
      sexo: data['sexo'] as string | undefined,
      numeroInscripcion: data['numeroInscripcion'] != null
        ? String(data['numeroInscripcion'])
        : undefined,
      formaJuridica: data['formaJuridica'] as string | undefined,
      mesCierre: data['mesCierre'] != null
        ? Number(data['mesCierre'])
        : undefined,
      fechaInscripcion: data['fechaInscripcion'] as string | undefined,
      fechaContratoSocial: data['fechaContratoSocial'] as string | undefined,
      fechaFallecimiento: data['fechaFallecimiento'] as string | undefined,
      fechaJubilado: data['fechaJubilado'] as string | undefined,
      fechaVencimientoMigracion: data['fechaVencimientoMigracion'] as string | undefined,
      localidadInscripcion: data['localidadInscripcion'] as string | undefined,
      provinciaInscripcion: data['provinciaInscripcion'] as string | undefined,
      organismoInscripcion: data['organismoInscripcion'] as string | undefined,
      organismoOriginante: data['organismoOriginante'] as string | undefined,
      tipoOrganismoOriginante: data['tipoOrganismoOriginante'] as string | undefined,
      tipoResidencia: data['tipoResidencia'] as string | undefined,
      porcentajeCapitalNacional: data['porcentajeCapitalNacional'] != null
        ? Number(data['porcentajeCapitalNacional'])
        : undefined,
      cantidadSociosEmpresaMono: data['cantidadSociosEmpresaMono'] != null
        ? Number(data['cantidadSociosEmpresaMono'])
        : undefined,
      leyJubilacion: data['leyJubilacion'] != null
        ? Number(data['leyJubilacion'])
        : undefined,
    };

    // Dependencia (single object)
    const dep = data['dependencia'] as Record<string, unknown> | undefined;
    if (dep) {
      persona.dependencia = {
        idDependencia: Number(dep['idDependencia'] ?? 0),
        descripcionDependencia: String(dep['descripcionDependencia'] ?? ''),
      };
    }

    // claveInactivaAsociada (array of strings)
    const clavesInactivas = raw['claveInactivaAsociada'] ?? data['claveInactivaAsociada'];
    if (clavesInactivas) {
      persona.claveInactivaAsociada = ensureArray<string>(clavesInactivas as string | string[]);
    }

    // Array fields - always normalize to arrays
    type R = Record<string, unknown>;

    const domicilios = raw['domicilio'] ?? data['domicilio'];
    if (domicilios) {
      persona.domicilio = ensureArray<R>(domicilios as R | R[]).map((d) => ({
        direccion: String(d['direccion'] ?? ''),
        localidad: d['localidad'] as string | undefined,
        codPostal: d['codPostal'] as string | undefined,
        idProvincia: d['idProvincia'] != null ? Number(d['idProvincia']) : undefined,
        descripcionProvincia: d['descripcionProvincia'] as string | undefined,
        tipoDomicilio: String(d['tipoDomicilio'] ?? ''),
        estadoDomicilio: d['estadoDomicilio'] as string | undefined,
        datoAdicional: d['datoAdicional'] as string | undefined,
        tipoDatoAdicional: d['tipoDatoAdicional'] as string | undefined,
        orden: d['orden'] != null ? Number(d['orden']) : undefined,
      }));
    }

    const impuestos = raw['impuesto'] ?? data['impuesto'];
    if (impuestos) {
      persona.impuesto = ensureArray<R>(impuestos as R | R[]).map((i) => ({
        idImpuesto: Number(i['idImpuesto'] ?? 0),
        descripcionImpuesto: i['descripcionImpuesto'] as string | undefined,
        estado: String(i['estado'] ?? ''),
        periodo: i['periodo'] != null ? Number(i['periodo']) : undefined,
        diaPeriodo: i['diaPeriodo'] != null ? Number(i['diaPeriodo']) : undefined,
        ffInscripcion: i['ffInscripcion'] as string | undefined,
      }));
    }

    const actividades = raw['actividad'] ?? data['actividad'];
    if (actividades) {
      persona.actividad = ensureArray<R>(actividades as R | R[]).map((a) => ({
        idActividad: String(a['idActividad'] ?? ''),
        descripcionActividad: a['descripcionActividad'] as string | undefined,
        nomenclador: a['nomenclador'] != null ? Number(a['nomenclador']) : undefined,
        orden: a['orden'] != null ? Number(a['orden']) : undefined,
        periodo: a['periodo'] != null ? Number(a['periodo']) : undefined,
      }));
    }

    const regimenes = raw['regimen'] ?? data['regimen'];
    if (regimenes) {
      persona.regimen = ensureArray<R>(regimenes as R | R[]).map((r) => ({
        idRegimen: Number(r['idRegimen'] ?? 0),
        descripcionRegimen: r['descripcionRegimen'] as string | undefined,
        estado: r['estado'] as string | undefined,
        periodo: r['periodo'] != null ? Number(r['periodo']) : undefined,
        diaPeriodo: r['diaPeriodo'] != null ? Number(r['diaPeriodo']) : undefined,
        tipoRegimen: r['tipoRegimen'] as string | undefined,
        idImpuesto: r['idImpuesto'] != null ? Number(r['idImpuesto']) : undefined,
      }));
    }

    const relaciones = raw['relacion'] ?? data['relacion'];
    if (relaciones) {
      persona.relacion = ensureArray<R>(relaciones as R | R[]).map((r) => ({
        idPersona: String(r['idPersona'] ?? ''),
        idPersonaAsociada: r['idPersonaAsociada'] != null
          ? String(r['idPersonaAsociada'])
          : undefined,
        tipoRelacion: r['tipoRelacion'] as string | undefined,
        subtipoRelacion: r['subtipoRelacion'] as string | undefined,
        ffRelacion: r['ffRelacion'] as string | undefined,
        ffVencimiento: r['ffVencimiento'] as string | undefined,
      }));
    }

    const categorias = raw['categoria'] ?? data['categoria'];
    if (categorias) {
      persona.categoria = ensureArray<R>(categorias as R | R[]).map((c) => ({
        idCategoria: Number(c['idCategoria'] ?? 0),
        descripcionCategoria: c['descripcionCategoria'] as string | undefined,
        idImpuesto: c['idImpuesto'] != null ? Number(c['idImpuesto']) : undefined,
        estado: c['estado'] as string | undefined,
        periodo: c['periodo'] != null ? Number(c['periodo']) : undefined,
      }));
    }

    const emails = raw['email'] ?? data['email'];
    if (emails) {
      persona.email = ensureArray<R>(emails as R | R[]).map((e) => ({
        direccion: String(e['direccion'] ?? ''),
        tipoEmail: e['tipoEmail'] as string | undefined,
        estado: e['estado'] as string | undefined,
      }));
    }

    const telefonos = raw['telefono'] ?? data['telefono'];
    if (telefonos) {
      persona.telefono = ensureArray<R>(telefonos as R | R[]).map((t) => ({
        numero: String(t['numero'] ?? ''),
        tipoTelefono: t['tipoTelefono'] as string | undefined,
        tipoLinea: t['tipoLinea'] as string | undefined,
      }));
    }

    return persona;
  }
}

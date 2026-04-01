import { WSAA_ENDPOINTS } from '@ramiidv/arca-common';

// Re-export shared enums from common
export { Provincia, DocTipo as TipoDocumento } from '@ramiidv/arca-common';

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const ENDPOINTS = {
  wsaa: WSAA_ENDPOINTS,
  a4: {
    testing: 'https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA4',
    production: 'https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA4',
    namespace: 'http://a4.soap.ws.server.puc.sr/',
    serviceId: 'ws_sr_padron_a4',
  },
  a10: {
    testing: 'https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA10',
    production: 'https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA10',
    namespace: 'http://a10.soap.ws.server.puc.sr/',
    serviceId: 'ws_sr_padron_a10',
  },
  a100: {
    testing: 'https://awshomo.afip.gov.ar/sr-parametros/webservices/parameterServiceA100',
    production: 'https://aws.afip.gov.ar/sr-parametros/webservices/parameterServiceA100',
    namespace: 'http://a100.soap.ws.server.pucParam.sr/',
    serviceId: 'ws_sr_padron_a100',
  },
} as const;

// ---------------------------------------------------------------------------
// Enums (domain-specific)
// ---------------------------------------------------------------------------

/** Tipos de domicilio */
export enum TipoDomicilio {
  FISCAL = 'FISCAL',
  LEGAL = 'LEGAL',
  REAL = 'REAL',
}

/** Tipos de persona */
export enum TipoPersona {
  FISICA = 'FISICA',
  JURIDICA = 'JURIDICA',
}

/** IDs de impuestos comunes */
export enum ImpuestoId {
  GANANCIAS_PJ = 10,
  GANANCIAS_PH = 11,
  MONOTRIBUTO_SOCIAL = 20,
  MONOTRIBUTO = 21,
  IVA_RESPONSABLE_INSCRIPTO = 30,
  BIENES_PERSONALES = 31,
  IVA_EXENTO = 32,
  IVA_NO_INSCRIPTO = 33,
  IVA_NO_ALCANZADO = 34,
  EMPLEADOR = 301,
}

/** Estado de la clave fiscal del contribuyente */
export enum EstadoClave {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  LIMITADO = 'LIMITADO',
}

/** Nombres de colecciones disponibles en ws_sr_padron_a100 */
export enum CollectionName {
  PROVINCIA = 'SUPA.E_PROVINCIA',
  TIPO_DOCUMENTO = 'SUPA.TIPO_DOCUMENTO',
  TIPO_DOMICILIO = 'SUPA.TIPO_DOMICILIO',
  TIPO_CLAVE = 'SUPA.TIPO_CLAVE_IDENTIFICACION',
  TIPO_EMPRESA_JURIDICA = 'SUPA.TIPO_EMPRESA_JURIDICA',
  TIPO_EMPRESA_JURIDICA_SUBGRUPO = 'SUPA.TIPO_EMPRESA_JURI_SUBGRUPO',
  TIPO_RELACION = 'SUPA.TIPO_RELACION',
  TIPO_SUBTIPO_RELACION = 'SUPA.TIPO_SUBTIPO_RELACION',
  TIPO_COMPONENTE_SOCIEDAD = 'SUPA.TIPO_COMPONENTE_SOCIEDAD',
  TIPO_RELACION_COMPONENTE_SOC = 'SUPA.TIPO_RELACION_COMPONENTE_SOC',
  TIPO_EMAIL = 'SUPA.TIPO_EMAIL',
  TIPO_TELEFONO = 'SUPA.TIPO_TELEFONO',
  TIPO_RESIDENCIA = 'SUPA.TIPO_RESIDENCIA',
  TIPO_DATO_ADICIONAL_DOMICILIO = 'SUPA.TIPO_DATO_ADICIONAL_DOMICILIO',
  ORGANISMO_INFORMANTE = 'SUPA.E_ORGANISMO_INFORMANTE',
  ORGANISMO_CONTROL = 'SUPA.E_ORGANISMO_CONTROL',
  PROVINCIA_SOCIEDAD_ORG = 'SUPA.A_PROVINCIA_SOCIEDAD_ORG',
  SEXO = 'E_SEXO',
  CALLE = 'PUC_PARAM.T_CALLE',
  LOCALIDAD = 'PUC_PARAM.T_LOCALIDAD',
}

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// We test the exported utilities and the mapping/parsing logic.
// Since mapPersona is private on the client classes, we exercise it via
// the public getPersona methods by mocking the SOAP layer.
// ---------------------------------------------------------------------------

import { ensureArray } from '../src/soap-client.js';
import { PadronA4Client } from '../src/padron-a4.js';
import { PadronA10Client } from '../src/padron-a10.js';
import { ArcaPadronServiceError } from '../src/errors.js';
import type { WsAuth, PersonaA4, PersonaA10 } from '../src/types.js';

// ---------------------------------------------------------------------------
// Mock the SOAP layer so we never hit the network
// ---------------------------------------------------------------------------

const mockAfipSoapCall = vi.fn();

vi.mock('../src/soap-client.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/soap-client.js')>();
  return {
    ...original,
    afipSoapCall: (...args: unknown[]) => mockAfipSoapCall(...args),
  };
});

const AUTH: WsAuth = {
  Token: 'tok',
  Sign: 'sig',
  CuitRepresentada: '20123456789',
};

// ---------------------------------------------------------------------------
// ensureArray
// ---------------------------------------------------------------------------

describe('ensureArray', () => {
  it('wraps a single item in an array', () => {
    expect(ensureArray('hello')).toEqual(['hello']);
  });

  it('returns the same array when given an array', () => {
    const arr = [1, 2, 3];
    expect(ensureArray(arr)).toEqual([1, 2, 3]);
  });

  it('returns empty array for null', () => {
    expect(ensureArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(ensureArray(undefined)).toEqual([]);
  });

  it('wraps an object in an array', () => {
    const obj = { id: 1 };
    expect(ensureArray(obj)).toEqual([{ id: 1 }]);
  });

  it('returns empty array reference (not same identity)', () => {
    const a = ensureArray(null);
    const b = ensureArray(null);
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// A4 persona parsing
// ---------------------------------------------------------------------------

describe('PadronA4Client - persona mapping', () => {
  let client: PadronA4Client;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new PadronA4Client({
      endpoint: 'https://test.example.com/a4',
      namespace: 'http://a4.soap.ws.server.puc.sr/',
    });
  });

  it('maps all scalar fields from a raw SOAP response', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        datosGenerales: {
          idPersona: '20123456789',
          tipoPersona: 'FISICA',
          tipoClave: 'CUIL',
          estadoClave: 'ACTIVO',
          nombre: 'JUAN',
          apellido: 'PEREZ',
          numeroDocumento: 12345678,
          tipoDocumento: 'DNI',
          fechaNacimiento: '1990-01-15',
          sexo: 'M',
          numeroInscripcion: 123456,
          mesCierre: 12,
          fechaInscripcion: '2010-03-01',
          tipoResidencia: 'NACIONAL',
          porcentajeCapitalNacional: 100,
          cantidadSociosEmpresaMono: 1,
          leyJubilacion: 24241,
        },
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.idPersona).toBe('20123456789');
    expect(persona.tipoPersona).toBe('FISICA');
    expect(persona.tipoClave).toBe('CUIL');
    expect(persona.estadoClave).toBe('ACTIVO');
    expect(persona.nombre).toBe('JUAN');
    expect(persona.apellido).toBe('PEREZ');
    expect(persona.numeroDocumento).toBe('12345678');
    expect(persona.tipoDocumento).toBe('DNI');
    expect(persona.fechaNacimiento).toBe('1990-01-15');
    expect(persona.sexo).toBe('M');
    expect(persona.numeroInscripcion).toBe('123456');
    expect(persona.mesCierre).toBe(12);
    expect(persona.fechaInscripcion).toBe('2010-03-01');
    expect(persona.tipoResidencia).toBe('NACIONAL');
    expect(persona.porcentajeCapitalNacional).toBe(100);
    expect(persona.cantidadSociosEmpresaMono).toBe(1);
    expect(persona.leyJubilacion).toBe(24241);
  });

  it('maps juridica persona with razonSocial', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        datosGenerales: {
          idPersona: '30712345671',
          tipoPersona: 'JURIDICA',
          razonSocial: 'EMPRESA SA',
          formaJuridica: 'SA',
          fechaContratoSocial: '2005-06-15',
        },
      },
    });

    const persona = await client.getPersona(AUTH, '30712345671');

    expect(persona.tipoPersona).toBe('JURIDICA');
    expect(persona.razonSocial).toBe('EMPRESA SA');
    expect(persona.formaJuridica).toBe('SA');
    expect(persona.fechaContratoSocial).toBe('2005-06-15');
  });

  it('maps dependencia (single object)', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        datosGenerales: {
          idPersona: '20123456789',
          tipoPersona: 'FISICA',
          dependencia: {
            idDependencia: 5,
            descripcionDependencia: 'DGI Buenos Aires',
          },
        },
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.dependencia).toBeDefined();
    expect(persona.dependencia!.idDependencia).toBe(5);
    expect(persona.dependencia!.descripcionDependencia).toBe('DGI Buenos Aires');
  });

  it('maps domicilio array (multiple items)', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        datosGenerales: {
          idPersona: '20123456789',
          tipoPersona: 'FISICA',
        },
        domicilio: [
          {
            direccion: 'AV CORRIENTES 1234',
            localidad: 'CABA',
            codPostal: '1043',
            idProvincia: 0,
            descripcionProvincia: 'CIUDAD AUTONOMA BUENOS AIRES',
            tipoDomicilio: 'FISCAL',
            estadoDomicilio: 'CONFIRMADO',
            orden: 1,
          },
          {
            direccion: 'CALLE FALSA 742',
            localidad: 'AVELLANEDA',
            codPostal: '1870',
            idProvincia: 1,
            descripcionProvincia: 'BUENOS AIRES',
            tipoDomicilio: 'REAL',
            orden: 2,
          },
        ],
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.domicilio).toHaveLength(2);
    expect(persona.domicilio![0].direccion).toBe('AV CORRIENTES 1234');
    expect(persona.domicilio![0].tipoDomicilio).toBe('FISCAL');
    expect(persona.domicilio![0].idProvincia).toBe(0);
    expect(persona.domicilio![0].orden).toBe(1);
    expect(persona.domicilio![1].direccion).toBe('CALLE FALSA 742');
    expect(persona.domicilio![1].tipoDomicilio).toBe('REAL');
  });

  it('maps single domicilio (SOAP single-item behavior, ensureArray wraps)', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        datosGenerales: {
          idPersona: '20123456789',
          tipoPersona: 'FISICA',
        },
        domicilio: {
          direccion: 'AV CORRIENTES 1234',
          tipoDomicilio: 'FISCAL',
        },
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.domicilio).toHaveLength(1);
    expect(persona.domicilio![0].direccion).toBe('AV CORRIENTES 1234');
  });

  it('maps impuestos array', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        datosGenerales: {
          idPersona: '20123456789',
          tipoPersona: 'FISICA',
        },
        impuesto: [
          {
            idImpuesto: 30,
            descripcionImpuesto: 'IVA',
            estado: 'ACTIVO',
            periodo: 202401,
            ffInscripcion: '2010-01-01',
          },
        ],
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.impuesto).toHaveLength(1);
    expect(persona.impuesto![0].idImpuesto).toBe(30);
    expect(persona.impuesto![0].estado).toBe('ACTIVO');
    expect(persona.impuesto![0].periodo).toBe(202401);
  });

  it('maps actividades, regimenes, relaciones, categorias, emails, telefonos', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        datosGenerales: {
          idPersona: '20123456789',
          tipoPersona: 'FISICA',
        },
        actividad: { idActividad: '620100', descripcionActividad: 'Software', nomenclador: 1, orden: 1, periodo: 202401 },
        regimen: { idRegimen: 1, descripcionRegimen: 'IVA', estado: 'ACTIVO', tipoRegimen: 'IMPUESTO', idImpuesto: 30 },
        relacion: { idPersona: '20123456789', idPersonaAsociada: '30999999991', tipoRelacion: 'EMPLEADOR' },
        categoria: { idCategoria: 5, descripcionCategoria: 'Cat E', idImpuesto: 20, estado: 'ACTIVO', periodo: 202401 },
        email: { direccion: 'test@example.com', tipoEmail: 'PERSONAL', estado: 'ACTIVO' },
        telefono: { numero: '1155557777', tipoTelefono: 'CELULAR', tipoLinea: 'MOVIL' },
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.actividad).toHaveLength(1);
    expect(persona.actividad![0].idActividad).toBe('620100');
    expect(persona.actividad![0].nomenclador).toBe(1);

    expect(persona.regimen).toHaveLength(1);
    expect(persona.regimen![0].idRegimen).toBe(1);
    expect(persona.regimen![0].tipoRegimen).toBe('IMPUESTO');

    expect(persona.relacion).toHaveLength(1);
    expect(persona.relacion![0].idPersona).toBe('20123456789');
    expect(persona.relacion![0].tipoRelacion).toBe('EMPLEADOR');

    expect(persona.categoria).toHaveLength(1);
    expect(persona.categoria![0].idCategoria).toBe(5);

    expect(persona.email).toHaveLength(1);
    expect(persona.email![0].direccion).toBe('test@example.com');

    expect(persona.telefono).toHaveLength(1);
    expect(persona.telefono![0].numero).toBe('1155557777');
    expect(persona.telefono![0].tipoLinea).toBe('MOVIL');
  });

  it('maps claveInactivaAsociada (array of strings)', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        datosGenerales: {
          idPersona: '20123456789',
          tipoPersona: 'FISICA',
        },
        claveInactivaAsociada: ['27123456789', '23123456789'],
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.claveInactivaAsociada).toEqual(['27123456789', '23123456789']);
  });

  it('handles missing optional fields gracefully', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        datosGenerales: {
          idPersona: '20123456789',
          tipoPersona: 'FISICA',
        },
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.idPersona).toBe('20123456789');
    expect(persona.nombre).toBeUndefined();
    expect(persona.apellido).toBeUndefined();
    expect(persona.domicilio).toBeUndefined();
    expect(persona.impuesto).toBeUndefined();
    expect(persona.actividad).toBeUndefined();
    expect(persona.email).toBeUndefined();
    expect(persona.telefono).toBeUndefined();
    expect(persona.dependencia).toBeUndefined();
  });

  it('maps numeric fields via String/Number coercion', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        datosGenerales: {
          idPersona: 20123456789,
          tipoPersona: 'FISICA',
          numeroDocumento: 99887766,
          mesCierre: '6',
        },
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    // idPersona is coerced to string
    expect(persona.idPersona).toBe('20123456789');
    // numeroDocumento is coerced to string
    expect(persona.numeroDocumento).toBe('99887766');
    // mesCierre is coerced to number
    expect(persona.mesCierre).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// A10 persona parsing
// ---------------------------------------------------------------------------

describe('PadronA10Client - persona mapping', () => {
  let client: PadronA10Client;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new PadronA10Client({
      endpoint: 'https://test.example.com/a10',
      namespace: 'http://a10.soap.ws.server.puc.sr/',
    });
  });

  it('maps all A10 fields from a raw SOAP response', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        idPersona: '20123456789',
        tipoPersona: 'FISICA',
        tipoClave: 'CUIL',
        estadoClave: 'ACTIVO',
        nombre: 'MARIA',
        apellido: 'GONZALEZ',
        numeroDocumento: 33445566,
        tipoDocumento: 'DNI',
        idActividadPrincipal: 620100,
        descripcionActividadPrincipal: 'Desarrollo de software',
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.idPersona).toBe('20123456789');
    expect(persona.tipoPersona).toBe('FISICA');
    expect(persona.tipoClave).toBe('CUIL');
    expect(persona.estadoClave).toBe('ACTIVO');
    expect(persona.nombre).toBe('MARIA');
    expect(persona.apellido).toBe('GONZALEZ');
    expect(persona.numeroDocumento).toBe('33445566');
    expect(persona.tipoDocumento).toBe('DNI');
    expect(persona.idActividadPrincipal).toBe('620100');
    expect(persona.descripcionActividadPrincipal).toBe('Desarrollo de software');
  });

  it('maps A10 dependencia', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        idPersona: '20123456789',
        tipoPersona: 'FISICA',
        dependencia: {
          idDependencia: 3,
          descripcionDependencia: 'DGI Rosario',
        },
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.dependencia).toBeDefined();
    expect(persona.dependencia!.idDependencia).toBe(3);
    expect(persona.dependencia!.descripcionDependencia).toBe('DGI Rosario');
  });

  it('maps A10 domicilio array', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        idPersona: '20123456789',
        tipoPersona: 'FISICA',
        domicilio: [
          {
            direccion: 'AV SANTA FE 500',
            localidad: 'CABA',
            codPostal: '1060',
            idProvincia: 0,
            descripcionProvincia: 'CIUDAD AUTONOMA BUENOS AIRES',
            tipoDomicilio: 'FISCAL',
          },
        ],
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.domicilio).toHaveLength(1);
    expect(persona.domicilio![0].direccion).toBe('AV SANTA FE 500');
    expect(persona.domicilio![0].tipoDomicilio).toBe('FISCAL');
    expect(persona.domicilio![0].idProvincia).toBe(0);
  });

  it('maps A10 claveInactivaAsociada single string', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        idPersona: '20123456789',
        tipoPersona: 'FISICA',
        claveInactivaAsociada: '27123456789',
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.claveInactivaAsociada).toEqual(['27123456789']);
  });

  it('handles A10 response without persona wrapper', async () => {
    // Sometimes the response may not wrap in 'persona'
    mockAfipSoapCall.mockResolvedValue({
      idPersona: '20123456789',
      tipoPersona: 'FISICA',
      nombre: 'PEDRO',
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.idPersona).toBe('20123456789');
    expect(persona.nombre).toBe('PEDRO');
  });

  it('handles A10 missing optional fields', async () => {
    mockAfipSoapCall.mockResolvedValue({
      persona: {
        idPersona: '20123456789',
        tipoPersona: 'JURIDICA',
        razonSocial: 'ACME SRL',
      },
    });

    const persona = await client.getPersona(AUTH, '20123456789');

    expect(persona.tipoPersona).toBe('JURIDICA');
    expect(persona.razonSocial).toBe('ACME SRL');
    expect(persona.nombre).toBeUndefined();
    expect(persona.apellido).toBeUndefined();
    expect(persona.domicilio).toBeUndefined();
    expect(persona.dependencia).toBeUndefined();
    expect(persona.claveInactivaAsociada).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('ArcaPadronServiceError', () => {
  it('stores error code and message array', () => {
    const errors = [
      { code: 10001, msg: 'CUIT no encontrada' },
      { code: 10002, msg: 'Servicio no disponible' },
    ];
    const err = new ArcaPadronServiceError('Error de servicio', errors);

    expect(err).toBeInstanceOf(ArcaPadronServiceError);
    expect(err.name).toBe('ArcaPadronServiceError');
    expect(err.message).toBe('Error de servicio');
    expect(err.errors).toEqual(errors);
    expect(err.errors).toHaveLength(2);
    expect(err.errors[0].code).toBe(10001);
    expect(err.errors[0].msg).toBe('CUIT no encontrada');
  });

  it('is instanceof Error', () => {
    const err = new ArcaPadronServiceError('test', [{ code: 1, msg: 'x' }]);
    expect(err).toBeInstanceOf(Error);
  });
});

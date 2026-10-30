import { describe, expect, it } from 'vitest';
import { CondicionIva } from '@ramiidv/arca-common';
import { condicionIvaDesdePadron } from '../src/condicion-iva.js';
import type { ImpuestoA5, PersonaA4, PersonaA5 } from '../src/types.js';

function a5(extra: Partial<PersonaA5> = {}): PersonaA5 {
  return { idPersona: '20111111112', estadoClave: 'ACTIVO', impuestos: [], ...extra };
}

const imp = (idImpuesto: number, descripcionImpuesto: string, estadoImpuesto = 'AC'): ImpuestoA5 => ({
  idImpuesto,
  descripcionImpuesto,
  estadoImpuesto,
});

describe('condicionIvaDesdePadron (constancia de inscripción)', () => {
  it('IVA inscripto (30) → Responsable Inscripto', () => {
    const r = condicionIvaDesdePadron(a5({ impuestos: [imp(10, 'GANANCIAS SOCIEDADES'), imp(30, 'IVA')] }));
    expect(r.condicionIva).toBe(CondicionIva.RESPONSABLE_INSCRIPTO);
    expect(r.motivo).toMatch(/impuesto 30/);
  });

  it('monotributo (20) → Responsable Monotributo, con la categoría en el motivo', () => {
    const r = condicionIvaDesdePadron(
      a5({
        impuestos: [imp(20, 'MONOTRIBUTO')],
        monotributo: {
          impuestos: [imp(20, 'MONOTRIBUTO')],
          actividades: [],
          categoria: { idCategoria: 36, descripcionCategoria: 'B LOCACIONES DE SERVICIO', idImpuesto: 20 },
        },
      }),
    );
    expect(r.condicionIva).toBe(CondicionIva.MONOTRIBUTISTA);
    expect(r.motivo).toContain('B LOCACIONES DE SERVICIO');
  });

  it('monotributo social por categoría (61, 99, 100)', () => {
    const r = condicionIvaDesdePadron(
      a5({
        impuestos: [imp(20, 'MONOTRIBUTO')],
        monotributo: {
          impuestos: [imp(20, 'MONOTRIBUTO')],
          actividades: [],
          categoria: { idCategoria: 99, descripcionCategoria: 'B MONOTRIBUTO SOCIAL LOCACION', idImpuesto: 20 },
        },
      }),
    );
    expect(r.condicionIva).toBe(CondicionIva.MONOTRIBUTO_SOCIAL);
  });

  it('trabajador independiente promovido por la descripción de la categoría', () => {
    const r = condicionIvaDesdePadron(
      a5({
        monotributo: {
          impuestos: [],
          actividades: [],
          categoria: { idCategoria: 500, descripcionCategoria: 'TRABAJADOR INDEPENDIENTE PROMOVIDO', idImpuesto: 20 },
        },
      }),
    );
    expect(r.condicionIva).toBe(CondicionIva.MONOTRIBUTO_INDEPENDIENTE_PROMOVIDO);
  });

  it('IVA exento (32) → Exento', () => {
    expect(condicionIvaDesdePadron(a5({ impuestos: [imp(32, 'IVA EXENTO')] })).condicionIva).toBe(CondicionIva.EXENTO);
  });

  it('IVA no alcanzado (34) → IVA no alcanzado', () => {
    expect(condicionIvaDesdePadron(a5({ impuestos: [imp(34, 'IVA NO ALCANZADO')] })).condicionIva).toBe(
      CondicionIva.IVA_NO_ALCANZADO,
    );
  });

  it('impuesto 30 con estado EX o NA', () => {
    expect(condicionIvaDesdePadron(a5({ impuestos: [imp(30, 'IVA', 'EX')] })).condicionIva).toBe(CondicionIva.EXENTO);
    expect(condicionIvaDesdePadron(a5({ impuestos: [imp(30, 'IVA', 'NA')] })).condicionIva).toBe(
      CondicionIva.IVA_NO_ALCANZADO,
    );
  });

  it('impuestos dados de baja no cuentan', () => {
    const r = condicionIvaDesdePadron(a5({ impuestos: [imp(30, 'IVA', 'BD')] }));
    expect(r.condicionIva).toBeNull();
  });

  it('sin IVA ni monotributo → null con motivo (no adivina consumidor final)', () => {
    const r = condicionIvaDesdePadron(a5({ impuestos: [imp(11, 'GANANCIAS PERSONAS FISICAS')] }));
    expect(r.condicionIva).toBeNull();
    expect(r.motivo).toMatch(/no alcanza para determinar/);
  });

  it('advierte si la CUIT no está activa', () => {
    const r = condicionIvaDesdePadron(a5({ estadoClave: 'INACTIVO', impuestos: [imp(30, 'IVA')] }));
    expect(r.condicionIva).toBe(CondicionIva.RESPONSABLE_INSCRIPTO);
    expect(r.motivo).toMatch(/INACTIVO/);
  });
});

describe('condicionIvaDesdePadron (A4)', () => {
  const a4 = (extra: Partial<PersonaA4>): PersonaA4 => ({ idPersona: '20111111112', tipoPersona: 'FISICA', ...extra });

  it('monotributo por impuesto 20', () => {
    const r = condicionIvaDesdePadron(
      a4({
        impuesto: [{ idImpuesto: 20, descripcionImpuesto: 'MONOTRIBUTO', estado: 'ACTIVO' }],
        categoria: [{ idCategoria: 36, descripcionCategoria: 'B LOCACIONES DE SERVICIO', idImpuesto: 20, estado: 'ACTIVO' }],
      }),
    );
    expect(r.condicionIva).toBe(CondicionIva.MONOTRIBUTISTA);
  });

  it('IVA 30 activo', () => {
    const r = condicionIvaDesdePadron(a4({ impuesto: [{ idImpuesto: 30, estado: 'ACTIVO' }] }));
    expect(r.condicionIva).toBe(CondicionIva.RESPONSABLE_INSCRIPTO);
  });
});

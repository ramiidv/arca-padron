import { CondicionIva } from '@ramiidv/arca-common';
import { ImpuestoId } from './constants.js';
import type { CondicionIvaPadron, PersonaA4, PersonaA5 } from './types.js';

/*
 * Fuentes:
 * - Manual del desarrollador ws_sr_constancia_inscripcion v4.1: impuesto 20 =
 *   MONOTRIBUTO (datosMonotributo), impuesto 30 = IVA (datosRegimenGeneral),
 *   estadoImpuesto "AC" = activo; las categorías 61, 99 y 100 son de
 *   monotributo social ("B MONOTRIBUTO SOCIAL ...").
 * - IVA exento (32) e IVA no alcanzado (34) no figuran en ese manual: se
 *   reconocen por id o por la descripción del impuesto.
 * - Valores de CondicionIva: FEParamGetCondicionIvaReceptor (WSFEv1).
 */

const CATEGORIAS_MONOTRIBUTO_SOCIAL = new Set([61, 99, 100]);

interface Impuesto {
  id: number;
  descripcion: string;
  activo: boolean;
}

function activo(estado: string | undefined): boolean {
  return !estado || /^(AC|ACTIVO)$/i.test(estado.trim());
}

function esA5(persona: PersonaA5 | PersonaA4): persona is PersonaA5 {
  return Array.isArray((persona as PersonaA5).impuestos);
}

function impuestosDe(persona: PersonaA5 | PersonaA4): Impuesto[] {
  if (esA5(persona)) {
    return persona.impuestos.map((i) => ({
      id: i.idImpuesto,
      descripcion: i.descripcionImpuesto ?? '',
      activo: activo(i.estadoImpuesto),
    }));
  }
  return (persona.impuesto ?? []).map((i) => ({
    id: i.idImpuesto,
    descripcion: i.descripcionImpuesto ?? '',
    activo: activo(i.estado),
  }));
}

function categoriaMonotributo(persona: PersonaA5 | PersonaA4): { id: number; descripcion: string } | undefined {
  if (esA5(persona)) {
    const c = persona.monotributo?.categoria;
    return c ? { id: c.idCategoria, descripcion: c.descripcionCategoria ?? '' } : undefined;
  }
  const c = (persona.categoria ?? []).find((x) => x.idImpuesto === ImpuestoId.MONOTRIBUTO && activo(x.estado));
  return c ? { id: c.idCategoria, descripcion: c.descripcionCategoria ?? '' } : undefined;
}

/**
 * Determina la condición frente al IVA de un contribuyente a partir del padrón
 * (constancia de inscripción / A5, o A4), para usarla como `condicionIva` al
 * facturarle.
 *
 * - Monotributo activo (impuesto 20 o categoría de monotributo) → MONOTRIBUTISTA,
 *   o MONOTRIBUTO_SOCIAL / MONOTRIBUTO_INDEPENDIENTE_PROMOVIDO según la categoría.
 * - IVA activo (impuesto 30) → RESPONSABLE_INSCRIPTO.
 * - IVA exento (32) → EXENTO. IVA no alcanzado (34) → IVA_NO_ALCANZADO.
 * - Si no figura ninguno, devuelve `condicionIva: null`: el padrón no alcanza
 *   para decidir (puede ser consumidor final o sujeto no categorizado según la
 *   operación). No adivina.
 *
 * Es una función pura: no consulta ARCA.
 *
 * @example
 * ```ts
 * const persona = await padron.getConstanciaInscripcion('30712345674');
 * const { condicionIva, motivo } = condicionIvaDesdePadron(persona);
 * ```
 */
export function condicionIvaDesdePadron(persona: PersonaA5 | PersonaA4): CondicionIvaPadron {
  const impuestos = impuestosDe(persona);
  const tiene = (pred: (i: Impuesto) => boolean) => impuestos.find((i) => i.activo && pred(i));
  const advertencia =
    persona.estadoClave && persona.estadoClave.toUpperCase() !== 'ACTIVO'
      ? ` Atención: la CUIT tiene estado ${persona.estadoClave}.`
      : '';

  const categoria = categoriaMonotributo(persona);
  const monotributo = tiene((i) => i.id === ImpuestoId.MONOTRIBUTO) ?? (categoria ? true : undefined);
  if (monotributo) {
    const desc = categoria ? ` (categoría ${categoria.id} - ${categoria.descripcion.trim()})` : '';
    if (categoria && (CATEGORIAS_MONOTRIBUTO_SOCIAL.has(categoria.id) || /MONOTRIBUTO SOCIAL/i.test(categoria.descripcion))) {
      return { condicionIva: CondicionIva.MONOTRIBUTO_SOCIAL, motivo: `Monotributo social${desc}.${advertencia}` };
    }
    if (categoria && /PROMOVID/i.test(categoria.descripcion)) {
      return {
        condicionIva: CondicionIva.MONOTRIBUTO_INDEPENDIENTE_PROMOVIDO,
        motivo: `Monotributo trabajador independiente promovido${desc}.${advertencia}`,
      };
    }
    return { condicionIva: CondicionIva.MONOTRIBUTISTA, motivo: `Inscripto en monotributo (impuesto 20)${desc}.${advertencia}` };
  }

  if (tiene((i) => i.id === ImpuestoId.IVA_RESPONSABLE_INSCRIPTO)) {
    return { condicionIva: CondicionIva.RESPONSABLE_INSCRIPTO, motivo: `Inscripto en IVA (impuesto 30).${advertencia}` };
  }

  if (tiene((i) => i.id === ImpuestoId.IVA_EXENTO || /IVA\s+EXENTO/i.test(i.descripcion))) {
    return { condicionIva: CondicionIva.EXENTO, motivo: `IVA exento (impuesto 32).${advertencia}` };
  }

  if (tiene((i) => i.id === ImpuestoId.IVA_NO_ALCANZADO || /IVA.*NO\s+ALCANZADO/i.test(i.descripcion))) {
    return { condicionIva: CondicionIva.IVA_NO_ALCANZADO, motivo: `IVA no alcanzado (impuesto 34).${advertencia}` };
  }

  if (esA5(persona) && persona.errorConstancia && impuestos.length === 0) {
    return {
      condicionIva: null,
      motivo: `ARCA no emitió la constancia: ${persona.errorConstancia.error.join('; ')}.${advertencia}`,
    };
  }

  return {
    condicionIva: null,
    motivo:
      'No figura inscripto en IVA ni en monotributo: el padrón no alcanza para determinar la condición ' +
      '(puede ser consumidor final o sujeto no categorizado según la operación).' +
      advertencia,
  };
}

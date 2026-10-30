import { ensureArray } from './soap-client.js';

/** Registro de una respuesta SOAP parseada. */
export type SoapRecord = Record<string, unknown>;

/** Convierte a string, o `undefined` si el valor no vino. */
export const optString = (v: unknown): string | undefined =>
  v === undefined || v === null ? undefined : String(v);

/** Convierte a número, o `undefined` si el valor no vino. */
export const optNumber = (v: unknown): number | undefined =>
  v === undefined || v === null || v === '' ? undefined : Number(v);

/** Normaliza un elemento SOAP que puede venir solo, repetido o ausente. */
export const records = (v: unknown): SoapRecord[] => ensureArray(v as SoapRecord | SoapRecord[] | undefined);

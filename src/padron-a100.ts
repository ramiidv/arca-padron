import { ArcaValidationError, extractMethodResult, parseXml } from '@ramiidv/arca-common';
import type { CallOptions } from '@ramiidv/arca-common';
import { ArcaPadronError } from './errors.js';
import { optString, record, records as list, reqString, type SoapRecord as R } from './mapping.js';
import { BasePadronClient, type PadronClientConfig } from './base-client.js';
import type { ParameterRecord, WsAuth } from './types.js';

export type PadronA100ClientConfig = PadronClientConfig;

const METHOD = 'getParameterCollectionByName';

/**
 * Marca que se antepone al texto de los campos `xs:string` del A100 antes de
 * parsear, para que el parser de arca-common no los convierta en número.
 * Es un carácter de uso privado de Unicode: no aparece en datos de ARCA.
 */
const MARK = '';
const STRING_FIELDS = /<((?:[\w.-]+:)?(?:id|name|value|description))>([^<]*)</g;

/** Antepone `MARK` al contenido de los campos `xs:string` de la respuesta. */
function protegerStrings(xml: string): string {
  return xml.replace(STRING_FIELDS, (_m, tag: string, content: string) => `<${tag}>${MARK}${content}<`);
}

/** String tal cual vino (sin la marca). */
function texto(v: unknown): string | undefined {
  const s = optString(v);
  return s === undefined ? undefined : s.replace(MARK, '').trim();
}

/**
 * Client for ws_sr_padron_a100 - Tablas de parámetros.
 *
 * `id`, `description`, `name` y `value` son `xs:string` en el WSDL. El parser
 * XML de arca-common convierte a número los textos numéricos ("10.50" → 10.5,
 * "1E3" → 1000), perdiendo el valor original. Para preservarlos, este cliente
 * captura el XML de la respuesta (envolviendo `fetch`) y lo vuelve a parsear
 * con esos campos protegidos. Consecuencia: el A100 siempre usa `fetch` (el
 * configurado o `globalThis.fetch`), sin el fallback de TLS legacy; con
 * `legacyTls: 'always'` y sin `fetch` propio, no se captura y los valores
 * numéricos quedan normalizados por el parser.
 */
export class PadronA100Client extends BasePadronClient {
  /**
   * Tabla de parámetros por nombre de colección (ver `CollectionName`).
   * @param collectionName - Nombre de la colección (ej: "SUPA.E_PROVINCIA")
   * @returns los registros de la tabla (`[]` si ARCA devuelve la colección vacía)
   */
  async getParameterCollectionByName(
    auth: WsAuth,
    collectionName: string,
    opts?: CallOptions,
  ): Promise<ParameterRecord[]> {
    if (typeof collectionName !== 'string' || collectionName.trim() === '') {
      throw new ArcaValidationError(
        'collectionName es obligatorio',
        [{ field: 'collectionName', message: 'Indicá el nombre de la colección', value: collectionName }],
        'collectionName',
      );
    }

    let raw: string | undefined;
    const capture = this.soapOptions?.fetch !== undefined || this.soapOptions?.legacyTls !== 'always';
    const baseFetch = this.soapOptions?.fetch;
    const fetchCapturando: typeof fetch = async (input, init) => {
      const res = await (baseFetch ?? globalThis.fetch)(input, init);
      raw = await res.text();
      return new Response(raw, { status: res.status, statusText: res.statusText, headers: res.headers });
    };

    const parsed = await this.call(
      METHOD,
      { ...this.authParams(auth), collectionName: collectionName.trim() },
      opts,
      capture ? { fetch: fetchCapturando } : undefined,
    );
    // El Fault y la forma de la respuesta ya los validó afipSoapCall; se re-parsea solo para preservar los strings.
    const result = raw !== undefined ? extractMethodResult(parseXml(protegerStrings(raw)), METHOD) : parsed;

    const collection = record(result['parameterCollection']);
    if (!collection) {
      throw new ArcaPadronError(`Respuesta inválida de ARCA (${METHOD}): falta parameterCollection`);
    }

    return list(collection['parameterList']).map((p: R) => {
      const atributos = list(p['attributeList']).map((a) => ({
        name: reqString(texto(a['name']), 'attributeList.name'),
        value: texto(a['value']),
      }));
      const descripcion = texto(p['description']);
      if (descripcion === undefined) throw new ArcaPadronError(`Respuesta inválida de ARCA (${METHOD}): falta description`);
      return {
        id: reqString(texto(p['id']), 'parameterList.id'),
        descripcion,
        atributos: atributos.length > 0 ? atributos : undefined,
      };
    });
  }
}

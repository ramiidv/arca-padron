/**
 * Ejemplo: Manejo de errores
 *
 * Este ejemplo muestra cómo manejar correctamente los distintos
 * tipos de error que puede arrojar el SDK.
 */

import { readFileSync } from 'fs';
import {
  ArcaPadron,
  ArcaPadronError,
  ArcaAuthError,
  ArcaPadronServiceError,
  ArcaSoapError,
} from '@ramiidv/arca-padron-sdk';

const client = new ArcaPadron({
  cert: readFileSync('./cert.pem', 'utf-8'),
  key: readFileSync('./key.pem', 'utf-8'),
  cuit: '20123456789',
  production: false,
  // Monitorear eventos
  onEvent: (event) => {
    switch (event.type) {
      case 'auth:login':
        console.log(`[AUTH] Iniciando login para servicio: ${event.serviceId}`);
        break;
      case 'auth:cache-hit':
        console.log(`[AUTH] Token en cache para servicio: ${event.serviceId}`);
        break;
      case 'request:start':
        console.log(`[REQ] Iniciando ${event.method} a ${event.endpoint}`);
        break;
      case 'request:end':
        console.log(`[REQ] ${event.method} completado en ${event.durationMs}ms`);
        break;
      case 'request:retry':
        console.log(`[REQ] Reintento #${event.attempt} para ${event.method}: ${event.error.message}`);
        break;
      case 'request:error':
        console.log(`[REQ] Error en ${event.method}: ${event.error.message}`);
        break;
    }
  },
});

async function main() {
  try {
    const persona = await client.getPersona('20123456789');
    console.log('Persona encontrada:', persona.idPersona);
  } catch (error) {
    if (error instanceof ArcaAuthError) {
      // Error de autenticación con WSAA
      // Posibles causas: certificado vencido, servicio no autorizado, WSAA caído
      console.error('Error de autenticación:', error.message);
      console.error('Verificar certificado y permisos del servicio.');
    } else if (error instanceof ArcaPadronServiceError) {
      // Error de negocio de ARCA (ej: CUIT no encontrada)
      console.error('Error del servicio ARCA:');
      for (const err of error.errors) {
        console.error(`  Código ${err.code}: ${err.msg}`);
      }
    } else if (error instanceof ArcaSoapError) {
      // Error de transporte/HTTP
      console.error('Error de comunicación:', error.message);
      if (error.statusCode) {
        console.error(`  HTTP Status: ${error.statusCode}`);
      }
    } else if (error instanceof ArcaPadronError) {
      // Error genérico del SDK
      console.error('Error del SDK:', error.message);
    } else {
      // Error inesperado
      console.error('Error inesperado:', error);
    }
  }
}

main().catch(console.error);

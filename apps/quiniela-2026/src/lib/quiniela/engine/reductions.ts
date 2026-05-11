/**
 * REDUCCIONES OFICIALES (MODELO 13, 12, 11)
 *
 * ESTADO ACTUAL: Arquitectura preparada. Matrices NO integradas.
 *
 * Las reducciones oficiales de Progol/Loterías usan MATRICES predefinidas:
 * conjuntos mínimos de columnas que garantizan N aciertos dados T triples y D dobles.
 *
 * Estas matrices no son generables algorítmicamente — se obtienen de:
 * - Tablas oficiales de Loterías y Apuestas del Estado
 * - Progol (México)
 * - Literatura especializada en covering designs
 *
 * Lo que SÍ funciona:
 * - El modelo 14 DIRECTO (genera TODAS las combinaciones)
 * - La validación de configuraciones
 * - El conteo de signos
 * - El cálculo de presupuesto
 *
 * Lo que NO funciona aún:
 * - Generar las columnas específicas de una reducción al 13/12/11
 * - Garantizar matemáticamente la cobertura
 */

import type { ConfigUsuario, ReduccionMeta, EstadoMotor } from '../types'
import { contarSignos } from './validate'

/**
 * Catálogo de reducciones oficiales reconocidas.
 * Datos verificados: número de boletos y precio son correctos.
 * Datos pendientes: las COLUMNAS específicas de cada reducción.
 */
export const CATALOGO_REDUCCIONES: ReduccionMeta[] = [
  { id: 1,  nombre: 'Reducción 1  — 4 Triples',             triples: 4,  dobles: 0,  columnasRequeridas: 9,    nivel: 13 },
  { id: 2,  nombre: 'Reducción 2  — 7 Dobles',               triples: 0,  dobles: 7,  columnasRequeridas: 16,   nivel: 13 },
  { id: 3,  nombre: 'Reducción 3  — 3 Triples + 3 Dobles',  triples: 3,  dobles: 3,  columnasRequeridas: 24,   nivel: 13 },
  { id: 4,  nombre: 'Reducción 4  — 2 Triples + 6 Dobles',  triples: 2,  dobles: 6,  columnasRequeridas: 64,   nivel: 13 },
  { id: 5,  nombre: 'Reducción 5  — 8 Triples',             triples: 8,  dobles: 0,  columnasRequeridas: 81,   nivel: 13 },
  { id: 6,  nombre: 'Reducción 6  — 11 Dobles',             triples: 0,  dobles: 11, columnasRequeridas: 132,  nivel: 13 },
  { id: 7,  nombre: 'Reducción 7  — 5 Triples + 4 Dobles',  triples: 5,  dobles: 4,  columnasRequeridas: 192,  nivel: 12 },
  { id: 8,  nombre: 'Reducción 8  — 3 Triples + 8 Dobles',  triples: 3,  dobles: 8,  columnasRequeridas: 216,  nivel: 12 },
  { id: 9,  nombre: 'Reducción 9  — 6 Triples + 2 Dobles',  triples: 6,  dobles: 2,  columnasRequeridas: 288,  nivel: 12 },
  { id: 10, nombre: 'Reducción 10 — 4 Triples + 6 Dobles',  triples: 4,  dobles: 6,  columnasRequeridas: 432,  nivel: 11 },
  { id: 11, nombre: 'Reducción 11 — 7 Triples + 3 Dobles',  triples: 7,  dobles: 3,  columnasRequeridas: 648,  nivel: 11 },
  { id: 12, nombre: 'Reducción 12 — 10 Dobles + 1 Triple',  triples: 1,  dobles: 10, columnasRequeridas: 512,  nivel: 11 },
]

/**
 * Compara una configuración de usuario con una reducción.
 * Retorna true si la config tiene AL MENOS los triples/dobles requeridos.
 */
export function esCompatible(config: ConfigUsuario, reduccion: ReduccionMeta): boolean {
  const { triples, dobles } = contarSignos(config)
  return triples >= reduccion.triples && dobles >= reduccion.dobles
}

/**
 * Filtra las reducciones compatibles con una configuración.
 */
export function reduccionesCompatibles(config: ConfigUsuario): ReduccionMeta[] {
  return CATALOGO_REDUCCIONES.filter((r) => esCompatible(config, r))
}

/**
 * Estado actual del motor.
 * Siempre será 'matrices_pendientes' hasta integrar las matrices reales.
 */
export function estadoMotor(): EstadoMotor {
  return 'matrices_pendientes'
}

/**
 * Obtener columnas de una reducción oficial.
 *
 * TODO: Integrar matrices reales desde:
 * - Archivos de datos (src/lib/quiniela/matrices/)
 * - API externa
 * - Tablas oficiales de Progol / Loterías y Apuestas del Estado
 *
 * Cuando las matrices estén integradas, esta función:
 * 1. Recibe la configuración del usuario
 * 2. Busca la matriz correspondiente a la reducción
 * 3. Aplica los signos del usuario a la matriz (sustituye los placeholders)
 * 4. Retorna las columnas reales
 */
export function obtenerColumnasReduccion(
  _config: ConfigUsuario,
  _reduccionId: number,
): { disponible: false; columnas: null; razon: string } {
  return {
    disponible: false,
    columnas: null,
    razon:
      'Matrices de reducción oficial no integradas. ' +
      'Usa el modelo 14 directo (generarDirecta) para obtener columnas reales. ' +
      'Ver src/lib/quiniela/matrices/README.md para instrucciones de integración.',
  }
}

/**
 * Calcula el AHORRO de una reducción vs el directo.
 * Fórmula exacta (sin heurísticas):
 *   ahorro = 1 - (columnas_reducida / columnas_directo)
 */
export function calcularAhorroReduccion(config: ConfigUsuario, columnasReducida: number): number {
  const { triples, dobles } = contarSignos(config)
  const columnasDirecto = 3 ** triples * 2 ** dobles
  if (columnasDirecto === 0) return 0
  return 1 - columnasReducida / columnasDirecto
}

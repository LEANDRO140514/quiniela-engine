/**
 * MATRICES DE REDUCCIÓN OFICIALES
 *
 * ESTADO: Todas las matrices están pendientes de integración.
 * Ver README.md para instrucciones.
 *
 * Cuando se integre una matriz, cambiar su estado a 'integrada'
 * y rellenar el array de columnas con los datos reales.
 */

import type { MatrizReduccion } from '../types'

/**
 * Registro central de todas las matrices.
 * Cada entrada indica si la matriz está integrada o pendiente.
 */
export const REGISTRO_MATRICES: MatrizReduccion[] = [
  // ─── REDUCCIONES AL 13 ───
  {
    meta: { id: 1, nombre: 'Reducción 1 — 4 Triples', triples: 4, dobles: 0, columnasRequeridas: 9, nivel: 13 },
    columnas: undefined,
    fuente: undefined,
  },
  {
    meta: { id: 2, nombre: 'Reducción 2 — 7 Dobles', triples: 0, dobles: 7, columnasRequeridas: 16, nivel: 13 },
    columnas: undefined,
    fuente: undefined,
  },
  {
    meta: { id: 3, nombre: 'Reducción 3 — 3T + 3D', triples: 3, dobles: 3, columnasRequeridas: 24, nivel: 13 },
    columnas: undefined,
    fuente: undefined,
  },
  {
    meta: { id: 4, nombre: 'Reducción 4 — 2T + 6D', triples: 2, dobles: 6, columnasRequeridas: 64, nivel: 13 },
    columnas: undefined,
    fuente: undefined,
  },
  {
    meta: { id: 5, nombre: 'Reducción 5 — 8 Triples', triples: 8, dobles: 0, columnasRequeridas: 81, nivel: 13 },
    columnas: undefined,
    fuente: undefined,
  },
  {
    meta: { id: 6, nombre: 'Reducción 6 — 11 Dobles', triples: 0, dobles: 11, columnasRequeridas: 132, nivel: 13 },
    columnas: undefined,
    fuente: undefined,
  },
  // ─── REDUCCIONES AL 12 ───
  {
    meta: { id: 7, nombre: 'Reducción 7 — 5T + 4D', triples: 5, dobles: 4, columnasRequeridas: 192, nivel: 12 },
    columnas: undefined,
    fuente: undefined,
  },
  {
    meta: { id: 8, nombre: 'Reducción 8 — 3T + 8D', triples: 3, dobles: 8, columnasRequeridas: 216, nivel: 12 },
    columnas: undefined,
    fuente: undefined,
  },
  {
    meta: { id: 9, nombre: 'Reducción 9 — 6T + 2D', triples: 6, dobles: 2, columnasRequeridas: 288, nivel: 12 },
    columnas: undefined,
    fuente: undefined,
  },
  // ─── REDUCCIONES AL 11 ───
  {
    meta: { id: 10, nombre: 'Reducción 10 — 4T + 6D', triples: 4, dobles: 6, columnasRequeridas: 432, nivel: 11 },
    columnas: undefined,
    fuente: undefined,
  },
  {
    meta: { id: 11, nombre: 'Reducción 11 — 7T + 3D', triples: 7, dobles: 3, columnasRequeridas: 648, nivel: 11 },
    columnas: undefined,
    fuente: undefined,
  },
  {
    meta: { id: 12, nombre: 'Reducción 12 — 10D + 1T', triples: 1, dobles: 10, columnasRequeridas: 512, nivel: 11 },
    columnas: undefined,
    fuente: undefined,
  },
]

/** Cuántas matrices están integradas */
export function matricesIntegradas(): number {
  return REGISTRO_MATRICES.filter((m) => m.columnas !== undefined).length
}

/** Cuántas matrices están pendientes */
export function matricesPendientes(): number {
  return REGISTRO_MATRICES.filter((m) => m.columnas === undefined).length
}

import type { ReduccionInfo } from '../types'

/**
 * Tabla completa de reducciones oficiales (Modelo 13).
 * Garantía de 13 aciertos con N triples y/o M dobles.
 */
export const REDUCCIONES: ReduccionInfo[] = [
  { id: 1,  nombre: 'Reducción 1  — 4 Triples',     descripcion: '4 partidos a triple, resto a fijo.',          boletos: 9,    precio: 6.75,   garantia: '100% al 13',  nivel: 13, configRequerida: { triples: 4, dobles: 0 } },
  { id: 2,  nombre: 'Reducción 2  — 7 Dobles',       descripcion: '7 partidos a doble, resto a fijo.',          boletos: 16,   precio: 12.00,  garantia: '100% al 13',  nivel: 13, configRequerida: { triples: 0, dobles: 7 } },
  { id: 3,  nombre: 'Reducción 3  — 3T + 3D',        descripcion: '3 triples + 3 dobles en reducción.',         boletos: 24,   precio: 18.00,  garantia: '100% al 13',  nivel: 13, configRequerida: { triples: 3, dobles: 3 } },
  { id: 4,  nombre: 'Reducción 4  — 2T + 6D',        descripcion: '2 triples + 6 dobles en reducción.',         boletos: 64,   precio: 48.00,  garantia: '100% al 13',  nivel: 13, configRequerida: { triples: 2, dobles: 6 } },
  { id: 5,  nombre: 'Reducción 5  — 8 Triples',      descripcion: '8 partidos a triple.',                       boletos: 81,   precio: 60.75,  garantia: '100% al 13',  nivel: 13, configRequerida: { triples: 8, dobles: 0 } },
  { id: 6,  nombre: 'Reducción 6  — 11 Dobles',      descripcion: '11 partidos a doble.',                       boletos: 132,  precio: 99.00,  garantia: '100% al 13',  nivel: 13, configRequerida: { triples: 0, dobles: 11 } },
  { id: 7,  nombre: 'Reducción 7  — 5T + 4D',        descripcion: '5 triples + 4 dobles — reducción avanzada.', boletos: 192,  precio: 144.00, garantia: '100% al 12',  nivel: 12, configRequerida: { triples: 5, dobles: 4 } },
  { id: 8,  nombre: 'Reducción 8  — 3T + 8D',        descripcion: '3 triples + 8 dobles — cobertura amplia.',   boletos: 216,  precio: 162.00, garantia: '100% al 12',  nivel: 12, configRequerida: { triples: 3, dobles: 8 } },
  { id: 9,  nombre: 'Reducción 9  — 6T + 2D',        descripcion: '6 triples + 2 dobles.',                      boletos: 288,  precio: 216.00, garantia: '100% al 12',  nivel: 12, configRequerida: { triples: 6, dobles: 2 } },
  { id: 10, nombre: 'Reducción 10 — 4T + 6D',        descripcion: '4 triples + 6 dobles — máximo ahorro.',      boletos: 432,  precio: 324.00, garantia: '100% al 11',  nivel: 11, configRequerida: { triples: 4, dobles: 6 } },
  { id: 11, nombre: 'Reducción 11 — 7T + 3D',        descripcion: '7 triples + 3 dobles.',                      boletos: 648,  precio: 486.00, garantia: '100% al 11',  nivel: 11, configRequerida: { triples: 7, dobles: 3 } },
  { id: 12, nombre: 'Reducción 12 — 10 Dobles + 1T', descripcion: '10 dobles + 1 triple — combo híbrido.',      boletos: 512,  precio: 384.00, garantia: '100% al 11',  nivel: 11, configRequerida: { triples: 1, dobles: 10 } },
]

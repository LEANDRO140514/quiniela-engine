/**
 * Baril de exportación del motor de quiniela.
 * Importa desde aquí para acceder a todo el motor.
 */

// Tipos
export type {
  Signo,
  NivelGarantia,
  Columna,
  ConfigUsuario,
  ConteoSignos,
  ResultadoDirecto,
  ReduccionMeta,
  MatrizReduccion,
  EstadoMotor,
} from './types'

// Engine — Validación
export {
  TOTAL_PARTIDOS,
  PRECIO_POR_COLUMNA,
  TOTAL_COLUMNAS_UNIVERSO,
  validarConfig,
  contarSignos,
} from './engine/validate'

// Engine — Pricing
export {
  calcularPresupuestoDirecto,
  esViable,
  calcPremios,
} from './engine/pricing'

// Engine — Directa
export {
  generarDirecta,
  generarPorLotes,
} from './engine/direct'

// Engine — Reducciones
export {
  CATALOGO_REDUCCIONES,
  esCompatible,
  reduccionesCompatibles,
  estadoMotor,
  obtenerColumnasReduccion,
  calcularAhorroReduccion,
} from './engine/reductions'

// Matrices
export {
  REGISTRO_MATRICES,
  matricesIntegradas,
  matricesPendientes,
} from './matrices/oficiales'

// Algoritmos — Cobertura
export {
  aciertosColumna,
  aciertosPorColumna,
  cumpleGarantia,
  configCubreResultado,
  tasaCobertura,
} from './algorithms/coverage'
export type { ResultadoReal } from './algorithms/coverage'

// Algoritmos — Set Cover (stubs)
export {
  cotaSchonheim,
} from './algorithms/setCover'
export type { CoveringProblem, CoveringSolution } from './algorithms/setCover'

// Algoritmos — Heurísticas
export {
  filtrarPorFrecuencia,
  scoreDiversidad,
  ordenarPorDiversidad,
  topNDiversas,
  distanciaHamming,
  estadisticasConfig,
} from './algorithms/heuristics'

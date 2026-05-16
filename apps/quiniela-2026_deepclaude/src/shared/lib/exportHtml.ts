import type { BoletosGenerados } from '../types'
import type { Signo } from '../../lib/quiniela'

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Courier New', monospace;
  font-size: 10pt;
  color: #111;
  background: #fff;
  padding: 20px;
  max-width: 100%;
}
.header { border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 12px; }
.header h1 { font-size: 14pt; font-weight: 700; letter-spacing: 1px; }
.header h2 { font-size: 10pt; font-weight: 400; color: #555; margin-top: 2px; }
.header-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 8pt; color: #333; margin-top: 6px; }
.header-meta span { border: 1px solid #999; padding: 1px 8px; font-weight: 600; }

/* ─── Config pills ─── */
.config-row { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 14px; }
.config-pill {
  padding: 1px 6px; font-size: 7pt; font-weight: 700; border: 1px solid #888;
  min-width: 36px; text-align: center;
}
.config-pill.triple { border-color: #c0c; color: #c0c; border-width: 2px; }
.config-pill.doble { border-color: #088; color: #088; border-width: 2px; }
.config-pill.fijo { border-color: #aaa; color: #444; }

/* ─── Boleto grid ─── */
.boleto {
  border: 2px solid #111;
  margin-bottom: 16px;
  page-break-inside: avoid;
}
.boleto-header {
  background: #111; color: #fff; padding: 4px 10px;
  font-size: 9pt; font-weight: 700; letter-spacing: 1px;
}
.boleto-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}
.boleto-col {
  display: grid;
  grid-template-rows: repeat(7, auto);
}
.match-row {
  display: flex; align-items: center; gap: 0;
  border-bottom: 1px solid #ddd;
  min-height: 28px;
}
.match-num {
  width: 28px; text-align: center; font-size: 7pt; font-weight: 700;
  color: #666; border-right: 1px solid #ddd; padding: 2px 0;
}
.casilla {
  width: 32px; height: 24px; display: flex; align-items: center; justify-content: center;
  font-size: 8pt; font-weight: 700; color: #aaa; border-right: 1px solid #e8e8e8;
  transition: none;
}
.casilla:last-child { border-right: none; }
.casilla.marcado {
  background: #111; color: #fff;
}

/* ─── Info box (sin columnas) ─── */
.info-box {
  background: #fff8e1; border: 1px solid #ffc107; padding: 16px;
  text-align: center; margin: 20px 0; font-size: 10pt; font-weight: 600;
}

/* ─── Footer legal ─── */
.footer-legal {
  margin-top: 20px; padding: 10px; border: 1px solid #999;
  font-size: 8pt; color: #555; text-align: center; line-height: 1.4;
}
.footer-legal strong { color: #111; }

@media print {
  @page { size: A4; margin: 1cm; }
  body { padding: 0; }
  .boleto { print-color-adjust: exact; }
  .boleto-header { print-color-adjust: exact; }
  .casilla.marcado { print-color-adjust: exact; }
  .no-print { display: none; }
}
`

/** Convierte un signo a las casillas L/E/V marcadas */
function signoACasillas(s: Signo): { L: boolean; E: boolean; V: boolean } {
  if (s === '1X2') return { L: true, E: true, V: true }
  if (s === '1X') return { L: true, E: true, V: false }
  if (s === '12') return { L: true, E: false, V: true }
  if (s === 'X2') return { L: false, E: true, V: true }
  if (s === '1') return { L: true, E: false, V: false }
  if (s === 'X') return { L: false, E: true, V: false }
  return { L: false, E: false, V: true } // '2'
}

function renderCasilla(activa: boolean, label: string): string {
  return `<div class="casilla${activa ? ' marcado' : ''}">${label}</div>`
}

/** Renderiza un boleto (columna de 14 signos) */
function renderBoleto(signos: Signo[], numBoleto: number): string {
  // Partidos 1-7 (izquierda) y 8-14 (derecha)
  const izq = signos.slice(0, 7)
  const der = signos.slice(7, 14)

  function renderColumna(signos: Signo[], offset: number): string {
    return signos
      .map((s, i) => {
        const idx = offset + i + 1
        const cas = signoACasillas(s)
        return `<div class="match-row">
          <div class="match-num">${idx}</div>
          ${renderCasilla(cas.L, 'L')}
          ${renderCasilla(cas.E, 'E')}
          ${renderCasilla(cas.V, 'V')}
        </div>`
      })
      .join('')
  }

  return `<div class="boleto">
    <div class="boleto-header">BOLETO ${numBoleto}</div>
    <div class="boleto-grid">
      <div class="boleto-col">${renderColumna(izq, 0)}</div>
      <div class="boleto-col">${renderColumna(der, 7)}</div>
    </div>
  </div>`
}

export function exportarHTML(resultado: BoletosGenerados): { ok: boolean; reason?: string } {
  const fecha = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const tieneColumnas = resultado.columnas && resultado.columnas.length > 0

  let cuerpoHTML: string
  if (tieneColumnas) {
    const boletos = resultado.columnas!
      .map((col, i) => renderBoleto(col as Signo[], i + 1))
      .join('\n')
    cuerpoHTML = boletos
  } else {
    cuerpoHTML = `<div class="info-box">
      Reducción con <strong>${resultado.boletos.toLocaleString('es-MX')} boletos</strong>
      garantizados. Las columnas se integrarán próximamente en el motor.
    </div>`
  }

  const signoLabel = (s: string, i: number) => `${i + 1}:${s}`
  const configPills = resultado.config
    .map((s, i) => {
      const cls = s === '1X2' ? 'triple' : s.length === 2 ? 'doble' : 'fijo'
      return `<span class="config-pill ${cls}">${signoLabel(s, i)}</span>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="es-MX">
<head>
  <meta charset="UTF-8" />
  <title>Progol — ${resultado.titulo}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="header">
    <h1>${resultado.titulo}</h1>
    <h2>${fecha}</h2>
    <div class="header-meta">
      <span>${resultado.boletos.toLocaleString('es-MX')} boletos</span>
      ${resultado.precio ? `<span>${resultado.precio}</span>` : ''}
      ${resultado.ahorro ? `<span>Ahorro: ${resultado.ahorro}</span>` : ''}
      <span>${resultado.garantia}</span>
    </div>
  </div>

  <div class="config-row">${configPills}</div>

  ${cuerpoHTML}

  <div class="footer-legal">
    <strong>Guía generada por quiniela-engine — NO es comprobante oficial.</strong><br />
    Juega tu boleto en una agencia autorizada de Lotería Nacional.
  </div>

  <div class="no-print" style="text-align:center;margin-top:10px;font-size:8pt;color:#aaa;">
    Pulsa Ctrl+P (Cmd+P en Mac) para imprimir esta hoja.
  </div>
</body>
</html>`

  // Usar data URI en vez de window.open + write para evitar bloqueo de popups
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  if (!w) {
    const a = document.createElement('a')
    a.href = url
    a.download = `progol_${resultado.modelo}_${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
    return { ok: true, reason: 'popup-blocked-download' }
  }
  // Limpieza diferida
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return { ok: true }
}

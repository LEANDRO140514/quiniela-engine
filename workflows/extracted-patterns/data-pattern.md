# Data Pattern (Lead Ingestion desde Email)

> Basado en: `data/data-tables-n8n.json`

## Problema
Los emails de consulta llegan continuamente con información no estructurada. Procesarlos manualmente para identificar si son leads reales y extraer nombre, contacto, urgencia y presupuesto consume tiempo y genera errores. Además, el equipo necesita consultar estos leads con filtros dinámicos sin abrir la base de datos.

## Adapters

| Rol | Adapter actual | Futuros |
|-----|----------------|---------|
| Fuente de email | Gmail | GHL Mail, Outlook, IMAP genérico |
| Almacenamiento de leads | n8n Data Tables | GHL CRM, Supabase |

## Solución
Pipeline de dos fases:
1. **Ingesta automática**: adapter de email → clasificador LLM filtra spam → extractor LLM estructura el lead → guarda en adapter de leads
2. **Consulta conversacional**: Chat trigger → AI Agent con herramientas de filtrado sobre el adapter de leads (urgencia, tipo, presupuesto, estado)

## Estados

### Fase 1: Ingesta
| Estado | Descripción |
|--------|-------------|
| `polling` | Adapter de email trigger *(actual: Gmail, cada minuto)* |
| `classifying` | Text Classifier filtra: `SI` (lead real) vs `No` (spam) |
| `extracting` | LLM extrae campos estructurados del email |
| `persisting` | Insert en adapter de leads *(actual: n8n Data Tables)* |

### Fase 2: Consulta
| Estado | Descripción |
|--------|-------------|
| `receiving` | Chat message recibido |
| `reasoning` | Agente selecciona herramienta de filtrado (Think) |
| `querying` | Herramienta ejecuta filtro sobre Data Tables |
| `responding` | Agente responde con resultados |

## Schema del Lead *(adapter actual: n8n Data Tables "Leads")*
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre y apellidos del lead |
| `email` | string | Email del remitente |
| `telefono` | string | Teléfono si lo menciona |
| `resumen` | string | Resumen ≤120 palabras generado por LLM |
| `tipo_consulta` | string | `informacion` \| `presupuesto` \| `colaboracion` \| `otros` |
| `urgencia` | string | `alta` \| `media` \| `baja` |
| `presupuesto` | number | Valor numérico, 0 si no menciona |
| `estado` | string | `Pendiente` (default al crear) |

## Inputs

### Ingesta
- Email completo (subject + body) vía adapter de email *(actual: Gmail OAuth)*
- Clasificación automática: emails de IAbyIA/automatizaciones/IA = `SI`, resto = `No`

### Consulta
- Mensaje de chat en lenguaje natural
- Filtros disponibles: urgencia, tipo_consulta, presupuesto (mayor/menor), estado, obtener todo

## Outputs

### Ingesta
- Registro insertado en adapter de leads con todos los campos + `estado: "Pendiente"`
- *(Migración disponible: Google Sheets → n8n Data Tables via workflow secundario)*

### Consulta
- Respuesta del agente con los leads que coinciden con el filtro
- Cálculos matemáticos si se solicitan (Calculator tool)

## Herramientas del Agente de Consulta
```
AI Agent (GPT-5, reasoning=low, Postgres memory)
  ├── Obtener Todo       → sin filtro                [adapter actual: n8n Data Tables → futuro: GHL]
  ├── Urgencia           → ilike urgencia
  ├── Tipo Consulta      → ilike tipo_consulta
  ├── Presupuesto Mayor a → gte presupuesto
  ├── Presupuesto Menor a → lte presupuesto
  ├── Estado             → ilike estado
  ├── Think              → razonamiento previo a acción
  └── Calculator         → operaciones matemáticas sobre resultados
```

## Edge Cases
- **Email de spam que menciona IA**: clasificador puede dar falso positivo — campo `tipo_consulta: "otros"` permite identificarlos después
- **Email sin nombre del remitente**: campo `nombre` queda vacío, no bloquea el flujo
- **Presupuesto mencionado en texto** (ej. "unos 2500 dólares"): LLM extrae el número, devuelve 2500
- **Consulta de chat muy amplia** ("dame todo"): `Obtener Todo` + agente resume
- **Data Tables sin registros**: agente informa que no hay leads con ese criterio

## Engines Futuros
- `gmail-to-supabase` — mismo pipeline guardando en PostgreSQL (Supabase)
- `slack-leads` — notificación a Slack cuando llega lead `urgencia: alta`
- `multi-channel-ingestion` — ingesta desde formularios web, WhatsApp y email en un solo pipeline
- `lead-scoring-auto` — agregar score automático al insertar basado en urgencia + presupuesto

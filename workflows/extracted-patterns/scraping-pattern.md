# Scraping Pattern

> Basado en: `scraping/agente-scraper.json`

## Problema
El agente necesita prospectar leads desde Google Maps (negocios locales con teléfono, web y rating) de forma masiva y estructurada. Scrapear directamente Google Maps está bloqueado; se necesita una API intermediaria que maneje el bypass y devuelva datos limpios para volcarlos al CRM.

## Adapters

| Rol | Adapter actual | Futuros |
|-----|----------------|---------|
| Destino de leads | Google Sheets | GHL, Supabase |

## Solución
HTTP Request a la API de Bright Data (o similar) con parámetros de búsqueda configurables. La respuesta se normaliza con un nodo `Edit Fields` (mapping explícito de campos) y se vuelca al adapter de destino.

## Estados
| Estado | Descripción |
|--------|-------------|
| `triggering` | Ejecución manual o programada |
| `requesting` | POST a la API de scraping con body JSON configurable |
| `mapping` | Edit Fields normaliza los campos del response |
| `persisting` | Append de filas en adapter de destino *(actual: Google Sheets "Leads")* |
| `failed` | Error en la API o sin resultados |

## Inputs (body JSON configurable)
```json
{
  "searchStringsArray": ["peluquería", "peluqueria"],
  "locationQuery": "Buenos Aires, Argentina",
  "maxCrawledPlacesPerSearch": 100,
  "placeMinimumStars": "fourAndHalf",
  "language": "es-419",
  "includeWebResults": false,
  "scrapeReviewsPersonalData": true,
  "skipClosedPlaces": false
}
```

## Outputs (campos normalizados → adapter de destino)
| Campo n8n | Columna Sheets | Fuente |
|-----------|----------------|--------|
| `title` | Empresa | `$json.title` |
| `address` | Dirección | `$json.address` |
| `city` | Ciudad | `$json.city` |
| `countryCode` | País | `$json.countryCode` |
| `phone` | Teléfono | `$json.phoneUnformatted.replace('+', '')` |
| `totalScore` | Estrellas | `$json.totalScore` |
| `website` | Sitio Web | `$json.website` |
| `url` | URL | `$json.url` |

## Edge Cases
- **Teléfono nulo**: expresión `$json.phone !== '' ? $json.phone : 'No tiene teléfono'` previene celdas vacías
- **Negocio sin web**: campo `website` llega undefined — el mapping lo deja vacío sin romper
- **Más de 100 resultados**: `maxCrawledPlacesPerSearch: 100` es el límite configurado — múltiples ejecuciones con variaciones del search string
- **API devuelve error 401**: revisar Bearer token en header `Authorization`
- **Adapter de destino lleno / cuota excedida**: el append falla silenciosamente — agregar validación de cuota *(en Sheets: límite de filas; en GHL: rate limit de API)*
- **Duplicados por ejecuciones múltiples**: no hay deduplicación — combinar con un paso de `removeDuplicates` por teléfono antes del append

## Engines Futuros
- `apify-maps-scraper` — alternativa a Bright Data con Apify Actor
- `outscraper-api` — API especializada en Google Maps con más filtros
- `supabase-leads` — volcar leads a PostgreSQL en vez de Google Sheets
- `dedup-pipeline` — paso de deduplicación automática por teléfono o dominio web

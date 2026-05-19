# RAG Pattern

## Problema
Los LLMs tienen conocimiento estático de entrenamiento. Para responder con información actualizada, privada o específica del negocio (catálogos, manuales, políticas), necesitan acceso a una base de conocimiento externa consultada en tiempo real.

## Adapters

| Rol | Adapter actual | Futuros |
|-----|----------------|---------|
| Vector store | Qdrant | Pinecone, pgvector (Supabase), Weaviate |

## Solución
Pipeline de dos fases: (1) Ingesta — los documentos se trocean, vectorizan y almacenan en el adapter de vector store. (2) Retrieval — en cada consulta se vectoriza la pregunta, se recuperan los K chunks más relevantes y se inyectan como contexto al LLM.

## Estados

### Ingesta (file-ingestion)
| Estado | Descripción |
|--------|-------------|
| `receiving` | Archivo recibido, validando formato |
| `chunking` | Dividiendo en fragmentos con overlap |
| `embedding` | Generando vectores por chunk |
| `storing` | Guardando en colección del adapter de vector store *(actual: Qdrant)* |
| `indexed` | Documento disponible para consulta |

### Retrieval (qdrant-rag)
| Estado | Descripción |
|--------|-------------|
| `embedding_query` | Vectorizando la pregunta del usuario |
| `searching` | Consultando adapter de vector store por similitud |
| `filtering` | Aplicando filtros de metadata si existen |
| `augmenting` | Construyendo el prompt con contexto |
| `generating` | LLM genera la respuesta final |

## Inputs

### Ingesta
- `file` — documento a ingestar (PDF, TXT, DOCX, MD)
- `collection_name` — colección en el adapter de vector store *(actual: Qdrant)*
- `metadata` — tags, categoría, fecha, source

### Retrieval
- `query` — pregunta del usuario en lenguaje natural
- `collection_name` — colección a consultar en el adapter de vector store
- `top_k` — número de chunks a recuperar (default: 5)
- `filters` — filtros opcionales por metadata

## Outputs

### Ingesta
- `document_id` — ID del documento indexado
- `chunks_count` — cantidad de chunks generados
- `collection_name` — colección donde se almacenó

### Retrieval
- `answer` — respuesta generada por el LLM
- `sources[]` — chunks usados como contexto (para citación)
- `confidence_score` — score promedio de los chunks recuperados

## Edge Cases
- **Archivo corrupto o ilegible**: rechazar con mensaje de error claro
- **Chunk sin contexto suficiente**: aumentar `chunkOverlap` o tamaño
- **Score bajo en retrieval**: indicar al usuario que la info no está disponible en vez de alucinar
- **Colección vacía**: responder desde conocimiento base del LLM con disclaimer
- **Documento duplicado**: detectar por hash antes de reingestar
- **Query muy corta** (ej. "precio"): pedir clarificación antes de buscar

## Engines Futuros
- `pinecone-rag` — para escala enterprise con Pinecone
- `pgvector-rag` — RAG sobre PostgreSQL con pgvector (sin servicio externo)
- `weaviate-rag` — para búsqueda híbrida semántica + keyword
- `reranker` — modelo de reranking para mejorar precisión post-retrieval

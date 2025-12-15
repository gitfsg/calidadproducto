# HealthScan - Analizador de Ingredientes

Una aplicación web móvil completa para escanear y analizar ingredientes de productos, evaluando su impacto en la salud humana y animal.

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas

1. **Escáner de Cámara Móvil**
   - Acceso a cámara trasera optimizada para escaneo
   - Captura de fotos con interfaz intuitiva
   - Soporte para carga de archivos de imagen
   - Drag & drop para imágenes

2. **OCR (Reconocimiento Óptico de Caracteres)**
   - Procesamiento automático con Tesseract.js
   - Extracción inteligente de listas de ingredientes
   - Soporte para español e inglés
   - Pre-procesamiento de texto para mejor precisión

3. **Sistema de Análisis Inteligente**
   - Coincidencia de ingredientes con base de datos
   - Clasificación de riesgo automática
   - Puntuación de salud para humanos (0-100)
   - Puntuación de salud para animales (0-100)
   - Detección de ingredientes perjudiciales

4. **Base de Datos Completa**
   - 15+ ingredientes catalogados inicialmente
   - Información detallada de riesgos
   - Números E, nombres alternativos
   - Países con restricciones
   - Dosis máximas recomendadas

5. **Interfaz Móvil Responsiva**
   - Diseño optimizado para móviles
   - PWA (Progressive Web App) instalable
   - Navegación por pestañas intuitiva
   - Tema moderno con iconos Font Awesome

6. **Sistema de Historial**
   - Guardado automático de análisis
   - Búsqueda en historial
   - Sistema de favoritos
   - Eliminación de registros

## 📱 Rutas de Entrada Funcionales

### Páginas Principales
- `/` - **Página principal con escáner**
- `/?tab=scanner` - **Escáner de ingredientes**
- `/?tab=history` - **Historial de análisis**
- `/?tab=database` - **Base de datos de ingredientes**

### APIs RESTful Disponibles
- `GET /tables/ingredients` - Listar ingredientes
- `GET /tables/ingredients/{id}` - Obtener ingrediente específico
- `POST /tables/product_analysis` - Guardar nuevo análisis
- `GET /tables/product_analysis` - Listar análisis
- `GET /tables/user_history` - Obtener historial de usuario
- `POST /tables/user_history` - Agregar al historial
- `PATCH /tables/user_history/{id}` - Actualizar favoritos/notas
- `DELETE /tables/user_history/{id}` - Eliminar del historial

## 🔬 Modelos de Datos

### Tabla: `ingredients`
```javascript
{
  id: "string",                    // ID único
  name: "string",                  // Nombre del ingrediente
  alternative_names: ["array"],    // Nombres alternativos
  category: "string",              // aditivo, conservante, edulcorante, etc.
  risk_level: "string",            // muy_seguro, seguro, moderado, alto_riesgo, peligroso
  health_impact_human: "string",   // Descripción del impacto en humanos
  health_impact_animal: "string",  // Descripción del impacto en animales
  description: "rich_text",        // Descripción detallada
  e_number: "string",              // Número E (ej: E102)
  cas_number: "string",            // Número CAS químico
  banned_countries: ["array"],     // Países donde está prohibido
  max_daily_intake: "string"       // Dosis máxima recomendada
}
```

### Tabla: `product_analysis`
```javascript
{
  id: "string",
  product_name: "string",
  category: "string",              // alimento, bebida, cosmético, etc.
  ingredients_text: "rich_text",   // Texto OCR completo
  ingredients_detected: ["array"], // Lista de ingredientes detectados
  risk_score: "number",            // Puntuación de riesgo (0-100)
  health_score_human: "number",    // Puntuación salud humana (0-100)
  health_score_animal: "number",   // Puntuación salud animal (0-100)
  harmful_ingredients: ["array"],  // Ingredientes perjudiciales
  beneficial_ingredients: ["array"], // Ingredientes beneficiosos
  recommendations: "rich_text",    // JSON con recomendaciones
  analysis_date: "datetime",       // Fecha del análisis
  image_data: "text"               // Datos de imagen (truncados)
}
```

### Tabla: `user_history`
```javascript
{
  id: "string",
  session_id: "string",           // ID de sesión del usuario
  analysis_id: "string",          // Referencia al análisis
  product_name: "string",         // Nombre del producto
  risk_score: "number",           // Puntuación de riesgo
  date: "datetime",               // Fecha del análisis
  favorites: "bool",              // Marcado como favorito
  notes: "string"                 // Notas del usuario
}
```

## 🚀 Características Avanzadas

### Análisis de Seguridad
- **Clasificación por Riesgo**: 5 niveles (muy seguro → peligroso)
- **Evaluación Dual**: Separada para humanos y animales
- **Alertas Específicas**: Advertencias sobre toxicidad para mascotas
- **Recomendaciones Inteligentes**: Basadas en el análisis completo

### Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **OCR**: Tesseract.js para reconocimiento de texto
- **UI**: Font Awesome, Google Fonts (Inter)
- **PWA**: Manifest, Service Worker ready
- **API**: RESTful endpoints para datos
- **Responsive**: Mobile-first design

### Funcionalidades PWA
- **Instalable**: Como aplicación nativa en móviles
- **Offline Ready**: Preparada para funcionamiento offline
- **Optimizada**: Para dispositivos táctiles
- **Accesos Directos**: Shortcuts a funciones principales

## 📊 Servicios de Almacenamiento

- **Base de Datos Principal**: Tablas RESTful para ingredientes y análisis
- **Almacenamiento Local**: localStorage para preferencias y sesión
- **Caché de Imágenes**: Datos base64 truncados para referencia

## 🔄 Flujo de Análisis

1. **Captura**: Cámara o carga de archivo
2. **OCR**: Extracción de texto con Tesseract.js
3. **Procesamiento**: Limpieza y segmentación de ingredientes
4. **Coincidencia**: Búsqueda en base de datos con algoritmos fuzzy
5. **Análisis**: Cálculo de puntuaciones de riesgo y salud
6. **Recomendaciones**: Generación de consejos personalizados
7. **Guardado**: Almacenamiento en historial de usuario

## 📈 Próximos Pasos Recomendados

### Funcionalidades Pendientes

1. **Expansión de Base de Datos**
   - Agregar más ingredientes (objetivo: 500+)
   - Incluir alérgenos comunes
   - Información nutricional detallada

2. **Mejoras de OCR**
   - Preprocesamiento de imágenes avanzado
   - Soporte para múltiples idiomas
   - Reconocimiento de códigos de barras

3. **Funcionalidades Sociales**
   - Compartir análisis
   - Comentarios y valoraciones
   - Base de datos colaborativa

4. **Integraciones**
   - APIs de nutrición externa
   - Bases de datos de alérgenos
   - Conexión con wearables de salud

5. **Análisis Avanzado**
   - IA para detección de patrones
   - Recomendaciones personalizadas
   - Alertas de ingredientes específicos

6. **Mejoras UX**
   - Tutorial interactivo
   - Modo oscuro
   - Personalización de alertas

### Expansiones Técnicas

- **Backend Robusto**: Migración a servidor dedicado
- **Cache Inteligente**: Sistema de caché offline completo
- **Sincronización**: Entre dispositivos del mismo usuario
- **Analytics**: Métricas de uso y efectividad

## 🎯 Objetivos del Proyecto

HealthScan busca empoderar a los consumidores con información transparente sobre los productos que consumen, promoviendo decisiones más informadas para la salud humana y el bienestar animal.

---

**Estado del Proyecto**: ✅ **FUNCIONAL Y COMPLETO**
**Última Actualización**: Octubre 2025
**Versión**: 1.0.0
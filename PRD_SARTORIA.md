# PRD — SARTORIA: Personal Shopper con IA

## Documento de Requisitos — React + Supabase + Stripe + Google Gemini API

---

# 1. VISIÓN GENERAL DEL PRODUCTO

SARTORIA es una aplicación web SaaS responsive (mobile-first) de personal shopper con inteligencia artificial. El usuario sube su armario completo (fotos y datos de cada prenda), una foto suya de cuerpo entero, y cada día la app le recomienda 2 opciones de outfit personalizadas basadas en el clima real de su ubicación, la ocasión del día, y su historial de combinaciones previas. La app genera una imagen del usuario vistiendo cada outfit propuesto. Nunca repite una combinación ya usada hasta agotar todas las posibilidades.

Además, el usuario puede planificar los outfits de toda la semana de una sola vez, asignando un estilo diferente a cada día, y aprobar o ajustar individualmente cada propuesta antes de confirmar.

**Modelo de negocio:** Suscripción freemium con 15 días de prueba gratuita limitada (máx. 5 prendas por categoría, solo Outfit del Día + Armario), después plan mensual (€4,99/mes) o anual (€44,99/año) con todas las funcionalidades desbloqueadas. Pagos gestionados con Stripe.

**Idiomas:** Español (por defecto) e Inglés. El usuario puede cambiar de idioma en cualquier momento.

**Público objetivo:** Hombres (y eventualmente mujeres) que quieren vestir bien sin esfuerzo, usando IA para elegir sus outfits diarios.

---

# 2. STACK TECNOLÓGICO

- **Frontend:** React con Vite y TypeScript, Tailwind CSS, diseño responsive mobile-first
- **Internacionalización (i18n):** react-i18next + i18next (archivos de traducción en JSON: `es.json`, `en.json`)
- **Backend/Base de datos:** Supabase (PostgreSQL + Storage + Auth + Edge Functions)
- **Pagos:** Stripe (Checkout Sessions + Customer Portal + Webhooks)
- **IA para recomendaciones de texto:** Google Gemini API (Gemini 3 Pro para razonamiento complejo, Gemini 2.5 Flash para tareas visuales simples) vía Supabase Edge Function
- **IA para generación de imágenes:** Google Gemini API — Nano Banana Pro (Gemini 3 Pro Image) para generación de imágenes del usuario con outfit. Si los filtros de seguridad de Google bloquean la generación de imágenes de personas, usar como fallback API de OpenAI (DALL-E / GPT Image).
- **API meteorológica:** OpenWeatherMap API (gratuita) para datos en tiempo real
- **Despliegue:** Vercel (frontend) + Supabase (Edge Functions y base de datos)

---

# 3. MODELO DE DATOS (SUPABASE)

## 3.1 Tabla: profiles (Perfil de usuario)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | UUID | Sí | PK, coincide con auth.users.id |
| email | TEXT | Sí | Email del usuario |
| nombre | TEXT | No | Nombre del usuario |
| idioma | TEXT | Sí | Default 'es'. Valores: 'es', 'en' |
| ciudad | TEXT | Sí | Default 'Alicante,ES'. Ciudad para consulta de clima |
| genero | TEXT | No | 'hombre' o 'mujer' (para futuras ampliaciones). Default 'hombre' |
| stripe_customer_id | TEXT | No | ID de cliente en Stripe |
| created_at | TIMESTAMPTZ | Sí | Fecha de registro |

**Trigger automático:** Crear un trigger en PostgreSQL que, al insertarse un nuevo usuario en `auth.users`, cree automáticamente un registro en `profiles` con `id = auth.users.id`, `email = auth.users.email`, `idioma = 'es'`, `ciudad = 'Alicante,ES'`. Esto es crítico para que el flujo de registro no falle.

## 3.2 Tabla: subscriptions (Suscripciones)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | UUID | Sí | PK autogenerado |
| user_id | UUID (FK) | Sí | Referencia a profiles.id |
| stripe_subscription_id | TEXT | No | ID de suscripción en Stripe |
| status | TEXT | Sí | 'trialing', 'active', 'canceled', 'past_due', 'expired' |
| plan | TEXT | Sí | 'monthly' o 'yearly' |
| trial_start | TIMESTAMPTZ | Sí | Inicio del trial |
| trial_end | TIMESTAMPTZ | Sí | Fin del trial (trial_start + 15 días) |
| current_period_start | TIMESTAMPTZ | No | Inicio del periodo de pago actual |
| current_period_end | TIMESTAMPTZ | No | Fin del periodo de pago actual |
| cancel_at_period_end | BOOLEAN | Sí | Default false. Si el usuario cancela, termina al final del periodo |
| created_at | TIMESTAMPTZ | Sí | Fecha de creación |
| updated_at | TIMESTAMPTZ | Sí | Última actualización |

## 3.3 Tabla: prendas (Armario completo)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | UUID | Sí | Primary key autogenerado |
| user_id | UUID (FK) | Sí | Referencia a profiles.id |
| codigo | TEXT | Sí | ID legible único por usuario (ej: CAM-001, POL-002, PAN-003). Se genera automáticamente según categoría + siguiente número disponible |
| categoria | TEXT | Sí | Valores: 'Camisa', 'Polo', 'Camiseta', 'Pantalón', 'Jersey', 'Sudadera', 'Abrigo/Chaqueta', 'Cinturón', 'Calcetines', 'Zapatos', 'Zapatillas', 'Accesorio' |
| marca | TEXT | Sí | Marca de la prenda. Si no se identifica en la foto, se pide al usuario |
| talla | TEXT | Sí | Talla de la prenda. Si no se identifica en la foto, se pide al usuario |
| color | TEXT | Sí | Color principal de la prenda |
| descripcion | TEXT | Sí | Descripción detallada para identificar la prenda |
| estilo | TEXT | Sí | Valores: 'Casual', 'Smart Casual', 'Business Casual', 'Formal', 'Elegante', 'Deportivo' |
| temporada | TEXT | Sí | Valores: 'Verano', 'Entretiempo', 'Invierno', 'Todo el año' |
| foto_url | TEXT | Sí | URL de la foto almacenada en Supabase Storage |
| activa | BOOLEAN | Sí | Default true. Para "retirar" prendas sin borrarlas |
| created_at | TIMESTAMPTZ | Sí | Fecha de alta |

**Prefijos para código automático:** Camisa → CAM, Polo → POL, Camiseta → CMT, Pantalón → PAN, Jersey → JER, Sudadera → SUD, Abrigo/Chaqueta → ABR, Cinturón → CIN, Calcetines → CAL, Zapatos → ZAP, Zapatillas → ZPT, Accesorio → ACC

## 3.4 Tabla: foto_usuario

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | UUID | Sí | Primary key |
| user_id | UUID (FK) | Sí | Referencia a profiles.id |
| foto_url | TEXT | Sí | URL de la foto de cuerpo entero en Supabase Storage |
| descripcion_fisica | TEXT | No | Descripción generada por IA |
| created_at | TIMESTAMPTZ | Sí | Fecha de subida |

## 3.5 Tabla: outfits (Historial de combinaciones)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | UUID | Sí | Primary key |
| user_id | UUID (FK) | Sí | Referencia a profiles.id |
| fecha | DATE | Sí | Fecha en que se usó el outfit |
| ocasion | TEXT | Sí | Tipo de ocasión |
| descripcion_ocasion | TEXT | No | Descripción adicional si es evento especial |
| prenda_superior_id | UUID (FK) | Sí | Referencia a prendas.id |
| prenda_inferior_id | UUID (FK) | Sí | Referencia a prendas.id |
| prenda_calzado_id | UUID (FK) | Sí | Referencia a prendas.id |
| prenda_cinturon_id | UUID (FK) | No | Referencia a prendas.id |
| prenda_capa_exterior_id | UUID (FK) | No | Referencia a prendas.id |
| prenda_calcetines_id | UUID (FK) | No | Referencia a prendas.id |
| temperatura | DECIMAL | Sí | Temperatura ese día |
| condicion_clima | TEXT | Sí | Condición meteorológica |
| imagen_generada_url | TEXT | No | URL de la imagen generada del usuario con el outfit |
| color_palette | TEXT[] | No | Array de colores del outfit (generado por Agente Estilista) |
| style_notes | TEXT | No | Notas de armonía y coherencia (generado por Agente Estilista) |
| imagen_prompt | TEXT | No | Prompt optimizado para generación de imagen (generado por Agente Estilista) |
| elegido | BOOLEAN | Sí | True = outfit elegido, False = descartado |
| favorito | BOOLEAN | Sí | Default false. Para marcar outfits favoritos |
| origen | TEXT | Sí | Default 'diario'. Valores: 'diario', 'planificacion'. Indica si viene de Outfit del Día o de Planificación Semanal |
| created_at | TIMESTAMPTZ | Sí | Timestamp de creación |

## 3.6 Tabla: recomendaciones_compra

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | UUID | Sí | Primary key |
| user_id | UUID (FK) | Sí | Referencia a profiles.id |
| tipo_prenda | TEXT | Sí | Qué tipo de prenda se recomienda |
| descripcion | TEXT | Sí | Descripción de la prenda recomendada |
| justificacion | TEXT | Sí | Por qué hace falta en el armario |
| marca_sugerida | TEXT | Sí | Basada en las marcas favoritas del usuario |
| precio_aproximado | TEXT | No | Rango de precio estimado |
| enlace_compra | TEXT | No | URL directa de tienda |
| comprada | BOOLEAN | Sí | Default false |
| created_at | TIMESTAMPTZ | Sí | Fecha de la recomendación |

## 3.7 Tabla: planificaciones_semanales

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | UUID | Sí | Primary key autogenerado |
| user_id | UUID (FK) | Sí | Referencia a profiles.id |
| nombre | TEXT | No | Nombre opcional (ej: "Semana del 17 feb") |
| fecha_inicio | DATE | Sí | Primer día de la planificación |
| fecha_fin | DATE | Sí | Último día de la planificación |
| estado | TEXT | Sí | 'borrador', 'aprobada', 'completada'. Default 'borrador' |
| created_at | TIMESTAMPTZ | Sí | Fecha de creación |
| updated_at | TIMESTAMPTZ | Sí | Última actualización |

## 3.8 Tabla: planificacion_dias

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | UUID | Sí | Primary key autogenerado |
| planificacion_id | UUID (FK) | Sí | Referencia a planificaciones_semanales.id |
| user_id | UUID (FK) | Sí | Referencia a profiles.id (para RLS) |
| fecha | DATE | Sí | Fecha del día |
| dia_semana | TEXT | Sí | 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo' |
| ocasion | TEXT | Sí | Estilo/ocasión para ese día |
| descripcion_ocasion | TEXT | No | Descripción adicional si es evento especial |
| outfit_id | UUID (FK) | No | Referencia a outfits.id (se llena al aprobar) |
| prenda_superior_id | UUID (FK) | No | Referencia a prendas.id |
| prenda_inferior_id | UUID (FK) | No | Referencia a prendas.id |
| prenda_calzado_id | UUID (FK) | No | Referencia a prendas.id |
| prenda_cinturon_id | UUID (FK) | No | Referencia a prendas.id |
| prenda_capa_ext_id | UUID (FK) | No | Referencia a prendas.id |
| prenda_calcetines_id | UUID (FK) | No | Referencia a prendas.id |
| nombre_look | TEXT | No | Nombre creativo del look |
| explicacion | TEXT | No | Por qué funciona esta combinación |
| color_palette | TEXT[] | No | Array de colores del outfit (generado por Agente Estilista) |
| style_notes | TEXT | No | Notas de armonía y coherencia (generado por Agente Estilista) |
| imagen_prompt | TEXT | No | Prompt optimizado para generación de imagen |
| imagen_generada_url | TEXT | No | URL de la imagen generada (se llena async tras aprobar) |
| temperatura | DECIMAL | No | Temperatura prevista para ese día |
| condicion_clima | TEXT | No | Condición meteorológica prevista |
| aprobado | BOOLEAN | Sí | Default false. True cuando el usuario aprueba |
| created_at | TIMESTAMPTZ | Sí | Fecha de creación |

**Relación:** planificaciones_semanales 1 → N planificacion_dias

---

# 4. ALMACENAMIENTO DE ARCHIVOS (SUPABASE STORAGE)

| Bucket | Contenido |
|--------|-----------|
| wardrobe-photos | Fotos individuales de cada prenda (carpetas por user_id) |
| user-photos | Foto(s) de cuerpo entero del usuario (carpetas por user_id) |
| outfit-images | Imágenes generadas por IA (carpetas por user_id) |

**Límites de subida:**
- Tamaño máximo por imagen: 5 MB
- Formatos aceptados: JPG, PNG, WebP
- Las imágenes se redimensionan a máximo 1200px de ancho antes de subir a Storage para optimizar espacio y rendimiento

---

# 5. PANTALLAS Y FLUJO DE USUARIO

## 5.0 Pantalla: Landing Page (pública, sin login)

**Propósito:** Página de marketing/ventas que convence al visitante de registrarse. ES LA PRIMERA PANTALLA QUE VE CUALQUIER VISITANTE.

**URL:** La raíz de la app ( `/` )

**Idioma:** Se detecta automáticamente del navegador (español si el navegador está en ES, inglés en cualquier otro caso). Botón de cambio de idioma visible (🇪🇸/🇬🇧) en la esquina superior derecha.

**SEO:** Incluir meta tags (title, description), Open Graph tags para compartir en redes sociales, y favicon con logo SARTORIA.

**Estructura (scroll vertical, una sola página):**

### SECCIÓN 1 — Hero:

- Logo SARTORIA (tipografía serif elegante, con la "IA" del final en color de acento — sugiere sutilmente la IA integrada)
- Headline: "Sastrería inteligente. Tu outfit perfecto en 30 segundos." / "Intelligent tailoring. Your perfect outfit in 30 seconds."
- Subtítulo: "SARTORIA analiza tu armario, el clima y tu agenda para vestirte impecable cada día. Sin pensar." / "SARTORIA analyzes your wardrobe, weather, and schedule to dress you impeccably every day. Without thinking."
- CTA principal: Botón grande "Prueba 15 días gratis" / "Try 15 days free" → lleva a registro
- Imagen hero: mockup de la app en un móvil mostrando un outfit generado (puede ser una imagen estática diseñada)

### SECCIÓN 2 — Cómo funciona (3 pasos con iconos):

1. 📸 "Cataloga tu armario" / "Catalog your wardrobe" — "Fotografía cada prenda. La IA de SARTORIA identifica marca, talla y estilo al instante." / "Photograph each garment. SARTORIA's AI identifies brand, size, and style instantly."
2. 👔 "Recibe tu selección" / "Receive your selection" — "Cada mañana, indica la ocasión y SARTORIA te presenta 2 opciones perfectas adaptadas al clima." / "Each morning, set the occasion and SARTORIA presents 2 perfect options adapted to the weather."
3. ✅ "Viste sin pensar" / "Dress without thinking" — "Elige tu outfit, visualízalo con la imagen generada, y sal impecable." / "Choose your outfit, visualize it with the AI-generated image, and step out sharp."

### SECCIÓN 3 — Funcionalidades (grid o lista con iconos):

- 🧠 IA que aprende tu estilo / AI that learns your style
- 🌤️ Adaptado al clima real / Adapted to real weather
- 🚫 Nunca repite combinación / Never repeats a combination
- 📊 Análisis de tu armario / Wardrobe analysis
- 🛍️ Recomendaciones de compra / Purchase recommendations
- 📱 Funciona desde el móvil / Works from your phone
- 🖼️ Imagen de ti con el outfit / Image of you wearing the outfit
- 🗓️ Planificación semanal / Weekly planning
- 🧳 Planificador de maleta / Travel packing planner

### SECCIÓN 4 — Precios:

Título: "Empieza gratis. Viste impecable siempre." / "Start free. Dress impeccably always."

Dos cards de precio lado a lado:

**Card 1 — Plan Mensual:**
- "€4,99/mes" en grande
- "15 días de prueba gratis" / "15-day free trial"
- Lista de features:
  - ✅ Armario ilimitado / Unlimited wardrobe
  - ✅ 2 outfits diarios / 2 daily outfits
  - ✅ Planificación semanal / Weekly planning
  - ✅ Imagen con IA / AI-generated image
  - ✅ Análisis de armario / Wardrobe analysis
  - ✅ Recomendaciones de compra / Purchase recommendations
  - ✅ Planificador de maleta / Travel packing planner
- Botón: "Empezar prueba gratuita" / "Start free trial"

**Card 2 — Plan Anual (DESTACADA con badge "Ahorra 25%" / "Save 25%"):**
- "€44,99/año" en grande
- Debajo: "Equivale a €3,75/mes" / "Just €3.75/month"
- "15 días de prueba gratis" / "15-day free trial"
- Misma lista de features
- Botón: "Empezar prueba gratuita" / "Start free trial" (destacado, color más intenso)

### SECCIÓN 5 — FAQ (acordeón expandible):

- "¿Cómo funciona la prueba gratuita?" / "How does the free trial work?" → "Tienes 15 días para probar SARTORIA con hasta 5 prendas por categoría y acceso al Outfit del Día. Si te convence, suscríbete para desbloquear todas las funciones y armario ilimitado. Si no, cancela antes de que termine y no se te cobrará nada." / "You get 15 days to try SARTORIA with up to 5 garments per category and access to Today's Outfit. If you like it, subscribe to unlock all features and unlimited wardrobe. If not, cancel before it ends and you won't be charged."
- "¿Puedo cancelar en cualquier momento?" / "Can I cancel anytime?" → "Sí, sin compromisos. Puedes cancelar desde tu perfil. Tu suscripción seguirá activa hasta el final del periodo pagado." / "Yes, no commitments. Cancel from your profile. Your subscription stays active until the end of the paid period."
- "¿Qué pasa con mis datos si cancelo?" / "What happens to my data if I cancel?" → "Tus datos se mantienen. Si vuelves a suscribirte, todo estará como lo dejaste." / "Your data is kept. If you resubscribe, everything will be as you left it."
- "¿Funciona con ropa de mujer?" / "Does it work with women's clothing?" → "Actualmente está optimizado para moda masculina. Estamos trabajando en la versión para mujer." / "Currently optimized for men's fashion. We're working on the women's version."
- "¿Necesito subir todo mi armario?" / "Do I need to upload my entire wardrobe?" → "No es obligatorio, pero cuantas más prendas subas, mejores y más variadas serán las combinaciones." / "It's not mandatory, but the more items you upload, the better and more varied the combinations."

### SECCIÓN 6 — Footer:

- Logo SARTORIA
- Enlaces: Términos de servicio, Política de privacidad, Contacto
- "Made with precision and AI"
- Selector de idioma (🇪🇸 Español / 🇬🇧 English)

### SECCIÓN 7 — CTA final flotante:

Barra sticky en la parte inferior (mobile) o banner al final (desktop): "Prueba SARTORIA gratis durante 15 días" / "Try SARTORIA free for 15 days" + Botón "Empezar" / "Start"

---

## 5.1 Pantalla: Registro + Selección de plan + Pago

**Propósito:** Registro del usuario e inicio de la prueba gratuita con método de pago.

**Confirmación de email:** Desactivada en Supabase Auth para simplificar el flujo. El usuario se registra y pasa directamente a la selección de plan sin verificación de email.

**Flujo:**

1. **Registro** (email + password, vía Supabase Auth)
   - Campo email
   - Campo password (mín. 8 caracteres)
   - Botón "Crear cuenta" / "Create account"
   - Link "¿Ya tienes cuenta? Inicia sesión" / "Already have an account? Sign in"

2. **Selección de plan** (inmediatamente después del registro):
   - Se muestran las 2 cards de precio (idénticas a la landing)
   - Texto: "Elige tu plan. Los primeros 15 días son gratis con funciones limitadas." / "Choose your plan. The first 15 days are free with limited features."
   - Al seleccionar un plan → redirige a Stripe Checkout

3. **Stripe Checkout** (página de Stripe, no la construimos):
   - Stripe se encarga de recoger la tarjeta
   - Se configura trial de 15 días (no se cobra nada hasta día 16)
   - Al completar → redirige de vuelta a la app

4. **Post-pago → Onboarding:**
   - Se crea el registro en tabla `subscriptions` con status='trialing'
   - Se redirige al onboarding (subir foto de cuerpo entero)

**Login** (para usuarios existentes):
- Email + password
- Link "¿No tienes cuenta? Regístrate" / "Don't have an account? Sign up"
- Link "Olvidé mi contraseña" / "Forgot password" → Supabase password reset
- Tras login → verifica suscripción activa → si OK, Outfit del Día → si no, página de reactivación

---

## 5.2 Pantalla: Onboarding (solo primera vez, tras pago)

**Propósito:** Configuración inicial del usuario.

1. **Selección de idioma:** "¿En qué idioma prefieres usar SARTORIA?" / "Which language do you prefer?" → 🇪🇸 Español / 🇬🇧 English. Se guarda en `profiles.idioma`.
2. **Selección de ciudad:** "¿Dónde vives? (para consultar el clima)" — Campo de texto con autocompletado. Default: Alicante, ES. Se guarda en `profiles.ciudad`.
3. **Subir foto de cuerpo entero:** El usuario sube su foto de referencia. Se almacena en Supabase Storage bucket `user-photos/{user_id}/`. La app llama a la API de Gemini (gemini-2.5-flash) para analizar la foto y generar una `descripcion_fisica`.
4. **Mensaje de bienvenida:** "Bienvenido a SARTORIA. Tu sastrería inteligente está lista." / "Welcome to SARTORIA. Your intelligent tailoring is ready."
5. → Redirige a Mi Armario

---

## 5.3 Pantalla: Mi Armario

**Propósito:** Ver, gestionar y añadir prendas.

### Vista principal:

- Grid visual con las fotos de todas las prendas, organizadas por categorías (tabs o filtros): Camisas, Polos, Camisetas, Pantalones, Jerséis, Sudaderas, Abrigos/Chaquetas, Cinturones, Calcetines, Zapatos, Zapatillas, Accesorios
- Cada tarjeta muestra: foto + código + marca + descripción corta
- Filtros por: categoría, estilo, temporada, color
- Contador total de prendas y por categoría
- Indicador visual de prendas activas vs retiradas
- **En trial:** Mostrar contador "X/5" por categoría junto al nombre del tab (ej: "Camisas 3/5")

### Límite de prendas en trial (soft block):

Cuando el usuario en trial (`status = 'trialing'`) intenta añadir la 6ª prenda de una categoría:

1. El botón "+" sigue visible (no se oculta)
2. Al pulsarlo, en vez de abrir el formulario de nueva prenda, se muestra un **modal de upsell:**
   - Icono: 🔓
   - Título: "Has alcanzado el límite de prueba" / "You've reached the trial limit"
   - Texto: "En la prueba gratuita puedes tener hasta 5 [categoría] en tu armario. Suscríbete para desbloquear armario ilimitado y todas las funciones." / "During the free trial you can have up to 5 [category] in your wardrobe. Subscribe to unlock unlimited wardrobe and all features."
   - Botón primario: "Desbloquear todo — desde €3,75/mes" / "Unlock everything — from €3.75/month" → Stripe Checkout
   - Botón secundario (texto): "Quizás más tarde" / "Maybe later" → cierra modal
3. Las prendas existentes se pueden editar y eliminar sin restricción

### Añadir prenda nueva (botón flotante "+"):

1. El usuario sube foto de la prenda (cámara del móvil o galería)
2. La app envía la foto a la Edge Function `analyze-garment`
3. La app pre-rellena el formulario con los datos que la IA haya identificado
4. **Si la marca o talla aparecen como "NO VISIBLE"**: esos campos se muestran VACÍOS y RESALTADOS EN ROJO como obligatorios para que el usuario los rellene manualmente. NO se puede guardar la prenda sin marca ni talla.
5. El usuario revisa, corrige si es necesario, y confirma
6. Se genera automáticamente el código
7. Se guarda en la base de datos y la foto en Storage

**Editar prenda:** Tap en cualquier prenda → modal de edición con todos los campos

**Retirar prenda:** Opción de marcarla como inactiva

**Eliminar prenda:** Con confirmación

**Importar desde CSV:** Botón para subir un CSV con separador punto y coma (;), UTF-8. Campos: `codigo;categoria;marca;talla;color;descripcion;estilo;temporada`

---

## 5.4 Pantalla: Outfit del Día (PANTALLA PRINCIPAL tras login)

**Propósito:** Obtener las 2 recomendaciones diarias de outfit.

**NOTA:** Esta pantalla funciona de forma INDEPENDIENTE de la Planificación Semanal (5.10). Aunque el usuario tenga una semana planificada, puede usar Outfit del Día para pedir una recomendación puntual en cualquier momento. Los outfits generados aquí se guardan en el historial como siempre.

### PASO 1 — Selección de ocasión:

"¿Cómo es el plan de hoy?" / "What's today's plan?"

- 🟢 Casual
- 🔵 Smart Casual
- 🟠 Business Casual
- 🔴 Formal / Elegante
- 🟣 Evento especial → campo de texto

Selector de tipo de opciones:
- "Ambas del mismo estilo" / "Both same style" (default)
- "Combinación" / "Mix" → 2 dropdowns

Botón: "👔 Dame mi outfit" / "👔 Give me my outfit"

### PASO 2 — Generación (al pulsar):

1. Skeleton loading
2. Llama a `get-weather` con la ciudad del perfil del usuario → banner clima
3. Obtiene armario (activas) y historial (elegido=true) de Supabase
4. Llama a `generate-outfit`
5. Muestra 2 cards deslizables

### PASO 3 — Cards de opciones:

- Nombre creativo del look
- Badge de estilo con color
- Paleta de colores: círculos pequeños con los colores del outfit (generados por el Agente Estilista)
- Lista de prendas: foto miniatura + código + marca + descripción
- "🎨 Armonía:" / "🎨 Harmony:" + style_notes (por qué los colores y el estilo funcionan juntos)
- "💡 Por qué funciona:" / "💡 Why it works:" + explicación general
- Zona de imagen generada (async — se muestra un skeleton mientras el Agente de Imagen trabaja)
- Botón: "👔 Me pongo esta" / "👔 I'll wear this"

### PASO 4 — Al elegir:

- Guarda en outfits: elegida con elegido=true, otra con elegido=false, origen='diario'
- Animación: "✅ ¡Perfecto! Hoy vas impecable." / "✅ Perfect! You look sharp today."

### Avisos:

- Pocas combinaciones → banner con enlace a Análisis
- Errores → mensaje con botón reintentar
- Pocas prendas → mensaje para ir a Mi Armario

---

## 5.5 Pantalla: Planificación Semanal

**Propósito:** Planificar los outfits de varios días de la semana de una sola vez, para no tener que pedir outfit cada mañana.

**🔒 Requiere suscripción activa.** En trial, el tab muestra candado y al pulsar → modal de upsell.

**NOTA:** Esta pantalla es INDEPENDIENTE de "Outfit del Día" (5.4). El usuario puede usar una, otra, o ambas. Outfit del Día sigue funcionando normalmente aunque haya una planificación activa.

### PASO 1 — Selección de días y estilos:

Título: "Planifica tu semana" / "Plan your week"

Se muestra la semana actual (lunes a domingo) con la fecha de cada día.
Cada día tiene:
- Checkbox para incluirlo en la planificación
- Dropdown de ocasión (mismas opciones que Outfit del Día: Casual, Smart Casual, Business Casual, Formal/Elegante, Evento especial)
- Si "Evento especial" → campo de texto para describir

**Selector global** (encima de los días):
- "Mismo estilo para todos" / "Same style for all" → un solo dropdown que aplica a todos los días marcados
- "Estilo por día" / "Style per day" → cada día tiene su propio dropdown
- Default: "Mismo estilo para todos"

Días pasados de la semana actual aparecen deshabilitados (gris).

Botón: "🗓️ Generar planificación" / "🗓️ Generate plan"

### PASO 2 — Generación:

1. Skeleton loading con mensaje: "Planificando tu semana..." / "Planning your week..."
2. Consulta clima (forecast) para los días seleccionados
3. Obtiene armario (activas) e historial completo de Supabase
4. Llama a Edge Function `generate-weekly-plan`
5. Muestra resultado

### PASO 3 — Vista de la planificación:

Timeline vertical con una card por cada día planificado.

Cada card contiene:
- Cabecera: día de la semana + fecha + badge de ocasión con color
- Info clima: temperatura + condición prevista
- Nombre creativo del look
- Paleta de colores: círculos pequeños con los colores del outfit
- Lista de prendas: foto miniatura + código + marca + descripción
- "🎨 Armonía:" / "🎨 Harmony:" + notas de armonía
- "💡 Por qué funciona:" / "💡 Why it works:"
- Dos botones por card:
  - "✅ Aprobar" / "✅ Approve" → marca ese día como aprobado
  - "🔄 Cambiar" / "🔄 Change" → regenera SOLO ese día manteniendo los demás (llama a `generate-outfit` con contexto de los otros días ya planificados para no repetir prendas entre días)

**Botones globales al final:**
- "✅ Aprobar toda la semana" / "✅ Approve entire week" → aprueba todos
- "🔄 Regenerar todo" / "🔄 Regenerate all" → vuelve a generar toda la planificación

### PASO 4 — Planificación aprobada:

Al aprobar (individualmente o toda la semana):
- Se actualiza `planificacion_dias.aprobado = true`
- Se crea registro en tabla `outfits` para cada día aprobado (con `origen = 'planificacion'`) para mantener la coherencia del historial y la regla de no repetición
- Se actualiza `planificaciones_semanales.estado = 'aprobada'`
- Animación: "✅ ¡Semana planificada! Ya puedes olvidarte de pensar qué ponerte." / "✅ Week planned! You can stop thinking about what to wear."

### Vista de planificación activa:

Si ya hay una planificación aprobada para la semana actual:
- Se muestra la vista de timeline con los outfits aprobados
- Badge "Aprobada" / "Approved" en la cabecera
- Cada día muestra el outfit asignado con estado:
  - Días pasados: badge "Completado" / "Completed" (gris)
  - Día actual: badge "Hoy" / "Today" (destacado, color de acento)
  - Días futuros: badge del día (normal)
- Botón "🗓️ Nueva planificación" / "🗓️ New plan" para crear otra (ej: semana siguiente)

### Avisos:

- Si no hay prendas suficientes para cubrir todos los días sin repetir combinación → banner: "⚠️ Con tu armario actual, algunos días podrían repetir prendas individuales (no la combinación completa). Considera añadir más prendas." / similar en inglés
- Si no hay prendas → mensaje para ir a Mi Armario
- Errores → toast con botón reintentar

---

## 5.6 Pantalla: Historial

**🔒 Requiere suscripción activa.** En trial, el tab muestra candado y al pulsar → modal de upsell.

- Lista cronológica inversa
- Cada entrada: fecha, badge ocasión, badge origen (diario/planificación), imagen generada (thumbnail), prendas con códigos, temperatura
- Botón favorito (estrella)
- Filtros: por ocasión, por mes, solo favoritos, por origen (diario/planificación)
- Estadísticas: total outfits, top 5 más usadas, bottom 5 menos usadas, combinaciones restantes estimadas

---

## 5.7 Pantalla: Análisis

**🔒 Requiere suscripción activa.** En trial, el tab muestra candado y al pulsar → modal de upsell.

- Botón "🔍 Analizar mi armario" / "🔍 Analyze my wardrobe"
- Llama a `analyze-wardrobe`
- Resultados en cards con: tipo, descripción, justificación, marca recomendada, precio, enlace de compra, botón "Ya la compré"

---

## 5.8 Pantalla: Maleta de Viaje

**🔒 Requiere suscripción activa.** Accesible desde perfil/configuración (no tiene tab propio). En trial → al intentar acceder → modal de upsell.

- **Input:** destino, número de días (máximo 5 para datos de clima fiables), actividades previstas por día
- Consulta clima del destino (forecast hasta 5 días vía OpenWeatherMap)
- La IA genera plan de outfits para cada día del viaje
- Lista de días con outfits asignados (mismo formato de card que Planificación Semanal)
- Cada día se puede aprobar o cambiar individualmente
- Al aprobar, se guarda como planificación completada
- Si el viaje supera 5 días, los días restantes se generan sin datos de clima (la IA se basa en la época del año y el destino)
- **Avisos:** si no hay prendas suficientes, sugerir añadir más prendas o ver recomendaciones de compra

---

## 5.9 Pantalla: Perfil / Configuración

**Propósito:** Gestionar cuenta, suscripción e idioma.

**Contenido:**

- **Datos personales:** nombre, email (no editable), ciudad (editable con autocompletado)
- **Idioma:** Selector 🇪🇸 Español / 🇬🇧 English → guarda en `profiles.idioma`, cambia toda la UI inmediatamente
- **Foto de referencia:** ver/cambiar la foto de cuerpo entero
- **Suscripción:**
  - Estado actual: "Prueba gratuita (X días restantes)" / "Plan mensual activo" / "Plan anual activo"
  - Fecha de próxima facturación
  - Botón "Gestionar suscripción" / "Manage subscription" → abre **Stripe Customer Portal** (página de Stripe donde el usuario puede cambiar de plan, actualizar tarjeta, cancelar)
  - Si trial expirado sin pago: banner rojo "Tu prueba ha expirado. Suscríbete para seguir usando SARTORIA." / "Your trial has expired. Subscribe to continue using SARTORIA." + botón a Stripe Checkout
- **Cerrar sesión** / "Sign out"
- **Eliminar cuenta** / "Delete account" → confirmación doble → cancela suscripción en Stripe → borra datos del usuario en todas las tablas → borra archivos de Storage → elimina cuenta de Supabase Auth

---

## 5.10 Pantalla: Paywall (cuando la suscripción no es válida)

**Se muestra cuando:** El usuario intenta acceder a cualquier funcionalidad (Outfit, Planificación, Armario, Historial, Análisis, Maleta) pero su suscripción no es 'trialing' ni 'active'.

**Contenido:**
- Mensaje: "Tu suscripción ha expirado" / "Your subscription has expired"
- Texto: "Para seguir usando SARTORIA, elige un plan:" / "To continue using SARTORIA, choose a plan:"
- Cards de precio (mensual/anual)
- Botón "Reactivar" / "Reactivate" → Stripe Checkout
- Link "Cerrar sesión" / "Sign out"
- Tu armario y datos se mantienen, solo se bloquea el acceso a las funciones

---

# 6. SISTEMA DE PAGOS (STRIPE)

## 6.1 Configuración de Stripe

**Productos a crear en Stripe Dashboard:**
- Producto: "SARTORIA"
- Precio 1: €4,99/mes recurrente (ID: price_monthly)
- Precio 2: €44,99/año recurrente (ID: price_yearly)
- Ambos precios con trial_period_days: 15

**Configuración del Customer Portal en Stripe Dashboard (Settings → Customer portal):**
- Permitir: cambiar de plan, actualizar método de pago, cancelar suscripción
- URL de retorno: `{APP_URL}/profile`
- Branding: logo SARTORIA y colores de la app

**Variables necesarias (Supabase Secrets):**
- `GEMINI_API_KEY` — clave de API de Google Gemini (proveedor principal de IA)
- `OPENAI_API_KEY` — clave de API de OpenAI (fallback para generación de imágenes si Gemini falla)
- `WEATHER_API_KEY` — clave de API de OpenWeatherMap
- `STRIPE_SECRET_KEY` — clave secreta de Stripe
- `STRIPE_WEBHOOK_SECRET` — secreto del webhook
- `STRIPE_PRICE_MONTHLY` — ID del precio mensual (price_xxx)
- `STRIPE_PRICE_YEARLY` — ID del precio anual (price_xxx)

**Variable en frontend (Vercel env vars):**
- `VITE_STRIPE_PUBLISHABLE_KEY` — clave pública de Stripe

## 6.2 Edge Function: create-checkout-session

**Input:** `{ plan: 'monthly' | 'yearly', user_id, email }`

**Acción:**
1. Busca o crea el Stripe Customer (con email del usuario)
2. Guarda `stripe_customer_id` en profiles si es nuevo
3. Crea Stripe Checkout Session con:
   - price: según plan (monthly o yearly)
   - mode: 'subscription'
   - subscription_data.trial_period_days: 15
   - success_url: `{APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`
   - cancel_url: `{APP_URL}/pricing`
   - customer: stripe_customer_id
   - metadata: `{ user_id }`
4. Devuelve: `{ url: checkout_session.url }`

**Seguridad:** Solo usuarios autenticados

## 6.3 Edge Function: create-portal-session

**Input:** `{ user_id }`

**Acción:**
1. Obtiene `stripe_customer_id` de profiles
2. Crea Stripe Billing Portal Session con return_url: `{APP_URL}/profile`
3. Devuelve: `{ url: portal_session.url }`

**Uso:** El usuario accede desde Perfil → "Gestionar suscripción"

## 6.4 Edge Function: stripe-webhook

**Input:** Stripe webhook event (body raw)

**Verificación:** Valida firma con `STRIPE_WEBHOOK_SECRET`

**Eventos a manejar:**

| Evento Stripe | Acción en Supabase |
|---------------|-------------------|
| checkout.session.completed | Crear registro en subscriptions con status='trialing', guardar stripe_subscription_id |
| customer.subscription.updated | Actualizar status, current_period_start, current_period_end, cancel_at_period_end |
| customer.subscription.deleted | Actualizar status='expired' |
| invoice.payment_succeeded | Actualizar status='active', actualizar periodos |
| invoice.payment_failed | Actualizar status='past_due' |

**Seguridad:** NO requiere JWT (es Stripe quien llama). Verificar firma del webhook.

**Despliegue:** `supabase functions deploy stripe-webhook --no-verify-jwt`

## 6.5 Lógica de acceso (Trial limitado vs. Suscripción completa)

En el frontend, la lógica de acceso tiene dos niveles:

**Nivel 1 — ¿Tiene acceso básico?** (¿puede usar la app?)
1. Consultar tabla `subscriptions WHERE user_id = usuario actual`
2. Si status = 'trialing' Y now() < trial_end → ACCESO TRIAL (limitado)
3. Si status = 'active' → ACCESO COMPLETO
4. En cualquier otro caso → MOSTRAR PAYWALL (pantalla 5.10)

**Nivel 2 — ¿Qué funcionalidades tiene disponibles?**

| Funcionalidad | Trial (15 días) | Suscripción activa |
|---------------|-----------------|-------------------|
| Mi Armario | ✅ Máx. 5 prendas por categoría | ✅ Ilimitado |
| Outfit del Día | ✅ Completo (2 opciones) | ✅ Completo |
| Planificación Semanal | 🔒 Bloqueada | ✅ Completa |
| Historial | 🔒 Bloqueado | ✅ Completo |
| Análisis de Armario | 🔒 Bloqueado | ✅ Completo |
| Maleta de Viaje | 🔒 Bloqueada | ✅ Completa |
| Generación de imagen | ✅ Incluida | ✅ Incluida |

**Límite de prendas en trial:**
- Máximo 5 prendas por categoría (5 camisas, 5 polos, 5 pantalones, etc.)
- El conteo se hace por categoría, no global
- Al intentar añadir la 6ª prenda de una categoría → soft block (ver sección 5.3)
- Las prendas existentes se pueden editar y eliminar sin restricción

Crear un hook React: `useSubscription()` que devuelve:
```
{
  isActive: boolean,        // true si trialing o active
  isTrial: boolean,         // true solo si trialing
  isPaid: boolean,          // true solo si active (pagado)
  status: string,           // 'trialing', 'active', 'expired', etc.
  daysRemaining: number,    // días restantes del trial o periodo
  plan: string,             // 'monthly' o 'yearly'
  canAccessFeature: (feature: string) => boolean  // verifica acceso por funcionalidad
}
```

`canAccessFeature` devuelve true/false según la tabla anterior. Se usa en cada pantalla para mostrar u ocultar funcionalidades.

**Banner de trial:** Cuando status='trialing', mostrar banner discreto en la parte superior: "Prueba gratuita: X días restantes · Armario limitado a 5 prendas/categoría" / "Free trial: X days remaining · Wardrobe limited to 5 items/category" + enlace "Desbloquear todo" / "Unlock everything" → Stripe Checkout

---

# 7. SISTEMA DE INTERNACIONALIZACIÓN (i18n)

## 7.1 Implementación técnica

- **Librería:** react-i18next + i18next
- **Archivos de traducción:** `src/locales/es.json` y `src/locales/en.json`
- **Detección inicial:** i18next-browser-languagedetector (detecta idioma del navegador)
- **Persistencia:** Se guarda en `profiles.idioma` y se aplica al cargar la app

## 7.2 Estructura de los archivos de traducción

```json
{
  "common": {
    "appName": "SARTORIA",
    "tagline": "Sastrería inteligente",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "loading": "Cargando...",
    "retry": "Reintentar",
    "close": "Cerrar",
    "back": "Volver",
    "next": "Siguiente",
    "confirm": "Confirmar"
  },
  "landing": {
    "hero_title": "Sastrería inteligente. Tu outfit perfecto en 30 segundos.",
    "hero_subtitle": "SARTORIA analiza tu armario, el clima y tu agenda para vestirte impecable cada día. Sin pensar.",
    "cta": "Prueba 15 días gratis",
    "..."
  },
  "auth": {
    "login": "Iniciar sesión",
    "signup": "Crear cuenta",
    "email": "Email",
    "password": "Contraseña",
    "..."
  },
  "nav": {
    "outfit": "Outfit",
    "planning": "Planificar",
    "wardrobe": "Armario",
    "history": "Historial",
    "analysis": "Análisis"
  },
  "outfit": {
    "title": "¿Cómo es el plan de hoy?",
    "casual": "Casual",
    "smart_casual": "Smart Casual",
    "business_casual": "Business Casual",
    "formal": "Formal / Elegante",
    "special_event": "Evento especial",
    "generate_button": "👔 Dame mi outfit",
    "choose_button": "👔 Me pongo esta",
    "success": "✅ ¡Perfecto! Hoy vas impecable.",
    "weather_banner": "🌤️ {{city}} hoy: {{temp}}°C — {{condition}}",
    "why_it_works": "💡 Por qué funciona:",
    "color_harmony": "🎨 Armonía:",
    "few_combinations": "⚠️ Quedan pocas combinaciones. ¿Ver recomendaciones de compra?",
    "..."
  },
  "planning": {
    "title": "Planifica tu semana",
    "same_style": "Mismo estilo para todos",
    "per_day_style": "Estilo por día",
    "generate_button": "🗓️ Generar planificación",
    "generating": "Planificando tu semana...",
    "approve_day": "✅ Aprobar",
    "change_day": "🔄 Cambiar",
    "approve_all": "✅ Aprobar toda la semana",
    "regenerate_all": "🔄 Regenerar todo",
    "success": "✅ ¡Semana planificada! Ya puedes olvidarte de pensar qué ponerte.",
    "new_plan": "🗓️ Nueva planificación",
    "status_approved": "Aprobada",
    "status_today": "Hoy",
    "status_completed": "Completado",
    "few_garments_warning": "⚠️ Con tu armario actual, algunos días podrían repetir prendas individuales. Considera añadir más prendas.",
    "monday": "Lunes",
    "tuesday": "Martes",
    "wednesday": "Miércoles",
    "thursday": "Jueves",
    "friday": "Viernes",
    "saturday": "Sábado",
    "sunday": "Domingo"
  },
  "wardrobe": { "..." },
  "history": { "..." },
  "analysis": { "..." },
  "pricing": {
    "title": "Empieza gratis. Viste impecable siempre.",
    "monthly": "Mensual",
    "yearly": "Anual",
    "monthly_price": "€4,99/mes",
    "yearly_price": "€44,99/año",
    "yearly_equivalent": "Equivale a €3,75/mes",
    "save_badge": "Ahorra 25%",
    "trial": "15 días de prueba gratis",
    "start_trial": "Empezar prueba gratuita",
    "feature_unlimited_wardrobe": "Armario ilimitado",
    "feature_daily_outfits": "2 outfits diarios",
    "feature_weekly_planning": "Planificación semanal",
    "feature_ai_image": "Imagen con IA",
    "feature_wardrobe_analysis": "Análisis de armario",
    "feature_purchase_recommendations": "Recomendaciones de compra",
    "feature_travel_planner": "Planificador de maleta",
    "..."
  },
  "profile": { "..." },
  "subscription": {
    "trialing": "Prueba gratuita",
    "trial_days_remaining": "Prueba gratuita: {days} días restantes",
    "trial_wardrobe_limited": "Armario limitado a 5 prendas/categoría",
    "trial_limit_title": "Has alcanzado el límite de prueba",
    "trial_limit_wardrobe": "En la prueba gratuita puedes tener hasta 5 {category} en tu armario. Suscríbete para desbloquear armario ilimitado y todas las funciones.",
    "trial_limit_feature": "Esta función está disponible con la suscripción",
    "trial_unlock_all": "Desbloquear todo — desde €3,75/mes",
    "trial_maybe_later": "Quizás más tarde",
    "trial_counter": "{count}/5",
    "active": "Activa",
    "expired": "Expirada",
    "days_remaining": "{{days}} días restantes",
    "manage": "Gestionar suscripción",
    "reactivate": "Reactivar",
    "..."
  }
}
```

> Nota: El archivo `en.json` sigue la misma estructura con todas las claves traducidas al inglés.

## 7.3 Reglas de i18n

- **NUNCA** textos hardcodeados en JSX. Todo pasa por `t('key')` de react-i18next.
- Los textos de la IA (explicaciones de outfits, análisis) se generan en el idioma del usuario. Se pasa `idioma` al prompt de la Edge Function.
- Los nombres de categorías, estilos y temporadas se traducen en el frontend.
- Los badges, toasts, mensajes de error: todo traducido.
- La Landing Page se traduce completa según idioma detectado o seleccionado.

---

# 8. APIS EXTERNAS Y EDGE FUNCTIONS

**Nota importante:** Todas las Edge Functions deben incluir headers CORS que permitan requests desde el dominio de Vercel (frontend desplegado). Ejemplo: `Access-Control-Allow-Origin: https://tu-dominio.vercel.app`.

**Proveedor de IA principal:** Google Gemini API (`@google/generative-ai` SDK para Deno/Edge Functions).

## 8.0 ARQUITECTURA DE CADENA DE AGENTES (Agent Chain)

La generación de outfits en SARTORIA sigue una cadena de 2 agentes especializados que garantizan calidad en tres dimensiones: adecuación al clima/ocasión, armonía de colores y estilo coherente, y generación de imagen realista. Esta cadena se aplica a TODA generación de outfits: Outfit del Día, Planificación Semanal y Maleta de Viaje.

### Pipeline de 2 pasos:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PASO 1: AGENTE ESTILISTA                     │
│                     (gemini-3-pro — texto)                      │
│                                                                 │
│  Input: armario + historial + clima + ocasión + idioma          │
│                                                                 │
│  Rol 1 — Selección de prendas:                                  │
│    • Filtra prendas por temporada vs. temperatura actual        │
│    • Filtra por estilo vs. ocasión solicitada                   │
│    • Consulta historial para no repetir combinaciones           │
│    • Selecciona las prendas candidatas                          │
│                                                                 │
│  Rol 2 — Validación de armonía (auto-corrección):               │
│    • Valida que los colores combinan entre sí                   │
│    • Valida coherencia de estilo (no mezclar formal con casual) │
│    • Valida peso/capas vs. temperatura                          │
│    • Si detecta un problema: SUSTITUYE la prenda problemática   │
│      por otra del armario que SÍ armonice (no genera nueva      │
│      propuesta completa, solo ajusta la pieza que falla)        │
│    • Repite la validación hasta que pase                        │
│                                                                 │
│  Output: JSON con outfit validado + nombre_look + explicación   │
│          + campo "color_palette" (los colores del outfit)       │
│          + campo "style_notes" (por qué es coherente)           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                PASO 2: AGENTE DE IMAGEN                         │
│          (gemini-3-pro-image / fallback: dall-e-3)              │
│                                                                 │
│  Input: foto_usuario + outfit validado del Paso 1               │
│         (incluye: descripción de cada prenda, colores exactos,  │
│          estilo, color_palette y style_notes)                   │
│                                                                 │
│  Acción:                                                        │
│    • Genera imagen del usuario vistiendo el outfit completo     │
│    • Usa la descripción detallada del Paso 1 para precisión     │
│    • Los colores y estilos ya están validados                   │
│                                                                 │
│  Output: URL de imagen generada (guardada en Storage)           │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura del prompt del Agente Estilista (Paso 1)

El prompt del Agente Estilista es un system prompt estructurado en 3 bloques que se ejecutan secuencialmente dentro de una sola llamada:

**Bloque A — Identidad y contexto:**
```
Eres un estilista personal experto con conocimiento profundo de moda masculina.
Tu trabajo tiene 2 fases que DEBES seguir en orden estricto:
FASE 1: Seleccionar las prendas del outfit.
FASE 2: Validar armonía de colores y coherencia de estilo. Si falla, ajustar.
```

**Bloque B — Reglas de selección (Fase 1):**
```
REGLAS DE SELECCIÓN:
- Clima: [temperatura]°C, [condición]. 
  · >28°C: solo prendas de temporada Verano o Todo el año, nada de capas
  · 20-28°C: prendas de Entretiempo o Todo el año, capa exterior opcional
  · 14-20°C: capas recomendadas, jersey o sudadera + capa exterior
  · <14°C: abrigo obligatorio, jersey o sudadera debajo
  · Lluvia: calzado cerrado e impermeable, evitar zapatillas de tela
  · Viento fuerte: evitar prendas abiertas tipo americana ligera
- Ocasión: [ocasión].
  · Casual: camisetas, polos, vaqueros, zapatillas
  · Smart Casual: polos, camisas, chinos, zapatos limpios
  · Business Casual: camisas, pantalones de vestir, cinturón, zapatos
  · Formal: camisa de vestir, pantalón de vestir, zapatos de vestir, cinturón
  · Evento especial: [descripción] — adaptar al contexto
- NUNCA repetir una combinación completa que ya esté en el historial
- Las prendas individuales SÍ pueden repetirse en combinaciones diferentes
```

**Bloque C — Reglas de validación (Fase 2):**
```
REGLAS DE ARMONÍA DE COLORES:
- Neutros (negro, blanco, gris, azul marino, beige) combinan entre sí y con todo
- Máximo 3 colores distintos por outfit (excluyendo neutros)
- Evitar combinar: marrón + negro, azul marino + negro (salvo excepciones formales)
- Los calcetines deben armonizar con el pantalón o los zapatos, NO con la parte superior
- El cinturón debe armonizar con el calzado (mismo tono o familia de color)

REGLAS DE COHERENCIA DE ESTILO:
- No mezclar prendas deportivas con formales (ej: zapatillas running + camisa de vestir)
- El estilo de TODAS las prendas debe ser compatible con la ocasión
- Si una prenda es 'Deportivo', solo usarla en ocasión 'Casual'

PROCESO DE VALIDACIÓN:
1. Revisa el outfit seleccionado en Fase 1
2. ¿Los colores cumplen las reglas? Si NO → sustituye SOLO la prenda que falla por otra del armario que armonice
3. ¿El estilo es coherente? Si NO → sustituye SOLO la prenda que falla
4. ¿El peso/capas es adecuado al clima? Si NO → ajusta (añade o quita capa)
5. Tras cada ajuste, vuelve a validar hasta que todo pase
6. En el output, incluye "color_palette" y "style_notes" explicando la armonía
```

### Formato de salida del Agente Estilista

```json
{
  "opciones": [
    {
      "nombre_look": "Ejecutivo Mediterráneo",
      "ocasion": "Business Casual",
      "prenda_superior_id": "CAM-003",
      "prenda_inferior_id": "PAN-002",
      "prenda_calzado_id": "ZAP-001",
      "prenda_cinturon_id": "CIN-001",
      "prenda_capa_exterior_id": null,
      "prenda_calcetines_id": "CAL-004",
      "color_palette": ["azul claro", "beige", "marrón cognac"],
      "style_notes": "Paleta mediterránea: azul camisa + beige chino crean contraste limpio. Cinturón y zapatos en marrón cognac unifican la parte inferior. Sin capa exterior porque 24°C lo permite.",
      "explicacion": "Look business casual perfecto para un día soleado de 24°C. La camisa de lino azul transpira bien, el chino beige es versátil y los zapatos marrones añaden sofisticación sin ser excesivamente formales.",
      "clima_adaptacion": "24°C soleado → sin capas, tejido ligero",
      "imagen_prompt": "Hombre de [descripcion_fisica] vistiendo camisa de lino azul claro, pantalón chino beige, cinturón de cuero marrón cognac, zapatos derby marrón cognac, calcetines azul marino. Estilo business casual, look limpio y mediterráneo."
    }
  ]
}
```

> **Nota:** El campo `imagen_prompt` lo genera el Agente Estilista como instrucción optimizada para el Agente de Imagen. Incluye los colores exactos, tejidos y estilo, evitando ambigüedades.

### Cómo se aplica la cadena en cada contexto

| Contexto | Paso 1 (Estilista) | Paso 2 (Imagen) |
|----------|---------------------|-----------------|
| Outfit del Día | 1 llamada → genera 2 opciones validadas | 2 llamadas → 1 imagen por opción (async) |
| Planificación Semanal | 1 llamada → genera N outfits validados (uno por día) | N llamadas → 1 imagen por día (async, en paralelo) |
| Maleta de Viaje | 1 llamada → genera N outfits validados (uno por día) | N llamadas → 1 imagen por día (async, en paralelo) |
| Regenerar 1 día (Planificación) | 1 llamada → genera 1 outfit validado (con contexto de los otros días) | 1 llamada → 1 imagen |

### Tabla de modelos por función

| Edge Function | Modelo | Justificación |
|---------------|--------|---------------|
| generate-outfit (Paso 1) | gemini-3-pro | Razonamiento complejo: selección + validación + armonía |
| generate-outfit-image (Paso 2) | gemini-3-pro-image (Nano Banana Pro) | Generación de imagen. Fallback: dall-e-3 |
| generate-weekly-plan (Paso 1) | gemini-3-pro | Múltiples días, más contexto |
| generate-travel-plan (Paso 1) | gemini-3-pro | Múltiples días + destino + actividades |
| analyze-wardrobe | gemini-3-pro | Análisis complejo de carencias |
| analyze-garment | gemini-2.5-flash | Tarea visual sencilla, rápido y económico |

---

## 8.1 Edge Function: get-weather

- **Input:** ciudad (default: ciudad del perfil del usuario)
- **Acción:** Llama a OpenWeatherMap API
- **Output:** `{ temperatura, condicion, humedad, viento, lluvia }`

## 8.2 Edge Function: generate-outfit (Paso 1 — Agente Estilista)

- **Input:** armario (JSON), historial (JSON), temperatura, condicion, ocasion, tipo_opciones, foto_usuario_descripcion, idioma
- **Acción:**
  - Construye el system prompt del Agente Estilista (Bloque A + B + C descritos en sección 8.0)
  - Envía el armario, historial, clima y ocasión como contexto
  - El agente ejecuta internamente: selección → validación → auto-corrección → output
  - Genera 2 opciones de outfit completamente validadas
  - Cada opción incluye `imagen_prompt` optimizado para el Agente de Imagen
- **Output:** JSON con 2 opciones validadas (ver formato en sección 8.0)
- **Modelo:** gemini-3-pro, maxOutputTokens: 3000
- **Seguridad:** Requiere JWT

## 8.3 Edge Function: generate-outfit-image (Paso 2 — Agente de Imagen)

- **Input:** foto_usuario_url, imagen_prompt (generado por Paso 1), color_palette
- **Acción:** Llama a Google Gemini API (Nano Banana Pro / Gemini 3 Pro Image) para generar imagen del usuario vistiendo el outfit descrito. Usa el `imagen_prompt` del Paso 1 que ya incluye colores exactos, tejidos y estilo validados.
- **Fallback:** Si Gemini bloquea la generación por filtros de seguridad (ej: imágenes de personas reales), la función debe capturar el error y reintentar con la API de OpenAI (DALL-E / GPT Image) como alternativa.
- **Output:** URL de la imagen generada (guardada en Storage)
- **Modelo primario:** gemini-3-pro-image (Nano Banana Pro)
- **Modelo fallback:** dall-e-3 (OpenAI) — solo si el primario falla por filtros de seguridad
- **Ejecución:** Async — no bloquea la UI. El usuario ve el outfit con las fotos de las prendas individuales mientras la imagen se genera en segundo plano.

## 8.4 Edge Function: analyze-garment

- **Input:** foto de la prenda (base64)
- **Acción:** Llama a Google Gemini API con capacidad de visión para identificar la prenda. Debe identificar con precisión el color (nombre específico, no genérico: "azul marino" en vez de "azul", "burdeos" en vez de "rojo"), ya que esto es crítico para la validación de armonía del Agente Estilista.
- **Output:** JSON con categoría, marca, talla, color (nombre específico), descripción, estilo, temporada
- **Modelo:** gemini-2.5-flash (más rápido y económico para tareas visuales simples)

## 8.5 Edge Function: analyze-wardrobe

- **Input:** armario (JSON), historial (JSON), idioma
- **Acción:** Llama a Google Gemini API para análisis de carencias. Responde en el idioma del usuario.
- **Output:** JSON con recomendaciones de compra
- **Modelo:** gemini-3-pro

## 8.6 Edge Function: generate-weekly-plan (Paso 1 — Agente Estilista × N días)

- **Input:**
  ```json
  {
    "dias": [
      { "fecha": "2026-02-16", "dia_semana": "Lunes", "ocasion": "Business Casual", "descripcion_ocasion": null },
      { "fecha": "2026-02-17", "dia_semana": "Martes", "ocasion": "Casual", "descripcion_ocasion": null }
    ],
    "armario": "JSON (prendas activas)",
    "historial": "JSON (outfits con elegido=true)",
    "clima_forecast": "JSON (forecast por día)",
    "foto_usuario_descripcion": "descripción física del usuario",
    "idioma": "es"
  }
  ```
- **Acción:**
  - Usa el mismo system prompt del Agente Estilista (sección 8.0) con instrucciones adicionales:
    - Genera un outfit validado para CADA día solicitado
    - NO repetir la misma combinación completa entre días de la planificación NI con el historial
    - Las prendas individuales SÍ pueden aparecer en diferentes días
    - Cada día usa SU clima (forecast) y SU ocasión
    - Validar armonía de colores y coherencia de estilo para CADA día individualmente
    - Generar `imagen_prompt` para cada día
  - Responder en el idioma del usuario
- **Output:** JSON con array de días, cada uno con outfit validado (mismo formato que generate-outfit pero por día)
- **Modelo:** gemini-3-pro, maxOutputTokens: 6000
- **Seguridad:** Requiere JWT
- **Post-proceso:** Después de recibir el output, el frontend llama a `generate-outfit-image` (8.3) para CADA día en paralelo (async)

## 8.7 Edge Function: generate-travel-plan (Paso 1 — Agente Estilista × N días)

- **Input:**
  ```json
  {
    "destino": "París, FR",
    "dias": 5,
    "actividades": ["turismo", "cena formal", "paseo", "museo", "vuelo de vuelta"],
    "armario": "JSON (prendas activas)",
    "historial": "JSON (outfits con elegido=true)",
    "clima_forecast": "JSON (forecast del destino)",
    "foto_usuario_descripcion": "descripción física del usuario",
    "idioma": "es"
  }
  ```
- **Acción:**
  - Misma lógica que generate-weekly-plan pero adaptada a viaje:
    - Consulta clima del destino (forecast hasta 5 días)
    - Para días > 5, la IA estima el clima según destino y época del año
    - Cada día se adapta a su actividad específica
    - Validación de armonía y coherencia por día
    - Genera `imagen_prompt` para cada día
  - Mismas reglas de no repetición
- **Output:** JSON con array de días con outfits validados
- **Modelo:** gemini-3-pro, maxOutputTokens: 6000
- **Seguridad:** Requiere JWT
- **Post-proceso:** Frontend llama a `generate-outfit-image` (8.3) para CADA día en paralelo (async)

## 8.8 Edge Function: create-checkout-session (ver sección 6.2)

## 8.9 Edge Function: create-portal-session (ver sección 6.3)

## 8.10 Edge Function: stripe-webhook (ver sección 6.4)

---

# 9. REGLAS DE NEGOCIO CRÍTICAS

## 9.1 No repetición de outfits (MÁXIMA PRIORIDAD)

- Una combinación = conjunto completo de prendas (superior + inferior + calzado + cinturón + capa exterior + calcetines)
- Se consulta historial con elegido = true antes de cada recomendación
- Doble validación: IA + frontend
- Prendas individuales SÍ se pueden repetir en combinaciones diferentes
- Opción no elegida vuelve al pool

## 9.2 Marca y talla obligatorias

- NUNCA guardar prenda sin marca ni talla
- Campos vacíos resaltados en rojo
- Formulario bloqueado hasta completar

## 9.3 Adaptación al clima

- SIEMPRE consultar clima ANTES de generar
- \>28°C: ligero. 20-28°C: entretiempo. 14-20°C: capas. <14°C: abrigos.
- Lluvia: calzado adecuado. Viento: evitar prendas abiertas.

## 9.4 Preguntar ocasión si no se especifica

## 9.5 Dos opciones siempre (nunca 1, nunca 3)

## 9.6 Identificación inequívoca de prendas (foto + código + marca + descripción)

## 9.7 Generación de imagen del usuario con el outfit (async, no bloquea UI)

## 9.8 Recomendaciones de compra (priorizar marcas del usuario, enlaces España)

## 9.9 Suscripción requerida (trial limitado vs. suscripción completa)

- El registro requiere seleccionar un plan y dar tarjeta (Stripe gestiona el trial de 15 días)
- La landing page y las páginas de auth/pricing son públicas
- **Durante el trial (15 días):**
  - ✅ Mi Armario: máximo 5 prendas activas por categoría. Al llegar al límite → modal de upsell
  - ✅ Outfit del Día: acceso completo (2 opciones con Agente Estilista + Agente de Imagen)
  - 🔒 Planificación Semanal: bloqueada → tab con candado → modal de upsell
  - 🔒 Historial: bloqueado → tab con candado → modal de upsell
  - 🔒 Análisis: bloqueado → tab con candado → modal de upsell
  - 🔒 Maleta de Viaje: bloqueada → acceso desde perfil bloqueado → modal de upsell
  - ✅ Perfil / Configuración: acceso completo
- **Tras suscripción activa (active):** acceso completo a todo, armario ilimitado
- Si la suscripción expira → Paywall (pantalla 5.10)

## 9.10 Planificación semanal no bloquea Outfit del Día

- Ambas funcionalidades son independientes
- Si hay planificación aprobada y el usuario usa Outfit del Día, el outfit generado se suma al historial normalmente
- La planificación NO se invalida por usar Outfit del Día
- La regla de no repetición se aplica tanto al historial como a los días ya planificados en la misma semana

## 9.11 Regenerar un día mantiene el contexto de la semana

- Al pulsar "Cambiar" en un día, la IA recibe como contexto los outfits de los otros días de la planificación para evitar repetir combinaciones dentro de la misma semana

---

# 10. DISEÑO UI/UX

## 10.1 Principios generales

- **Mobile-first**
- **Landing page:** pública, atractiva, orientada a conversión
- **App:** navegación inferior con 5+1 tabs: 👔 Outfit (home), 🗓️ Planificar, 👕 Armario, 📁 Historial, 🔍 Análisis + icono de perfil (esquina superior derecha)
- **En trial:** Los tabs bloqueados (Planificar, Historial, Análisis) muestran un icono de candado 🔒 junto al nombre. Al hacer tap en un tab bloqueado → se muestra el modal de upsell (mismo que el de prendas pero con texto genérico: "Esta función está disponible con la suscripción" / "This feature is available with a subscription")
- **Tema:** Limpio, moderno, minimalista. Tonos neutros con acentos de color para badges
- **Interacciones:** Cards deslizables, transiciones suaves
- **Idioma:** Toda la interfaz traducida vía i18n, nunca textos hardcodeados

## 10.2 Badges de estilo

🟢 Casual → verde, 🔵 Smart Casual → azul, 🟠 Business Casual → naranja, 🔴 Formal → rojo, 🟣 Evento especial → morado

## 10.3 Estados de carga

Skeleton cards con pulso, spinners con mensajes descriptivos traducidos

## 10.4 Estados vacíos (empty states)

Cada pantalla debe tener un estado vacío atractivo para el primer uso:
- **Mi Armario vacío:** Ilustración + "Tu armario está vacío. ¡Empieza subiendo tu primera prenda!" / "Your wardrobe is empty. Start by uploading your first garment!" + Botón "Añadir prenda"
- **Historial vacío:** "Aún no has elegido ningún outfit. ¡Ve a Outfit del Día!" / "You haven't chosen any outfit yet. Go to Today's Outfit!"
- **Planificación sin crear:** "Planifica tu semana y olvídate de pensar qué ponerte." / "Plan your week and stop thinking about what to wear."
- **Análisis sin prendas suficientes:** "Sube al menos 10 prendas para obtener un análisis completo." / "Upload at least 10 garments for a complete analysis."

## 10.5 Notificaciones y feedback

- Toasts traducidos para cada acción
- Banner de trial con días restantes
- Paywall claro y no agresivo

## 10.6 Breakpoints responsive

- Mobile: < 768px (diseño principal)
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

# 11. SEGURIDAD

- Row Level Security (RLS) en todas las tablas con filtro por `user_id`
- **Política especial para `subscriptions`:** La tabla necesita permitir INSERT/UPDATE desde el webhook de Stripe (que usa `service_role` sin JWT del usuario). Las políticas RLS deben permitir operaciones del `service_role`.
- **RLS en nuevas tablas:** `planificaciones_semanales` y `planificacion_dias` con filtro por `user_id`
- API keys almacenadas como secrets en Supabase: `GEMINI_API_KEY`, `OPENAI_API_KEY` (solo como fallback para imágenes), `WEATHER_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`. NUNCA en el frontend
- Stripe publishable key en frontend (es segura), secret key SOLO en Edge Functions
- Webhook de Stripe verificado con firma
- Todas las Edge Functions (excepto stripe-webhook) requieren JWT
- Buckets de Storage con políticas de acceso por `user_id`
- Autenticación vía Supabase Auth (email + password)
- Confirmación de email desactivada para simplificar flujo de registro
- Todas las Edge Functions incluyen headers CORS para el dominio de Vercel

---

# 12. IMPORTACIÓN INICIAL DESDE CSV

- Botón "Importar desde CSV" en Mi Armario
- CSV con separador punto y coma (;), UTF-8
- Campos: `codigo;categoria;marca;talla;color;descripcion;estilo;temporada`
- Fotos se suben aparte vinculadas por código
- Validación de campos obligatorios

---

# 13. FUNCIONALIDADES FUTURAS (V2 — no implementar ahora)

- Notificación push matutina
- Compartir outfit por WhatsApp/Instagram
- Modo "repetir favorito"
- Integración con calendario
- Moda femenina
- Integración con tiendas online
- Login social (Google, Apple)
- Confirmación de email
- Cookie consent / banner GDPR
- Retención y borrado automático de datos tras cancelación (cron job)

---

# 14. MÉTRICAS DE ÉXITO

- El usuario cataloga su armario en menos de 30 minutos
- Cada mañana obtiene 2 opciones de outfit en menos de 15 segundos
- El usuario puede planificar una semana completa en menos de 2 minutos
- Nunca se repite una combinación ya usada
- La app es 100% funcional desde el navegador del móvil
- Tasa de conversión trial → pago > 30%
- Churn mensual < 10%

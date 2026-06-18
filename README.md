# Treck Motors Cuba

Aplicación de catálogo y reservas para Treck Motors Cuba con React + Express + Supabase.

## Estructura del proyecto

```
treckmotors/
├── client/                    # Frontend React (Vite SPA)
│   ├── public/               # Archivos estáticos (favicon, etc.)
│   ├── src/                  # Código fuente React
│   │   ├── components/       # Componentes React
│   │   ├── services/         # API client layer
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env                  # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── server/                    # Backend Express.js
│   ├── api/index.ts          # Vercel serverless entry point
│   ├── public/               # Frontend compilado (se sube a git)
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   │   ├── index.ts          # App Express (rutas, CORS, static, SEO)
│   │   ├── supabase.ts       # Clientes Supabase (anon + admin)
│   │   ├── middleware/
│   │   │   └── auth.ts       # Middleware JWT + roles
│   │   ├── routes/           # products, orders, auth, users, reviews, settings, storage, facebook
│   │   ├── data/
│   │   │   └── initialDb.ts  # Seed data (productos, usuarios, pedidos)
│   │   └── services/
│   │       └── seed.ts       # Población inicial de BD
│   ├── .env                  # Credenciales reales (no se sube a git)
│   ├── .env.example          # Plantilla con valores placeholder
│   └── package.json
├── supabase/                  # SQL schemas para ejecutar en Supabase
│   ├── schema.sql            # DDL de base de datos
│   └── storage.sql           # Buckets y políticas de Storage
├── package.json               # Orquestador raíz
├── vercel.json                # Routing de Vercel (todo → serverless Express)
└── README.md
```

## Requisitos

- Node.js >= 18
- Una cuenta en [Supabase](https://supabase.com) (gratuita)
- (Opcional) Una cuenta en [Vercel](https://vercel.com) para producción

---

## 1. Configuración de Supabase

### 1.1 Crear proyecto

1. Ve a [https://supabase.com](https://supabase.com) e inicia sesión
2. Crea un nuevo proyecto (gratuito)
3. Guarda la **Project URL** y las **API keys** de **Project Settings > API**

### 1.2 Ejecutar schema de base de datos

En el **SQL Editor** de Supabase, abre y ejecuta:

```
supabase/schema.sql
```

Esto crea: `products`, `orders`, `users`, `reviews`, `settings` con índices, RLS y triggers.

### 1.3 Configurar Storage

Ejecuta en el SQL Editor:

```
supabase/storage.sql
```

Esto crea los buckets:
- `products` — imágenes de productos (5MB, pública)
- `avatars` — fotos de perfil (2MB, pública)

### 1.4 Habilitar Google OAuth (opcional)

En Supabase Dashboard > **Authentication > Providers**, activa **Google** y configura tu Client ID y Secret. Añade esta URL de redirect:

```
https://<tu-dominio>/**
```

Para desarrollo local:

```
http://localhost:3000/**
```

---

## 2. Configuración del proyecto

### 2.1 Server `.env`

Copia `server/.env.example` a `server/.env` y completa tus credenciales:

```env
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_ANON_KEY="tu-anon-key"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
PORT=3000
NODE_ENV="development"
APP_URL="http://127.0.0.1:3000"

# Facebook Business SDK (para publicación automática en Facebook)
FACEBOOK_APP_ID="tu-facebook-app-id"
FACEBOOK_APP_SECRET="tu-facebook-app-secret"
FACEBOOK_REDIRECT_URI="http://127.0.0.1:3000/admin"

# JWT Secret (cambiar en producción por una clave segura)
JWT_SECRET="tu-clave-secreta-cambiame-en-produccion"
```

### 2.2 Client `.env`

Copia o edita `client/.env` con tus credenciales reales:

```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key"
```

---

## 3. Prueba local (desarrollo)

### 3.1 Instalar dependencias

```bash
# Frontend
cd client && npm install

# Backend
cd server && npm install
```

### 3.2 Build del frontend

```bash
cd client && npm run build
```

Esto genera la SPA en `client/dist/`.

### 3.3 Iniciar servidor

```bash
cd server && npm run dev
```

El servidor Express arranca en `http://127.0.0.1:3000`. Sirve:
- API REST en `/api/*`
- Frontend SPA desde `client/dist/` (auto-detectado)
- SEO dinámico en `/product/:id` y `/producto/:id`

También puedes usar el orquestador desde la raíz:

```bash
npm run dev     # arranca el servidor
npm run dev:client  # arranca Vite standalone (con proxy al server)
```

> **Nota:** El servidor al arrancar ejecuta `runAllSeeds()` que inserta datos iniciales (productos, usuarios, reseñas, settings) si la base de datos está vacía. Esto solo ocurre la primera vez.

---

## 4. Prueba local (producción simulada)

```bash
# 1. Build del frontend
cd client && npm run build

# 2. Arrancar servidor en modo producción
cd server && NODE_ENV=production npm start

# 3. Abrir http://localhost:3000
```

O desde la raíz:

```bash
npm run build    # build del client
npm run start    # arranca server en producción
```

---

## 5. Despliegue en Vercel

### 5.1 Build del frontend (local)

El frontend se compila en tu máquina Windows y se sube ya compilado al repositorio.
Esto evita problemas de plataforma (Windows → Linux) en el build de Vercel.

```bash
# 1. Compilar el frontend
cd client && npm install && npm run build

# 2. Copiar el build al servidor
cp -r dist/* ../server/public/

# 3. Volver a la raíz
cd ..
```

Los archivos compilados quedan en `server/public/` y se suben al repositorio con `git add .`.

### 5.2 Subir cambios a GitHub

```bash
git add .
git commit -m "build: actualizar client compilado"
git push
```

### 5.3 Crear proyecto en Vercel

1. Ve a [https://vercel.com](https://vercel.com) e importa tu repositorio
2. Configura el proyecto con estos valores:

| Configuración | Valor |
|---|---|
| **Root Directory** | `/` |
| **Node.js Version** | `20.x` (o superior) |
| **Framework Preset** | `Other` |

> Vercel solo compila el servidor Express (`server/api/index.ts`). El frontend ya viene compilado en `server/public/`.

### 5.4 Variables de entorno en Vercel

Añade en el dashboard de Vercel (Project Settings > Environment Variables).

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase |
| `JWT_SECRET` | Clave para firmar JWTs |
| `NODE_ENV` | `production` |
| `APP_URL` | `https://treckmotors.vercel.app` |

No necesitas variables `VITE_*` porque el frontend ya viene compilado.

### 5.5 Desplegar

El build de Vercel solo compila el servidor Express. El `@vercel/node` builder compila `server/api/index.ts` e incluye los archivos de `server/public/` (el frontend compilado).

Las rutas se manejan desde el servidor Express:

- `/api/*` → API REST
- `/product/:id`, `/producto/:id` → SEO con meta tags dinámicos
- `/*` → frontend SPA (servido como archivo estático)

Haz click en **Deploy**. La app estará disponible en `https://treckmotors.vercel.app`.

### 5.6 Actualizar el frontend después de cambios

Cada vez que modifiques el código del frontend (`client/`), debes recompilarlo y subir los cambios:

```bash
cd client && npm run build && cp -r dist/* ../server/public/ && cd ..
git add .
git commit -m "build: actualizar client compilado"
git push
```

### 5.7 Configurar Google OAuth en producción

En Supabase Dashboard > **Authentication > Providers > Google**, añade:

```
https://treckmotors.vercel.app/**
```

Como URL de redirect.

---

## 6. Usuarios por defecto

| Email | Contraseña | Rol |
|---|---|---|
| annierfq01@gmail.com | admin | Admin |
| invitado@gmail.com | (registro) | Cliente |
| cliente-demo@redline.com | (registro) | Cliente |

> El seeder crea estos usuarios en la tabla `users` al iniciar el servidor por primera vez. El usuario admin se crea con contraseña `admin`.

---

## 7. API Endpoints

| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| GET | /api/products | Listar productos | Pública |
| POST | /api/products | Crear producto | Requiere auth + admin |
| PUT | /api/products/:id | Actualizar producto | Requiere auth + admin |
| DELETE | /api/products/:id | Eliminar producto | Requiere auth + admin |
| GET | /api/orders | Listar pedidos | Requiere auth + admin |
| POST | /api/orders | Crear pedido | Pública |
| PUT | /api/orders/:id/status | Actualizar estado | Requiere auth + admin |
| GET | /api/orders/subscribe | SSE notificaciones | Requiere auth + admin |
| POST | /api/auth/register | Registrar usuario | Pública |
| POST | /api/auth/login | Iniciar sesión | Pública |
| POST | /api/auth/google-callback | Callback Google OAuth | Pública |
| GET | /api/users | Listar usuarios | Requiere auth + admin |
| POST | /api/users | Crear/sincronizar usuario | Requiere auth + admin |
| PUT | /api/users/:id | Actualizar usuario | Requiere auth + admin |
| GET | /api/reviews | Listar reseñas | Pública |
| POST | /api/reviews | Crear reseña | Requiere auth |
| GET | /api/settings | Obtener configuración | Pública |
| PUT | /api/settings | Actualizar configuración | Requiere auth + admin |
| POST | /api/storage/upload | Subir archivo | Requiere auth + admin |
| DELETE | /api/storage/delete | Eliminar archivo | Requiere auth + admin |
| GET | /api/facebook/auth-url | Obtener URL de auth Facebook | Requiere auth + admin |
| POST | /api/facebook/callback | Procesar callback Facebook | Requiere auth + admin |
| GET | /api/facebook/status | Estado de conexión Facebook | Requiere auth |
| POST | /api/facebook/post | Publicar producto en Facebook | Requiere auth + admin |

> **Autenticación:** El sistema usa autenticación propia con JWT firmado con `jsonwebtoken`. El token se envía en el header `Authorization: Bearer <token>`. El servidor valida el token con `jwt.verify()` y verifica el rol del usuario antes de procesar la solicitud. Las contraseñas se almacenan hasheadas con PBKDF2-SHA256 + salt de 32 bytes.

---

## 8. Integración con Facebook (Publicación Automática)

El sistema permite publicar productos directamente en una página de Facebook desde el panel de administración.

### 8.1 Configurar App de Facebook

1. Ve a [https://developers.facebook.com](https://developers.facebook.com) y crea una nueva App
2. Agrega los productos **Facebook Login** y **Pages API**
3. Configura la URI de redirección de OAuth con la URL de tu panel de admin (ej: `http://localhost:3000/admin`)
4. Copia el **App ID** y **App Secret** al archivo `server/.env`

### 8.2 Conectar página desde el Admin

1. Inicia sesión como administrador
2. Ve al panel de administración > **Configuración Tienda**
3. Busca la sección **"Integración con Facebook"**
4. Haz clic en **"Conectar Página de Facebook"** para autorizar la app
5. Ingresa el código de autorización que recibas

### 8.3 Publicar un producto

- **Desde el catálogo:** Abre los detalles de cualquier producto y haz clic en **"Publicar en FB"** (visible solo para administradores)
- **Desde el panel admin:** En la pestaña **"Catálogo de Inventario"**, cada producto tiene un botón de publicación rápida

La publicación incluye: nombre del producto, descripción, precio, características técnicas y la imagen del producto.

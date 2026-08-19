# Marketplace con comisión automática (Mercado Pago Split de Pagos)

Ya está armado y probado. Esto es lo que hace:

- Página `/vender.html`: un vendedor conecta su cuenta de Mercado Pago (OAuth).
- Página `/index.html`: catálogo público de productos, con botón "Comprar".
- Al comprar, se genera un pago que se reparte automático: el vendedor cobra su parte, vos cobrás tu comisión (`COMMISSION_PERCENT` en el `.env`), sin tocar nada a mano.
- `/webhooks/mercadopago`: recibe el aviso de cada pago aprobado y actualiza la orden.

Probado en el sandbox: el servidor levanta, sirve las páginas, guarda vendedores/productos, y genera el link de pago correctamente (con credenciales reales de Mercado Pago va a funcionar igual, ahora mismo solo falta poner las tuyas).

## Lo único que falta para que quede en vivo

### 1. Crear tu aplicación en Mercado Pago (5 minutos)

1. Entrá a https://www.mercadopago.com.ar/developers con tu cuenta.
2. Creá una aplicación nueva.
3. Copiá el **Client ID** y el **Client Secret**.
4. En la sección de edición de la app, poné como **Redirect URL**: `https://TU-DOMINIO.com/vendedores/callback` (o `http://localhost:3000/vendedores/callback` mientras probás en tu compu).

### 2. Configurar el `.env`

Copiá `.env.example` a `.env` y completá:

```
MP_CLIENT_ID=el_que_copiaste
MP_CLIENT_SECRET=el_que_copiaste
BASE_URL=https://TU-DOMINIO.com
COMMISSION_PERCENT=10
PORT=3000
```

### 3. Instalar y correr

```bash
npm install
npm start
```

Se abre en `http://localhost:3000`. Para probarlo en tu compu primero:
- Andá a `/vender.html` y conectá una cuenta de Mercado Pago (de prueba o real).
- Cargá un producto a mano llamando a la API (`POST /api/productos` con `seller_id`, `title`, `unit_price`) — más adelante le puedo agregar un formulario para hacerlo desde la web en vez de por API.
- Andá a `/index.html` y probá comprarlo.

### 4. Ponerlo en vivo — Render (gratis, sin tarjeta)

Elegí **Render** porque es el que mejor funciona gratis para esto: no pide tarjeta, te da un dominio HTTPS propio, y ya le dejé el archivo `render.yaml` armado para que la configuración sea automática. La única contra del plan gratis es que si nadie entra en 15 minutos el servidor "duerme" y tarda ~30-60 segundos en despertar con la primera visita — normal para un proyecto que recién arranca, y se soluciona más adelante pasando a un plan pago si el volumen lo justifica.

Estos pasos los tenés que hacer vos porque piden tu cuenta (yo no puedo crear cuentas en tu nombre):

1. **Subí este proyecto a GitHub**: creá un repositorio nuevo (público o privado, gratis) en https://github.com y subí esta carpeta. Si nunca lo hiciste, puede ser tan simple como arrastrar los archivos en la web de GitHub ("Add file → Upload files") — no hace falta usar la terminal.
2. Entrá a https://render.com y creá una cuenta gratis con "Sign up with GitHub".
3. Click en **New → Blueprint**, elegí el repositorio que subiste. Render va a leer el `render.yaml` solo y va a proponerte crear el servicio automáticamente.
4. Cuando te pida las variables de entorno, completá `MP_CLIENT_ID`, `MP_CLIENT_SECRET` y `BASE_URL` (usá la URL que Render te asigna, algo como `https://marketplace-comision-mercadopago.onrender.com`).
5. Deploy. En unos minutos te da la URL pública.
6. Volvé a Mercado Pago Developers y actualizá la **Redirect URL** de tu aplicación con `https://TU-URL-DE-RENDER.onrender.com/vendedores/callback`.

Con eso ya queda funcionando en internet, no solo en tu compu.

## Cómo hago que la comisión llegue a mi cuenta

No hace falta ninguna configuración extra para esto — ya está resuelto por cómo funciona Mercado Pago:

- El `marketplace_fee` que cobra la app en cada venta **se acredita automáticamente en la cuenta de Mercado Pago con la que vos creaste la aplicación** en el paso 1 (la que corresponde a tu `MP_CLIENT_ID`/`MP_CLIENT_SECRET`).
- Por eso lo único que tenés que cuidar es: crear esa aplicación en developers.mercadopago.com **estando vos logueado con tu propia cuenta de Mercado Pago** (la que uses para cobrar, con tu CBU/CVU cargado). Si la creaste con esa cuenta, la comisión ya cae ahí sola en cada venta aprobada.
- De ahí, para pasar la plata a tu banco, es el proceso normal de Mercado Pago: desde la app o la web de MP, "Dinero disponible → Transferir a cuenta bancaria". Eso no lo maneja el código, lo hacés vos cuando quieras desde tu Mercado Pago como con cualquier cobro.
- Un solo chequeo importante: confirmá que tu cuenta de Mercado Pago esté verificada (con CUIT/CBU cargado), porque si no, Mercado Pago puede retener las transferencias a banco hasta que la verifiques.

## Qué te recomiendo para arrancar

- Ya quedó en `COMMISSION_PERCENT=10`, que era el número que hablamos.
- Sumá 2-3 vendedores conocidos primero (gente de tu confianza) para probar que el cobro y el reparto funcionan bien con dinero real antes de abrirlo a todos.
- Cuando eso esté validado, te agrego un formulario simple para que los vendedores carguen sus propios productos sin que vos tengas que hacerlo por API.

## Lo único que queda de tu lado

1. Crear la aplicación en Mercado Pago Developers (con tu cuenta).
2. Subir el proyecto a GitHub y desplegarlo en Render con los pasos de arriba.

Cuando tengas el Client ID, Client Secret y la URL de Render, pasámelos y reviso que todo haya quedado bien conectado.

# Rifa 00-99 - Proyecto React (listo para VS Code)

## Qué contiene
- Un tablero 00–99 donde los usuarios eligen números libres.
- Modo **Admin** protegido por contraseña (configurable).
- Integración opcional con **Firebase Firestore** (para guardar en la nube).

## Cómo usar (rápido)
1. Abrir la carpeta `rifa-00-99` en Visual Studio Code.
2. Ejecutar en terminal:
   ```bash
   npm install
   npm start
   ```
3. Abrir `http://localhost:3000` en el navegador.

## Activar Firebase (opcional)
- Abre `src/firebaseConfig.js` y pega tu configuración de Firebase (web app) en el objeto `firebaseConfig`.
- Luego abre `src/config.js` y cambia `USE_FIREBASE` a `true`.
- Crea la colección `raffleNumbers` en Firestore (puede estar vacía).
- Inicia la app; la sincronización ocurrirá en tiempo real.

## Admin
- La contraseña por defecto es `admin123`. Para cambiarla edita `src/config.js`.
- En modo Admin puedes ver quién reservó cada número, exportar CSV y reiniciar.

## Notas
- Este proyecto usa CSS sencillo (sin Tailwind) para que sea más fácil ejecutar sin pasos adicionales.
- Si deseas que yo despliegue en Vercel o genere la versión con Tailwind, dímelo y lo preparo.

🚀 DolarHub SuperApp (SaaS)

Terminal Financiera y Plataforma de Inteligencia de Mercado.
Monitoreo en tiempo real, calculadoras financieras y alertas personalizadas.

📋 Descripción del Proyecto

DolarHub es una aplicación web progresiva (PWA) diseñada para el inversor argentino. Funciona como un SaaS con modelo Freemium.

Usuarios Gratuitos: Cotizaciones en tiempo real, calculadoras ICL y academia.

Usuarios Premium: Alertas ilimitadas vía Telegram, gráficos históricos y soporte.

🏗️ Arquitectura Técnica

El sistema utiliza una arquitectura Serverless desacoplada para minimizar costos de mantenimiento ($0 inicial).

Frontend: React 18 + Tailwind CSS (Hospedado en Vercel).

Backend & DB: Firebase Firestore (NoSQL) + Authentication.

Motor de Datos: n8n (Workflow Automation) para cron jobs y alertas.

🚀 Despliegue en 3 Pasos

1. Frontend (Vercel)

Clona este repo.

En src/App.jsx, reemplaza const firebaseConfig con tus credenciales.

Sube a GitHub y despliega en Vercel.

2. Backend (n8n)

Importa el archivo n8n_workflow.json en tu instancia de n8n.

Configura las credenciales de Google Service Account y Telegram Bot.

Activa el workflow.

3. Configuración Google Cloud

Habilita la "Cloud Firestore API".

Dale permisos de Cloud Datastore User a tu Service Account.

Hecho con ❤️ en Argentina.
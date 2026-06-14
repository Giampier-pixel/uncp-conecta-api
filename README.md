# UNCP Conecta - API Central

**UNCP Conecta** es una plataforma digital inteligente diseñada para conectar a la **Universidad Nacional del Centro del Perú** con las comunidades campesinas, comunidades urbanas y gobiernos locales de Huancayo. Su objetivo es facilitar el acceso y seguimiento a los servicios de proyección social que ofrece la universidad.

Este repositorio contiene la **API Central**, que actúa como el núcleo del sistema.

---

## ¿Qué es esta API?

Es el backend (desarrollado en **NestJS**) que centraliza toda la lógica de negocio y provee servicios tanto a la aplicación móvil (para comunidades campesinas) como a la plataforma web.

### Funcionalidades Principales

*   **Gestión y Seguimiento de Solicitudes:** Permite registrar solicitudes de proyección social y realizar un seguimiento transparente a lo largo de sus distintas etapas, asignando responsables específicos en cada fase.
*   **Catálogo de Servicios:** Provee información estructurada sobre las facultades de la UNCP, los tipos de apoyo disponibles y las áreas de proyección social correspondientes.
*   **Módulo de Inteligencia Artificial (IA) con RAG:** Ayuda a los usuarios a redactar y estructurar solicitudes formales a partir de descripciones en lenguaje cotidiano, emparejándolas automáticamente con la facultad adecuada.
*   **Trazabilidad:** Mantiene un historial detallado de cada trámite para resolver la incertidumbre de las comunidades sobre el estado de sus solicitudes.

---

## Tecnologías Utilizadas

*   **Framework:** NestJS (Node.js)
*   **Lenguaje:** TypeScript
*   **Base de Datos y ORM:** PostgreSQL / Prisma ORM
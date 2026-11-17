# Wireframe del sitio público

Borrador para revisar con los dos artistas del estudio piloto. Muestra qué hay en cada pantalla y qué hace cada botón, en grises y sin diseño visual (doc 07, sección 7). El diseño visual viene después, con un tema común para las tres páginas (doc 07, sección 11).

El original es privado: esta carpeta es una copia exportada el 17/11/2026.

**Cómo verlo:** abrí `artista-trabajos.html` en el navegador, en el modo celular de las herramientas de desarrollo, y navegá desde ahí. También están las capturas en `capturas/`.

**El HTML es solo de referencia.** El sitio de verdad se arma con React, Tailwind CSS y shadcn/ui (doc 06), no copiando este HTML ni sus estilos en línea.

## Pantallas

| Pantalla | HTML | Captura | Doc 07 |
| --- | --- | --- | --- |
| Artista · Trabajos | `artista-trabajos.html` | `capturas/artista-trabajos.png` | 7.1 y 7.2 |
| Artista · Blog | `artista-blog.html` | `capturas/artista-blog.png` | 7.2 |
| Artista · Sobre mí | `artista-sobre.html` | `capturas/artista-sobre.png` | 7.4 |
| Detalle de un trabajo | `detalle-trabajo.html` | `capturas/detalle-trabajo.png` | 7.3 |
| Entrada del blog | `entrada-blog.html` | `capturas/entrada-blog.png` | 7.3 |
| Estudio · Trabajos | `estudio-trabajos.html` | `capturas/estudio-trabajos.png` | 7.1 y 7.2 |
| Estudio · Blog | `estudio-blog.html` | `capturas/estudio-blog.png` | 7.2 |
| Estudio · Sobre nosotros | `estudio-sobre.html` | `capturas/estudio-sobre.png` | 7.4 |

## Navegación

- **Pestañas:** Trabajos, Blog y «Sobre mí» (o «Sobre nosotros», en la del estudio), dentro de la misma página.
- **Grilla:** cada foto abre el detalle de ese trabajo. En la pestaña Blog, cada entrada abre la entrada completa.
- **Ver más:** carga más publicaciones en la misma lista.
- **Detalle:** Volver lleva a donde estaba la persona; Compartir comparte el link de la publicación.
- **Encabezado:** Instagram y WhatsApp abren los links de la página (D-53).
- **«Sobre»:** en la de un artista, la tarjeta del estudio lleva a la página del estudio. En la del estudio, la tarjeta de cada artista lleva a su página.

En este prototipo, Volver siempre lleva a la página de Ink Mortal, y la tarjeta de Emma abre esa misma página de ejemplo. En el sitio, cada uno va a donde corresponde.

## Para confirmar con los artistas

Estas decisiones son del wireframe, no del doc 07:

- La grilla tiene tres columnas con celdas verticales (4:5), para que las fotos no se recorten.
- Las publicaciones fijadas van primero (RN-BLG-13) y llevan un alfiler.
- En el detalle, Volver y Compartir van en una barra arriba.
- Los textos entre corchetes son de ejemplo. Los nombres y los Instagram de Ink Mortal y de Alkimya son los reales; el de Emma falta.

## Fuera de este wireframe

- La portada de la plataforma, en la raíz del dominio (doc 07, sección 4).
- La página de error, cuando una página o una publicación no existe o no se ve.

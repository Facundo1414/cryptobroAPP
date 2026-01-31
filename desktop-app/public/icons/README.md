# Generador de Iconos PWA

Este directorio contiene los iconos para la PWA.

## Iconos necesarios:

- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)

## Cómo generar:

### Opción 1: Usar el SVG incluido

El archivo `icon.svg` contiene el logo. Puedes convertirlo a PNG con:

```bash
# Con ImageMagick
convert -background none icon.svg -resize 192x192 icon-192.png
convert -background none icon.svg -resize 512x512 icon-512.png

# O usar https://cloudconvert.com/svg-to-png
```

### Opción 2: Usar generador online

1. Ve a https://www.pwabuilder.com/imageGenerator
2. Sube una imagen de 512x512 mínimo
3. Descarga el pack de iconos

### Opción 3: Usar Canva/Figma

1. Crea un diseño de 512x512
2. Exporta en los tamaños necesarios

## Placeholder actual:

Los iconos actuales son placeholders. Reemplázalos con tu diseño final.

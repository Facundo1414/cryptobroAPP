/** @type {import('next').NextConfig} */
const isElectronBuild = process.env.ELECTRON_BUILD === 'true';

const nextConfig = {
  // Export estático solo en producción/build
  output: isElectronBuild ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  distDir: isElectronBuild ? 'out' : '.next',
  // Desactivar API routes en build estático
  trailingSlash: true,
  // Usar rutas relativas para Electron (esto arregla CSS y fonts)
  assetPrefix: isElectronBuild ? '' : undefined,
}

module.exports = nextConfig

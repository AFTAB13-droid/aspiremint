import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AspireMint',
    short_name: 'AspireMint',
    description: 'AspireMint Application',
    start_url: '/app',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#4f46e5',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      }
    ],
  }
}

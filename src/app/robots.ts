import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/app/'], // Disallow internal dashboards & APIs
    },
    // Actual deployed domain
    sitemap: 'https://deals.aspiremint.in/sitemap.xml',
  };
}

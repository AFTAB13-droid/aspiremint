import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/app/'], // Disallow internal dashboards & APIs
    },
    // Replace with your actual deployed domain!
    sitemap: 'https://www.aspiremint.com/sitemap.xml',
  };
}

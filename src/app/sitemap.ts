import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Actual deployed domain
  const baseUrl = 'https://deals.aspiremint.in';

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Add other public marketing pages here later if you create them (e.g. /about, /contact)
  ];
}

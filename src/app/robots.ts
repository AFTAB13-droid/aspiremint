import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/login',
        '/signup',
        '/forgot-password',
        '/registration-pending',
        '/app/review-finder',
      ],
      disallow: [
        '/api/',
        '/app/admin/',
        '/app/orders/',
        '/app/refunds/',
        '/app/activedeals/',
        '/app/wallet/',
        '/app/wallets-management/',
        '/app/users/',
        '/app/mediators/',
        '/app/mediations/',
        '/app/settings/',
        '/app/support/',
        '/app/reports/',
        '/app/samples/',
      ],
    },
    // Actual deployed domain
    sitemap: 'https://deals.aspiremint.in/sitemap.xml',
  };
}

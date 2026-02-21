import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/', '/login', '/register'],
      },
    ],
    sitemap: 'https://manamarketing.co.za/sitemap.xml',
  };
}

import { siteAsset } from '@/lib/site-asset-paths';

export const siteMedia = {
  hero: { src: siteAsset('hero-sunset.jpg'), webpSrc: siteAsset('hero-sunset.webp'), width: 1136, height: 912 },
  about: { src: siteAsset('about-story.jpg'), webpSrc: siteAsset('about-story.webp'), width: 2048, height: 1365 },
  cocktails: { src: siteAsset('sunset-cocktails.jpg'), webpSrc: siteAsset('sunset-cocktails.webp'), width: 1024, height: 1024 },
  gallery: { src: siteAsset('gallery-aerial.jpg'), webpSrc: siteAsset('gallery-aerial.webp'), width: 1024, height: 1024 },
  events: { src: siteAsset('events-featured.jpg'), webpSrc: siteAsset('events-featured.webp'), width: 832, height: 1248 },
  closeup: { src: siteAsset('nautica-closeup.jpg'), webpSrc: siteAsset('nautica-closeup.webp'), width: 1024, height: 1024 },
  coffee: { src: siteAsset('coffee-morning.jpg'), webpSrc: siteAsset('coffee-morning.webp'), width: 1024, height: 1024 },
  logo: { src: siteAsset('logo-clean.png'), width: 98, height: 98 },
} as const;

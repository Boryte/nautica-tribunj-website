import type { SocialFeedDTO, SocialFeedItemDTO } from '../../../../packages/shared/src';
import { env } from '../config';

type InstagramGraphItem = {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

type InstagramGraphResponse = {
  data?: InstagramGraphItem[];
  error?: {
    message?: string;
  };
};

type FeedCache = {
  expiresAt: number;
  value: SocialFeedDTO;
};

let cache: FeedCache | null = null;

const FALLBACK_USERNAME = 'nautica_tribunj';

const getInstagramUsername = () => {
  try {
    const parsed = new URL(env.INSTAGRAM_PROFILE_URL);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments[0] || FALLBACK_USERNAME;
  } catch {
    return FALLBACK_USERNAME;
  }
};

const buildFallbackFeed = (reason: string): SocialFeedDTO => ({
  instagramProfileUrl: env.INSTAGRAM_PROFILE_URL,
  instagramUsername: getInstagramUsername(),
  facebookPageUrl: env.FACEBOOK_PAGE_URL,
  items: [],
  available: false,
  source: 'fallback',
  lastUpdated: null,
  fallbackReason: reason,
});

const mapItem = (item: InstagramGraphItem): SocialFeedItemDTO | null => {
  const mediaUrl = item.media_type === 'VIDEO' ? item.thumbnail_url ?? item.media_url : item.media_url;

  if (!mediaUrl) return null;

  return {
    id: item.id,
    caption: item.caption?.trim() ?? '',
    mediaType: item.media_type.toLowerCase() as SocialFeedItemDTO['mediaType'],
    mediaUrl,
    thumbnailUrl: item.thumbnail_url ?? null,
    permalink: item.permalink,
    timestamp: item.timestamp,
  };
};

const shouldUseCache = () => cache && cache.expiresAt > Date.now();

export const getSocialFeed = async (): Promise<SocialFeedDTO> => {
  if (shouldUseCache()) return cache!.value;

  if (!env.INSTAGRAM_GRAPH_ACCESS_TOKEN || !env.INSTAGRAM_USER_ID) {
    const fallback = buildFallbackFeed('Instagram Graph API credentials are not configured.');
    cache = {
      expiresAt: Date.now() + env.SOCIAL_FEED_CACHE_TTL_SECONDS * 1000,
      value: fallback,
    };
    return fallback;
  }

  try {
    const url = new URL(`https://graph.facebook.com/v23.0/${env.INSTAGRAM_USER_ID}/media`);
    url.searchParams.set('fields', 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp');
    url.searchParams.set('limit', String(env.INSTAGRAM_FEED_LIMIT));
    url.searchParams.set('access_token', env.INSTAGRAM_GRAPH_ACCESS_TOKEN);

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    const payload = (await response.json()) as InstagramGraphResponse;

    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message || `Instagram Graph API returned ${response.status}.`);
    }

    const items = (payload.data ?? []).map(mapItem).filter((item): item is SocialFeedItemDTO => Boolean(item));
    const feed: SocialFeedDTO = {
      instagramProfileUrl: env.INSTAGRAM_PROFILE_URL,
      instagramUsername: getInstagramUsername(),
      facebookPageUrl: env.FACEBOOK_PAGE_URL,
      items,
      available: items.length > 0,
      source: 'instagram_graph',
      lastUpdated: new Date().toISOString(),
      fallbackReason: items.length > 0 ? null : 'Instagram feed returned no published media.',
    };

    cache = {
      expiresAt: Date.now() + env.SOCIAL_FEED_CACHE_TTL_SECONDS * 1000,
      value: feed,
    };

    return feed;
  } catch (error) {
    const fallback = buildFallbackFeed(error instanceof Error ? error.message : 'Instagram feed is temporarily unavailable.');
    cache = {
      expiresAt: Date.now() + env.SOCIAL_FEED_CACHE_TTL_SECONDS * 1000,
      value: fallback,
    };
    return fallback;
  }
};

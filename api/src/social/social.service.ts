import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, randomBytes } from 'crypto';
import { SettingsService } from '../settings/settings.service';
import { SocialPost } from './social-post.entity';

export interface SocialContent {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  type: 'resource' | 'blog';
}

const SOCIAL_DEFAULTS = [
  { key: 'social_url_facebook',                value: '',      label: 'Facebook Page URL' },
  { key: 'social_url_twitter',                 value: '',      label: 'Twitter / X Profile URL' },
  { key: 'social_url_linkedin',                value: '',      label: 'LinkedIn Page URL' },
  { key: 'social_url_youtube',                 value: '',      label: 'YouTube Channel URL' },
  { key: 'social_url_whatsapp',                value: '',      label: 'WhatsApp Group / Channel Link' },
  { key: 'social_url_instagram',               value: '',      label: 'Instagram Profile URL' },
  { key: 'social_facebook_enabled',            value: 'false', label: 'Facebook Enabled' },
  { key: 'social_facebook_page_id',            value: '',      label: 'Facebook Page ID' },
  { key: 'social_facebook_token',              value: '',      label: 'Facebook Page Access Token' },
  { key: 'social_twitter_enabled',             value: 'false', label: 'Twitter Enabled' },
  { key: 'social_twitter_api_key',             value: '',      label: 'Twitter API Key (Consumer Key)' },
  { key: 'social_twitter_api_secret',          value: '',      label: 'Twitter API Secret' },
  { key: 'social_twitter_access_token',        value: '',      label: 'Twitter Access Token' },
  { key: 'social_twitter_access_token_secret', value: '',      label: 'Twitter Access Token Secret' },
  { key: 'social_linkedin_enabled',            value: 'false', label: 'LinkedIn Enabled' },
  { key: 'social_linkedin_access_token',       value: '',      label: 'LinkedIn Access Token' },
  { key: 'social_linkedin_urn',                value: '',      label: 'LinkedIn Person/Organization URN' },
  { key: 'social_resource_template',           value: 'New resource: {title}\n\n{excerpt}\n\n{url}', label: 'Resource Post Template' },
  { key: 'social_blog_template',               value: 'New blog post: {title}\n\n{excerpt}\n\n{url}', label: 'Blog Post Template' },
  { key: 'social_site_url',                    value: 'https://apologeticsafrica.com', label: 'Site URL (for social links)' },
];

@Injectable()
export class SocialService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly settings: SettingsService,
    @InjectRepository(SocialPost) private logRepo: Repository<SocialPost>,
  ) {}

  async onApplicationBootstrap() {
    await this.settings.seed(SOCIAL_DEFAULTS);
  }

  // ── Public entry points ───────────────────────────────────────────────────

  async postContent(content: SocialContent): Promise<void> {
    const cfg = await this.settings.getAll();
    const siteUrl = (cfg.social_site_url || 'https://apologeticsafrica.com').replace(/\/$/, '');
    const path = content.type === 'blog' ? 'blog' : 'resources';
    const url = `${siteUrl}/${path}/${content.slug}`;
    const template = content.type === 'blog'
      ? (cfg.social_blog_template || '{title} — {url}')
      : (cfg.social_resource_template || '{title} — {url}');

    const message = template
      .replace(/{title}/g, content.title)
      .replace(/{excerpt}/g, content.excerpt || '')
      .replace(/{url}/g, url);

    const posts: Promise<void>[] = [];

    if (cfg.social_facebook_enabled === 'true' && cfg.social_facebook_page_id && cfg.social_facebook_token) {
      posts.push(this.postToFacebook(cfg.social_facebook_page_id, cfg.social_facebook_token, message, url, content));
    }

    if (cfg.social_twitter_enabled === 'true' && cfg.social_twitter_api_key && cfg.social_twitter_api_secret
        && cfg.social_twitter_access_token && cfg.social_twitter_access_token_secret) {
      posts.push(this.postToTwitter(
        cfg.social_twitter_api_key,
        cfg.social_twitter_api_secret,
        cfg.social_twitter_access_token,
        cfg.social_twitter_access_token_secret,
        message,
        content,
      ));
    }

    if (cfg.social_linkedin_enabled === 'true' && cfg.social_linkedin_access_token && cfg.social_linkedin_urn) {
      posts.push(this.postToLinkedIn(cfg.social_linkedin_access_token, cfg.social_linkedin_urn, message, url, content));
    }

    await Promise.allSettled(posts);
  }

  async testPlatform(platform: 'facebook' | 'twitter' | 'linkedin'): Promise<{ ok: boolean; error?: string }> {
    const cfg = await this.settings.getAll();
    try {
      if (platform === 'facebook') {
        if (!cfg.social_facebook_page_id || !cfg.social_facebook_token) {
          return { ok: false, error: 'Missing Page ID or access token' };
        }
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${cfg.social_facebook_page_id}?fields=name&access_token=${cfg.social_facebook_token}`,
        );
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error?.message || 'Facebook API error' };
        return { ok: true };
      }

      if (platform === 'twitter') {
        if (!cfg.social_twitter_api_key || !cfg.social_twitter_access_token) {
          return { ok: false, error: 'Missing Twitter credentials' };
        }
        const authHeader = this.buildTwitterOAuth(
          'GET', 'https://api.twitter.com/2/users/me',
          cfg.social_twitter_api_key, cfg.social_twitter_api_secret,
          cfg.social_twitter_access_token, cfg.social_twitter_access_token_secret,
        );
        const res = await fetch('https://api.twitter.com/2/users/me', {
          headers: { Authorization: authHeader },
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.title || 'Twitter API error' };
        return { ok: true };
      }

      if (platform === 'linkedin') {
        if (!cfg.social_linkedin_access_token) {
          return { ok: false, error: 'Missing LinkedIn access token' };
        }
        const res = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${cfg.social_linkedin_access_token}` },
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.message || 'LinkedIn API error' };
        return { ok: true };
      }

      return { ok: false, error: 'Unknown platform' };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  async getLogs(page = 1, limit = 20): Promise<{ data: SocialPost[]; total: number; page: number; pages: number }> {
    const [data, total] = await this.logRepo.findAndCount({
      order: { postedAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  // ── Platform-specific posting ─────────────────────────────────────────────

  private async postToFacebook(
    pageId: string, token: string, message: string, url: string, content: SocialContent,
  ): Promise<void> {
    const logEntry: Partial<SocialPost> = {
      platform: 'facebook', contentType: content.type, contentId: content.id,
      contentTitle: content.title, message,
    };
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, link: url, access_token: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Facebook post failed');
      await this.logRepo.save({ ...logEntry, status: 'success' });
      this.logger.log(`Posted to Facebook: ${content.title}`);
    } catch (e: any) {
      await this.logRepo.save({ ...logEntry, status: 'failed', error: e.message });
      this.logger.error(`Facebook post failed: ${e.message}`);
    }
  }

  private async postToTwitter(
    apiKey: string, apiSecret: string, accessToken: string, accessTokenSecret: string,
    message: string, content: SocialContent,
  ): Promise<void> {
    const logEntry: Partial<SocialPost> = {
      platform: 'twitter', contentType: content.type, contentId: content.id,
      contentTitle: content.title, message,
    };
    try {
      const url = 'https://api.twitter.com/2/tweets';
      const authHeader = this.buildTwitterOAuth('POST', url, apiKey, apiSecret, accessToken, accessTokenSecret);
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.slice(0, 280) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.title || data.detail || 'Twitter post failed');
      await this.logRepo.save({ ...logEntry, status: 'success' });
      this.logger.log(`Posted to Twitter: ${content.title}`);
    } catch (e: any) {
      await this.logRepo.save({ ...logEntry, status: 'failed', error: e.message });
      this.logger.error(`Twitter post failed: ${e.message}`);
    }
  }

  private async postToLinkedIn(
    accessToken: string, urn: string, message: string, url: string, content: SocialContent,
  ): Promise<void> {
    const logEntry: Partial<SocialPost> = {
      platform: 'linkedin', contentType: content.type, contentId: content.id,
      contentTitle: content.title, message,
    };
    try {
      const body = {
        author: urn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: message },
            shareMediaCategory: 'ARTICLE',
            media: [{
              status: 'READY',
              description: { text: content.excerpt || content.title },
              originalUrl: url,
              title: { text: content.title },
            }],
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      };
      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'LinkedIn post failed');
      await this.logRepo.save({ ...logEntry, status: 'success' });
      this.logger.log(`Posted to LinkedIn: ${content.title}`);
    } catch (e: any) {
      await this.logRepo.save({ ...logEntry, status: 'failed', error: e.message });
      this.logger.error(`LinkedIn post failed: ${e.message}`);
    }
  }

  // ── Twitter OAuth 1.0a ────────────────────────────────────────────────────

  private buildTwitterOAuth(
    method: string, url: string,
    apiKey: string, apiSecret: string,
    accessToken: string, accessTokenSecret: string,
  ): string {
    const nonce = randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: accessToken,
      oauth_version: '1.0',
    };

    const enc = encodeURIComponent;
    const sorted = Object.keys(oauthParams)
      .sort()
      .map((k) => `${enc(k)}=${enc(oauthParams[k])}`)
      .join('&');

    const base = `${method}&${enc(url)}&${enc(sorted)}`;
    const signingKey = `${enc(apiSecret)}&${enc(accessTokenSecret)}`;
    const signature = createHmac('sha1', signingKey).update(base).digest('base64');

    oauthParams.oauth_signature = signature;

    return 'OAuth ' + Object.keys(oauthParams)
      .map((k) => `${enc(k)}="${enc(oauthParams[k])}"`)
      .join(', ');
  }
}

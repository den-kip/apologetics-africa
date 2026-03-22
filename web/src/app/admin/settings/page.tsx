'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ImageUpload } from '@/components/ui/ImageUpload';
import clsx from 'clsx';

type Tab = 'session' | 'social';

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', color: 'blue',  hint: 'Posts to your Facebook Page feed when content is published.' },
  { key: 'twitter',  label: 'Twitter / X', color: 'sky', hint: 'Posts a tweet when content is published. Requires Twitter Developer App credentials.' },
  { key: 'linkedin', label: 'LinkedIn', color: 'indigo', hint: 'Shares to your LinkedIn profile or company page when content is published.' },
] as const;

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'session');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Session fields
  const [topic, setTopic] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [sessionError, setSessionError] = useState('');

  // Social fields
  const [siteUrl, setSiteUrl] = useState('');
  const [resourceTemplate, setResourceTemplate] = useState('');
  const [blogTemplate, setBlogTemplate] = useState('');

  // Social profile URLs
  const [urlFacebook, setUrlFacebook] = useState('');
  const [urlTwitter, setUrlTwitter] = useState('');
  const [urlLinkedin, setUrlLinkedin] = useState('');
  const [urlYoutube, setUrlYoutube] = useState('');
  const [urlWhatsapp, setUrlWhatsapp] = useState('');
  const [urlInstagram, setUrlInstagram] = useState('');

  const [fbEnabled, setFbEnabled] = useState(false);
  const [fbPageId, setFbPageId] = useState('');
  const [fbToken, setFbToken] = useState('');

  const [twEnabled, setTwEnabled] = useState(false);
  const [twApiKey, setTwApiKey] = useState('');
  const [twApiSecret, setTwApiSecret] = useState('');
  const [twAccessToken, setTwAccessToken] = useState('');
  const [twAccessTokenSecret, setTwAccessTokenSecret] = useState('');

  const [liEnabled, setLiEnabled] = useState(false);
  const [liAccessToken, setLiAccessToken] = useState('');
  const [liUrn, setLiUrn] = useState('');

  const [socialSaving, setSocialSaving] = useState(false);
  const [socialSaved, setSocialSaved] = useState(false);
  const [socialError, setSocialError] = useState('');
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; error?: string }>>({});

  useEffect(() => {
    api.admin.settings
      .get()
      .then((data) => {
        setTopic(data.session_topic || '');
        setTime(data.session_time || '');
        setVenue(data.session_venue || '');
        setDescription(data.session_description || '');
        setPoster(data.session_poster || '');

        setSiteUrl(data.social_site_url || '');
        setResourceTemplate(data.social_resource_template || '');
        setBlogTemplate(data.social_blog_template || '');

        setUrlFacebook(data.social_url_facebook || '');
        setUrlTwitter(data.social_url_twitter || '');
        setUrlLinkedin(data.social_url_linkedin || '');
        setUrlYoutube(data.social_url_youtube || '');
        setUrlWhatsapp(data.social_url_whatsapp || '');
        setUrlInstagram(data.social_url_instagram || '');

        setFbEnabled(data.social_facebook_enabled === 'true');
        setFbPageId(data.social_facebook_page_id || '');
        setFbToken(data.social_facebook_token || '');

        setTwEnabled(data.social_twitter_enabled === 'true');
        setTwApiKey(data.social_twitter_api_key || '');
        setTwApiSecret(data.social_twitter_api_secret || '');
        setTwAccessToken(data.social_twitter_access_token || '');
        setTwAccessTokenSecret(data.social_twitter_access_token_secret || '');

        setLiEnabled(data.social_linkedin_enabled === 'true');
        setLiAccessToken(data.social_linkedin_access_token || '');
        setLiUrn(data.social_linkedin_urn || '');
      })
      .catch((err: any) => setFetchError(err.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSessionSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSessionSaving(true);
    setSessionError('');
    setSessionSaved(false);
    try {
      await api.admin.settings.update({
        session_topic: topic, session_time: time, session_venue: venue,
        session_description: description, session_poster: poster,
      }, token);
      setSessionSaved(true);
      setTimeout(() => setSessionSaved(false), 4000);
    } catch (err: any) {
      setSessionError(err.message || 'Failed to save');
    } finally {
      setSessionSaving(false);
    }
  }

  async function handleSocialSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSocialSaving(true);
    setSocialError('');
    setSocialSaved(false);
    try {
      await api.admin.settings.update({
        social_site_url: siteUrl,
        social_resource_template: resourceTemplate,
        social_blog_template: blogTemplate,
        social_url_facebook: urlFacebook,
        social_url_twitter: urlTwitter,
        social_url_linkedin: urlLinkedin,
        social_url_youtube: urlYoutube,
        social_url_whatsapp: urlWhatsapp,
        social_url_instagram: urlInstagram,
        social_facebook_enabled: String(fbEnabled),
        social_facebook_page_id: fbPageId,
        social_facebook_token: fbToken,
        social_twitter_enabled: String(twEnabled),
        social_twitter_api_key: twApiKey,
        social_twitter_api_secret: twApiSecret,
        social_twitter_access_token: twAccessToken,
        social_twitter_access_token_secret: twAccessTokenSecret,
        social_linkedin_enabled: String(liEnabled),
        social_linkedin_access_token: liAccessToken,
        social_linkedin_urn: liUrn,
      }, token);
      setSocialSaved(true);
      setTimeout(() => setSocialSaved(false), 4000);
    } catch (err: any) {
      setSocialError(err.message || 'Failed to save');
    } finally {
      setSocialSaving(false);
    }
  }

  async function handleTest(platform: string) {
    if (!token) return;
    setTestingPlatform(platform);
    setTestResults((r) => ({ ...r, [platform]: undefined as any }));
    try {
      const result = await api.admin.social.test(platform, token);
      setTestResults((r) => ({ ...r, [platform]: result }));
    } catch (err: any) {
      setTestResults((r) => ({ ...r, [platform]: { ok: false, error: err.message } }));
    } finally {
      setTestingPlatform(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
        <div className="card p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 max-w-2xl">
        {fetchError}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configure site-wide settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
        {(['session', 'social'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-1.5 text-sm rounded-md transition-colors capitalize',
              tab === t
                ? 'bg-white text-slate-900 shadow-sm font-medium'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t === 'session' ? 'Session' : 'Social Media'}
          </button>
        ))}
      </div>

      {/* Session tab */}
      {tab === 'session' && (
        <form onSubmit={handleSessionSave} className="max-w-2xl space-y-6">
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-800">Saturday Sessions</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Topic</label>
              <input type="text" className="input-field" value={topic}
                onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Truth and Postmodernism" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Time</label>
              <input type="text" className="input-field" value={time}
                onChange={(e) => setTime(e.target.value)} placeholder="e.g. 7:00 PM EAT" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Venue</label>
              <input type="text" className="input-field" value={venue}
                onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Online & In-Person (Nairobi)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic Description</label>
              <textarea className="input-field resize-none" rows={3} value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the current topic…" />
            </div>
            <ImageUpload label="Session Poster" value={poster} onChange={setPoster}
              hint="Displayed on the upcoming events section of the home page." />
          </div>

          {sessionError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
              {sessionError}
            </p>
          )}
          {sessionSaved && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircleIcon className="w-4 h-4 shrink-0" /> Settings saved.
            </div>
          )}
          <button type="submit" disabled={sessionSaving} className="btn-primary disabled:opacity-50">
            {sessionSaving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      )}

      {/* Social Media tab */}
      {tab === 'social' && (
        <form onSubmit={handleSocialSave} className="max-w-2xl space-y-6">

          {/* Profile URLs */}
          <div className="card p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Social Media Profiles</h2>
              <p className="text-xs text-slate-400 mt-0.5">These links appear in the site footer. Leave blank to hide a platform.</p>
            </div>
            {[
              { label: 'Facebook',    value: urlFacebook,   set: setUrlFacebook,   placeholder: 'https://facebook.com/apologeticsafrica' },
              { label: 'Twitter / X', value: urlTwitter,    set: setUrlTwitter,    placeholder: 'https://twitter.com/apologeticsafrica' },
              { label: 'LinkedIn',    value: urlLinkedin,   set: setUrlLinkedin,   placeholder: 'https://linkedin.com/company/apologetics-africa' },
              { label: 'YouTube',     value: urlYoutube,    set: setUrlYoutube,    placeholder: 'https://youtube.com/@apologeticsafrica' },
              { label: 'WhatsApp',    value: urlWhatsapp,   set: setUrlWhatsapp,   placeholder: 'https://chat.whatsapp.com/...' },
              { label: 'Instagram',   value: urlInstagram,  set: setUrlInstagram,  placeholder: 'https://instagram.com/apologeticsafrica' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <input
                  type="url"
                  className="input-field"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          {/* General */}
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-800">General</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Site URL</label>
              <input type="url" className="input-field" value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://apologeticsafrica.com" />
              <p className="text-xs text-slate-400 mt-1">Used to build links in social posts.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Resource Post Template</label>
              <textarea className="input-field resize-none font-mono text-sm" rows={3}
                value={resourceTemplate} onChange={(e) => setResourceTemplate(e.target.value)}
                placeholder="New resource: {title}&#10;{excerpt}&#10;{url}" />
              <p className="text-xs text-slate-400 mt-1">
                Variables: <code className="bg-slate-100 px-1 rounded">{'{title}'}</code>{' '}
                <code className="bg-slate-100 px-1 rounded">{'{excerpt}'}</code>{' '}
                <code className="bg-slate-100 px-1 rounded">{'{url}'}</code>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Blog Post Template</label>
              <textarea className="input-field resize-none font-mono text-sm" rows={3}
                value={blogTemplate} onChange={(e) => setBlogTemplate(e.target.value)}
                placeholder="New blog post: {title}&#10;{excerpt}&#10;{url}" />
            </div>
          </div>

          {/* Facebook */}
          <PlatformCard
            platform="facebook"
            label="Facebook"
            enabled={fbEnabled}
            onToggle={setFbEnabled}
            onTest={() => handleTest('facebook')}
            testing={testingPlatform === 'facebook'}
            testResult={testResults['facebook']}
            hint="Posts to your Facebook Page feed. Get a long-lived Page Access Token from the Facebook Developer Console."
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Page ID</label>
              <input type="text" className="input-field" value={fbPageId}
                onChange={(e) => setFbPageId(e.target.value)} placeholder="123456789" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Page Access Token</label>
              <input type="password" className="input-field" value={fbToken}
                onChange={(e) => setFbToken(e.target.value)} placeholder="EAAxxxxx…" />
            </div>
          </PlatformCard>

          {/* Twitter */}
          <PlatformCard
            platform="twitter"
            label="Twitter / X"
            enabled={twEnabled}
            onToggle={setTwEnabled}
            onTest={() => handleTest('twitter')}
            testing={testingPlatform === 'twitter'}
            testResult={testResults['twitter']}
            hint="Posts tweets when content is published. Requires a Twitter Developer App with Read & Write permissions."
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key (Consumer Key)</label>
                <input type="password" className="input-field" value={twApiKey}
                  onChange={(e) => setTwApiKey(e.target.value)} placeholder="API key…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">API Secret</label>
                <input type="password" className="input-field" value={twApiSecret}
                  onChange={(e) => setTwApiSecret(e.target.value)} placeholder="API secret…" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Token</label>
                <input type="password" className="input-field" value={twAccessToken}
                  onChange={(e) => setTwAccessToken(e.target.value)} placeholder="Access token…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Token Secret</label>
                <input type="password" className="input-field" value={twAccessTokenSecret}
                  onChange={(e) => setTwAccessTokenSecret(e.target.value)} placeholder="Token secret…" />
              </div>
            </div>
          </PlatformCard>

          {/* LinkedIn */}
          <PlatformCard
            platform="linkedin"
            label="LinkedIn"
            enabled={liEnabled}
            onToggle={setLiEnabled}
            onTest={() => handleTest('linkedin')}
            testing={testingPlatform === 'linkedin'}
            testResult={testResults['linkedin']}
            hint="Shares to your LinkedIn profile or company page. Get an OAuth 2.0 access token with w_member_social permission."
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Token</label>
              <input type="password" className="input-field" value={liAccessToken}
                onChange={(e) => setLiAccessToken(e.target.value)} placeholder="OAuth 2.0 access token…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Person / Organization URN</label>
              <input type="text" className="input-field" value={liUrn}
                onChange={(e) => setLiUrn(e.target.value)}
                placeholder="urn:li:person:XXXX or urn:li:organization:XXXX" />
              <p className="text-xs text-slate-400 mt-1">
                Find your person URN via <code className="bg-slate-100 px-1 rounded">GET /v2/userinfo</code>.
              </p>
            </div>
          </PlatformCard>

          {socialError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
              {socialError}
            </p>
          )}
          {socialSaved && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircleIcon className="w-4 h-4 shrink-0" /> Social media settings saved.
            </div>
          )}
          <button type="submit" disabled={socialSaving} className="btn-primary disabled:opacity-50">
            {socialSaving ? 'Saving…' : 'Save Social Settings'}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Platform Card ─────────────────────────────────────────────────────────────

interface PlatformCardProps {
  platform: string;
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onTest: () => void;
  testing: boolean;
  testResult?: { ok: boolean; error?: string };
  hint: string;
  children: React.ReactNode;
}

function PlatformCard({
  label, enabled, onToggle, onTest, testing, testResult, hint, children,
}: PlatformCardProps) {
  return (
    <div className={`card p-6 space-y-4 ${enabled ? '' : 'opacity-75'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">{label}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-slate-600">{enabled ? 'Enabled' : 'Disabled'}</span>
          <button
            type="button"
            onClick={() => onToggle(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-brand-600' : 'bg-slate-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </label>
      </div>

      {enabled && (
        <>
          <div className="space-y-4 border-t border-slate-100 pt-4">
            {children}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onTest}
              disabled={testing}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
            {testResult && (
              testResult.ok ? (
                <span className="flex items-center gap-1.5 text-sm text-green-700">
                  <CheckCircleIcon className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-rose-600">
                  <XCircleIcon className="w-4 h-4" /> {testResult.error || 'Failed'}
                </span>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

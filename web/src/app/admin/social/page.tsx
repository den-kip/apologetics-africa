'use client';

import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api, type SocialPost } from '@/lib/api';

type Tab = 'logs' | 'settings';

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-100 text-blue-700',
  twitter:  'bg-sky-100 text-sky-700',
  linkedin: 'bg-indigo-100 text-indigo-700',
};

const TYPE_COLORS: Record<string, string> = {
  resource: 'bg-purple-100 text-purple-700',
  blog:     'bg-teal-100 text-teal-700',
};

export default function SocialPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('logs');

  // ── Logs state ────────────────────────────────────────────────────────────
  const [data, setData] = useState<{ data: SocialPost[]; total: number; page: number; pages: number } | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(() => {
    if (!token) return;
    setLoadingLogs(true);
    api.admin.social.logs(token, { page, limit: 20 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoadingLogs(false));
  }, [token, page]);

  useEffect(() => { if (tab === 'logs') fetchLogs(); }, [tab, fetchLogs]);

  // ── Settings state ────────────────────────────────────────────────────────
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [resourceTemplate, setResourceTemplate] = useState('');
  const [blogTemplate, setBlogTemplate] = useState('');
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
    if (tab !== 'settings') return;
    setLoadingSettings(true);
    api.admin.settings.get()
      .then((d) => {
        setSiteUrl(d.social_site_url || '');
        setResourceTemplate(d.social_resource_template || '');
        setBlogTemplate(d.social_blog_template || '');
        setUrlFacebook(d.social_url_facebook || '');
        setUrlTwitter(d.social_url_twitter || '');
        setUrlLinkedin(d.social_url_linkedin || '');
        setUrlYoutube(d.social_url_youtube || '');
        setUrlWhatsapp(d.social_url_whatsapp || '');
        setUrlInstagram(d.social_url_instagram || '');
        setFbEnabled(d.social_facebook_enabled === 'true');
        setFbPageId(d.social_facebook_page_id || '');
        setFbToken(d.social_facebook_token || '');
        setTwEnabled(d.social_twitter_enabled === 'true');
        setTwApiKey(d.social_twitter_api_key || '');
        setTwApiSecret(d.social_twitter_api_secret || '');
        setTwAccessToken(d.social_twitter_access_token || '');
        setTwAccessTokenSecret(d.social_twitter_access_token_secret || '');
        setLiEnabled(d.social_linkedin_enabled === 'true');
        setLiAccessToken(d.social_linkedin_access_token || '');
        setLiUrn(d.social_linkedin_urn || '');
      })
      .catch(console.error)
      .finally(() => setLoadingSettings(false));
  }, [tab]);

  async function handleSocialSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSocialSaving(true); setSocialError(''); setSocialSaved(false);
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Social Media</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {tab === 'logs' ? (data ? `${data.total} posts logged` : 'Loading…') : 'Configure social platforms and profile links'}
          </p>
        </div>
        {tab === 'logs' && (
          <button onClick={fetchLogs} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Refresh">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
        {(['logs', 'settings'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-4 py-1.5 text-sm rounded-md transition-colors capitalize',
              tab === t ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700')}>
            {t === 'logs' ? 'Post Logs' : 'Settings'}
          </button>
        ))}
      </div>

      {/* ── Logs tab ── */}
      {tab === 'logs' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Platform</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Content</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Message</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Posted</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">
                      <p className="font-medium mb-1">No posts yet</p>
                      <p>Posts will appear here when content is published to enabled social platforms.</p>
                      <button onClick={() => setTab('settings')} className="mt-2 text-brand-600 hover:underline text-xs">
                        Configure social media →
                      </button>
                    </td>
                  </tr>
                ) : (
                  data?.data.map((post) => (
                    <tr key={post.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
                          PLATFORM_COLORS[post.platform] ?? 'bg-slate-100 text-slate-600')}>
                          {post.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mb-1 capitalize',
                            TYPE_COLORS[post.contentType] ?? 'bg-slate-100 text-slate-600')}>
                            {post.contentType}
                          </span>
                          <p className="text-slate-700 font-medium text-xs truncate max-w-[180px]">{post.contentTitle || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-slate-500 text-xs truncate">{post.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        {post.status === 'success' ? (
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <CheckCircleIcon className="w-4 h-4" /> Success
                          </span>
                        ) : (
                          <div>
                            <span className="flex items-center gap-1 text-xs text-rose-600">
                              <XCircleIcon className="w-4 h-4" /> Failed
                            </span>
                            {post.error && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]" title={post.error}>{post.error}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(post.postedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Page {data.page} of {data.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Previous</button>
                <button onClick={() => setPage(p => Math.min(data.pages, p+1))} disabled={page === data.pages}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Settings tab ── */}
      {tab === 'settings' && (
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
                <input type="url" className="input-field" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
              </div>
            ))}
          </div>

          {/* General */}
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-800">Post Templates</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Site URL</label>
              <input type="url" className="input-field" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://apologeticsafrica.com" />
              <p className="text-xs text-slate-400 mt-1">Used to build links in social posts.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Resource Post Template</label>
              <textarea className="input-field resize-none font-mono text-sm" rows={3} value={resourceTemplate}
                onChange={(e) => setResourceTemplate(e.target.value)} placeholder={"New resource: {title}\n{excerpt}\n{url}"} />
              <p className="text-xs text-slate-400 mt-1">
                Variables: <code className="bg-slate-100 px-1 rounded">{'{title}'}</code>{' '}
                <code className="bg-slate-100 px-1 rounded">{'{excerpt}'}</code>{' '}
                <code className="bg-slate-100 px-1 rounded">{'{url}'}</code>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Blog Post Template</label>
              <textarea className="input-field resize-none font-mono text-sm" rows={3} value={blogTemplate}
                onChange={(e) => setBlogTemplate(e.target.value)} placeholder={"New blog post: {title}\n{excerpt}\n{url}"} />
            </div>
          </div>

          {/* Facebook */}
          <PlatformCard platform="facebook" label="Facebook" enabled={fbEnabled} onToggle={setFbEnabled}
            onTest={() => handleTest('facebook')} testing={testingPlatform === 'facebook'} testResult={testResults['facebook']}
            hint="Posts to your Facebook Page feed. Get a long-lived Page Access Token from the Facebook Developer Console.">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Page ID</label>
              <input type="text" className="input-field" value={fbPageId} onChange={(e) => setFbPageId(e.target.value)} placeholder="123456789" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Page Access Token</label>
              <input type="password" className="input-field" value={fbToken} onChange={(e) => setFbToken(e.target.value)} placeholder="EAAxxxxx…" />
            </div>
          </PlatformCard>

          {/* Twitter */}
          <PlatformCard platform="twitter" label="Twitter / X" enabled={twEnabled} onToggle={setTwEnabled}
            onTest={() => handleTest('twitter')} testing={testingPlatform === 'twitter'} testResult={testResults['twitter']}
            hint="Posts tweets when content is published. Requires a Twitter Developer App with Read & Write permissions.">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key</label>
                <input type="password" className="input-field" value={twApiKey} onChange={(e) => setTwApiKey(e.target.value)} placeholder="API key…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">API Secret</label>
                <input type="password" className="input-field" value={twApiSecret} onChange={(e) => setTwApiSecret(e.target.value)} placeholder="API secret…" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Token</label>
                <input type="password" className="input-field" value={twAccessToken} onChange={(e) => setTwAccessToken(e.target.value)} placeholder="Access token…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Token Secret</label>
                <input type="password" className="input-field" value={twAccessTokenSecret} onChange={(e) => setTwAccessTokenSecret(e.target.value)} placeholder="Token secret…" />
              </div>
            </div>
          </PlatformCard>

          {/* LinkedIn */}
          <PlatformCard platform="linkedin" label="LinkedIn" enabled={liEnabled} onToggle={setLiEnabled}
            onTest={() => handleTest('linkedin')} testing={testingPlatform === 'linkedin'} testResult={testResults['linkedin']}
            hint="Shares to your LinkedIn profile or company page. Get an OAuth 2.0 access token with w_member_social permission.">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Token</label>
              <input type="password" className="input-field" value={liAccessToken} onChange={(e) => setLiAccessToken(e.target.value)} placeholder="OAuth 2.0 access token…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Person / Organization URN</label>
              <input type="text" className="input-field" value={liUrn} onChange={(e) => setLiUrn(e.target.value)}
                placeholder="urn:li:person:XXXX or urn:li:organization:XXXX" />
              <p className="text-xs text-slate-400 mt-1">Find your person URN via <code className="bg-slate-100 px-1 rounded">GET /v2/userinfo</code>.</p>
            </div>
          </PlatformCard>

          {socialError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">{socialError}</p>}
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
  platform: string; label: string; enabled: boolean;
  onToggle: (v: boolean) => void; onTest: () => void;
  testing: boolean; testResult?: { ok: boolean; error?: string };
  hint: string; children: React.ReactNode;
}

function PlatformCard({ label, enabled, onToggle, onTest, testing, testResult, hint, children }: PlatformCardProps) {
  return (
    <div className={`card p-6 space-y-4 ${enabled ? '' : 'opacity-75'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">{label}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-slate-600">{enabled ? 'Enabled' : 'Disabled'}</span>
          <button type="button" onClick={() => onToggle(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-brand-600' : 'bg-slate-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </label>
      </div>
      {enabled && (
        <>
          <div className="space-y-4 border-t border-slate-100 pt-4">{children}</div>
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={onTest} disabled={testing}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
            {testResult && (
              testResult.ok
                ? <span className="flex items-center gap-1.5 text-sm text-green-700"><CheckCircleIcon className="w-4 h-4" /> Connected</span>
                : <span className="flex items-center gap-1.5 text-sm text-rose-600"><XCircleIcon className="w-4 h-4" /> {testResult.error || 'Failed'}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

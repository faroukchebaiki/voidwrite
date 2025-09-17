"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

type Passkey = { credentialID: string; counter: number };

export default function SettingsSingle({ account, passkeys }: { account?: { email?: string }; passkeys?: Passkey[] }) {
  // Profile state (local for now)
  const defaultAvatar = "https://github.com/shadcn.png";
  const [avatarUrl, setAvatarUrl] = useState<string>(defaultAvatar);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [social, setSocial] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const av = localStorage.getItem('profile_avatar_url'); if (av) setAvatarUrl(av);
        const res = await fetch('/api/profile', { cache: 'no-store' });
        if (res.ok) {
          const p = await res.json();
          if (p) {
            setFirst(p.firstName || '');
            setLast(p.lastName || '');
            setUsername(p.username || '');
            setBio(p.bio || '');
            setSocial(p.link || '');
          }
        }
      } catch {}
    })();
  }, []);

  const clickUpload = () => fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const body = new FormData(); body.append('file', f);
      const res = await fetch('/api/upload', { method: 'POST', body });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setAvatarUrl(url);
      try { localStorage.setItem('profile_avatar_url', url); } catch {}
      // notify sidebar avatar to update via storage event
    } catch (err) { toast.error((err as any)?.message || 'Upload error'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const onSaveProfile = async () => {
    const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: first, lastName: last, username, bio, link: social }) });
    if (!res.ok) { toast.error('Failed to save'); return; }
    toast.success('Profile saved');
  };

  const { theme, setTheme } = useTheme();
  const setCookieTheme = (val: 'light'|'dark'|'system') => { try { document.cookie = `vw_theme=${val}; Max-Age=${60*60*24*365}; Path=/`; } catch {} };
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => setThemeMounted(true), []);
  const currentEmail = account?.email || "unknown@example.com";
  const list = passkeys || [];

  return (
    <div className="space-y-10">
      {/* Profile */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="grid gap-4 md:grid-cols-[120px_1fr] items-start">
          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={clickUpload} className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="Avatar" className="h-28 w-28 rounded-full border object-cover" />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-white text-xs opacity-0 hover:opacity-100">{uploading ? 'Uploading…' : 'Change'}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
          <div className="grid gap-3">
            <div>
              <label className="block text-sm mb-1">First name</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Jane" value={first} onChange={(e)=>setFirst(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Last name</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Doe" value={last} onChange={(e)=>setLast(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Username</label>
            <input className="w-full border rounded px-3 py-2" placeholder="janedoe" value={username} onChange={(e)=>setUsername(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Bio</label>
            <textarea className="w-full border rounded px-3 py-2" rows={4} placeholder="Short bio" value={bio} onChange={(e)=>setBio(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Social link</label>
            <input className="w-full border rounded px-3 py-2" placeholder="https://your-social-profile" value={social} onChange={(e)=>setSocial(e.target.value)} />
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <button className="px-3 py-2 border rounded" onClick={onSaveProfile}>Save profile</button>
        </div>
      </section>
      <hr className="my-8 border-t" />
      
      {/* Security */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">Current email: {currentEmail}</p>
        <EmailPasswordClient />
        <div className="space-y-2">
          <div className="text-sm font-medium">Passkeys</div>
          <p className="text-sm text-muted-foreground">You can register up to 5. You currently have {list.length}.</p>
          <Link href="/api/auth/signin?provider=passkey" className="px-3 py-1 border rounded text-sm inline-block">Register new passkey</Link>
          <div className="divide-y rounded border mt-2">
            {list.length === 0 && <div className="p-3 text-sm text-muted-foreground">No passkeys added yet.</div>}
            {list.map((a) => (
              <div key={a.credentialID} className="flex items-center gap-2 p-3">
                <input className="flex-1 border rounded px-2 py-1 text-sm" defaultValue={(typeof window !== 'undefined' && localStorage.getItem('pk_'+a.credentialID)) || ''} placeholder="Passkey name (device/browser)" onBlur={(e) => { try { localStorage.setItem('pk_'+a.credentialID, e.currentTarget.value || ''); } catch {} }} />
                <form action={`/api/account/passkeys?credentialID=${encodeURIComponent(a.credentialID)}`} method="post">
                  <input type="hidden" name="_method" value="DELETE" />
                  <button className="text-red-600 text-sm">Remove</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </section>
      <hr className="my-8 border-t" />

      {/* Theme (last) */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Theme</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded text-sm data-[active=true]:bg-muted" data-active={(themeMounted && theme==='light') ? true : undefined} onClick={() => { setCookieTheme('light'); setTheme('light'); }}>Light</button>
          <button className="px-3 py-1 border rounded text-sm data-[active=true]:bg-muted" data-active={(themeMounted && theme==='dark') ? true : undefined} onClick={() => { setCookieTheme('dark'); setTheme('dark'); }}>Dark</button>
          <button className="px-3 py-1 border rounded text-sm data-[active=true]:bg-muted" data-active={(themeMounted && theme==='system') ? true : undefined} onClick={() => { setCookieTheme('system'); setTheme('system'); }}>System</button>
        </div>
      </section>
    </div>
  );
}

function EmailPasswordClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(); fd.append('email', email);
    const res = await fetch('/api/account/email', { method: 'POST', body: fd });
    if (res.ok) { try { const { toast } = await import('sonner'); toast.success('Email updated'); } catch {}; } else { try { const { toast } = await import('sonner'); toast.error('Failed to update email'); } catch {} }
  };
  const onPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(); fd.append('password', password);
    const res = await fetch('/api/account/password', { method: 'POST', body: fd });
    if (res.ok) { try { const { toast } = await import('sonner'); toast.success('Password changed'); } catch {}; setPassword(''); } else { try { const { toast } = await import('sonner'); toast.error('Failed to change password'); } catch {} }
  };
  return (
    <>
      <div className="space-y-2">
        <div className="text-sm font-medium">Email</div>
        <form onSubmit={onEmail} className="flex gap-2 max-w-md">
          <input className="flex-1 border rounded px-3 py-2" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="new@email.com" required />
          <button className="px-3 py-2 border rounded">Change email</button>
        </form>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">Password</div>
        <form onSubmit={onPassword} className="flex gap-2 max-w-md">
          <input className="flex-1 border rounded px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="New password" required />
          <button className="px-3 py-2 border rounded">Change password</button>
        </form>
        <p className="text-xs text-muted-foreground">Password last changed: not tracked yet.</p>
      </div>
    </>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

type Passkey = { credentialID: string; counter: number; label?: string | null };

export default function SettingsSingle({ account, passkeys }: { account?: { email?: string; name?: string | null }; passkeys?: Passkey[] }) {
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
  const router = useRouter();
  const list = passkeys || [];
  const [passkeyLabels, setPasskeyLabels] = useState<Record<string, string>>({});
  const [passkeyDialogOpen, setPasskeyDialogOpen] = useState(false);
  const [passkeyDialogMode, setPasskeyDialogMode] = useState<"register" | "edit" | "delete" | null>(null);
  const [activeCredentialId, setActiveCredentialId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [registerPhase, setRegisterPhase] = useState<'password' | 'waiting'>('password');
  const [webauthnError, setWebauthnError] = useState<string | null>(null);
  const [passkeyNameInput, setPasskeyNameInput] = useState("");
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const pendingEditIdRef = useRef<string | null>(null);
  const namingNewPasskeyRef = useRef(false);
  const previousPasskeyIdsRef = useRef<Set<string>>(new Set(list.map((item) => item.credentialID)));
  const newPasskeyToastShownRef = useRef(false);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const labels: Record<string, string> = {};
    (passkeys || []).forEach((item) => {
      if (item.label) {
        labels[item.credentialID] = item.label;
      }
      const stored = localStorage.getItem(`pk_${item.credentialID}`);
      if (stored) labels[item.credentialID] = stored;
    });
    const prevIds = previousPasskeyIdsRef.current;
    const currentIds = new Set((passkeys || []).map((item) => item.credentialID));
    const newIds: string[] = [];
    currentIds.forEach((id) => {
      if (!prevIds.has(id)) newIds.push(id);
    });
    if (newIds.length > 0) {
      pendingEditIdRef.current = newIds[0];
      namingNewPasskeyRef.current = true;
      newPasskeyToastShownRef.current = false;
    }
    previousPasskeyIdsRef.current = currentIds;
    setPasskeyLabels(labels);

    const targetId = pendingEditIdRef.current;
    if (targetId && currentIds.has(targetId) && !passkeyDialogOpen) {
      if (namingNewPasskeyRef.current && !newPasskeyToastShownRef.current) {
        toast.success('Passkey registered. Give it a name to recognize it later.', {
          position: 'bottom-center',
          duration: 3500,
        });
        newPasskeyToastShownRef.current = true;
      }
      resetPasskeyDialog();
      setPasskeyDialogMode('edit');
      setActiveCredentialId(targetId);
      setPasskeyNameInput(namingNewPasskeyRef.current ? '' : labels[targetId] || '');
      setPasskeyDialogOpen(true);
    }
  }, [passkeys, passkeyDialogOpen]);

  const clickUpload = () => fileRef.current?.click();
  useEffect(() => {
    if (!account?.name) return;
    if (first || last) return;
    const parts = account.name.trim().split(/\s+/);
    if (parts.length > 0 && !first) {
      setFirst(parts[0] ?? '');
    }
    if (parts.length > 1 && !last) {
      setLast(parts.slice(1).join(' '));
    }
  }, [account?.name, first, last]);
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
    const payload = {
      firstName: first.trim() || null,
      lastName: last.trim() || null,
      username: username.trim() || null,
      bio: bio.trim() || null,
      link: social.trim() || null,
    };
    const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const errMessage = await res.json().catch(() => null);
      toast.error((errMessage as any)?.error || 'Failed to save profile', { position: 'bottom-center' });
      return;
    }
    const data = await res.json().catch(() => null) as any;
    if (!data?.success) {
      toast.error('Failed to confirm profile save', { position: 'bottom-center' });
      return;
    }
    const message = data?.message || 'Profile has been saved';
    toast.success(message, { position: 'bottom-center', duration: 3500 });
  };

const bufferToBase64 = (input: ArrayBuffer | Uint8Array | string) => {
  if (typeof input === 'string') {
    return input;
  }
  const uintArray = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < uintArray.length; i += 1) {
    binary += String.fromCharCode(uintArray[i]);
  }
  return btoa(binary);
};
const getStoredPasskeyName = (id: string) => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(`pk_${id}`) || '';
};

const storePasskeyLabel = (
  credentialId: string,
  label?: string,
  update?: Dispatch<SetStateAction<Record<string, string>>>,
) => {
  if (typeof window !== 'undefined') {
    try {
      if (label && label.length > 0) {
        localStorage.setItem(`pk_${credentialId}`, label);
      } else {
        localStorage.removeItem(`pk_${credentialId}`);
      }
    } catch {
      /* ignore storage failures */
    }
  }
  if (update) {
    update((prev) => {
      const next = { ...prev };
      if (label && label.length > 0) {
        next[credentialId] = label;
      } else {
        delete next[credentialId];
      }
      return next;
    });
  }
};

const persistPasskeyLabel = async (credentialId: string, label?: string) => {
  try {
    if (label && label.length > 0) {
      await fetch('/api/passkeys/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId, label }),
      });
    } else {
      await fetch('/api/passkeys/label', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId }),
      });
    }
  } catch {
    // ignore network/permission errors; labels remain stored locally
  }
};

  const resetPasskeyDialog = () => {
    setPasswordInput('');
    setPasswordStatus('idle');
    setPasswordError(null);
    setRegisterPhase('password');
    setWebauthnError(null);
    setPasskeyNameInput('');
    setActiveCredentialId(null);
    setDeleteProcessing(false);
    setShowRegisterPassword(false);
    setShowDeletePassword(false);
  };

  const closePasskeyDialog = () => {
    const mode = passkeyDialogMode;
    setPasskeyDialogOpen(false);
    setPasskeyDialogMode(null);
    resetPasskeyDialog();
    if (mode === 'edit') {
      namingNewPasskeyRef.current = false;
      pendingEditIdRef.current = null;
    }
  };

  const openPasskeyDialog = (mode: "register" | "edit" | "delete", credentialId?: string, initialName?: string) => {
    resetPasskeyDialog();
    setPasskeyDialogMode(mode);
    if (mode === 'register') {
      setRegisterPhase('password');
      setWebauthnError(null);
    }
    if (credentialId) {
      setActiveCredentialId(credentialId);
      if (mode !== 'register') {
        const stored = initialName ?? getStoredPasskeyName(credentialId);
        setPasskeyNameInput(stored);
      }
    }
    setPasskeyDialogOpen(true);
  };

  const handleRegisterClick = () => {
    if (typeof window === 'undefined' || typeof window.PublicKeyCredential === 'undefined') {
      toast.error('Passkeys are not supported in this browser yet.', { position: 'bottom-center' });
      return;
    }
    if (list.length >= 5) {
      toast.error('You have reached the maximum number of passkeys. Delete one before adding another.', { position: 'bottom-center' });
      return;
    }
    pendingEditIdRef.current = null;
    namingNewPasskeyRef.current = false;
    openPasskeyDialog('register');
  };

  const verifyPasswordInput = async () => {
    setPasswordError(null);
    const value = passwordInput.trim();
    if (!value) {
      setPasswordStatus('error');
      setPasswordError('Enter your password to continue.');
      return false;
    }
    setPasswordStatus('verifying');
    try {
      const res = await fetch('/api/account/password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: value }),
      });
      if (!res.ok) {
        const details = await res.json().catch(() => null);
        const message = details?.error || 'Password verification failed.';
        setPasswordStatus('error');
        setPasswordError(message);
        return false;
      }
      setPasswordStatus('verified');
      setPasswordError(null);
      return true;
    } catch (error) {
      setPasswordStatus('error');
      setPasswordError((error as Error)?.message || 'Password verification failed.');
      return false;
    }
  };

  const beginPasskeyRegistration = async () => {
    setWebauthnError(null);
    let completed = false;
    try {
      const optionsRes = await fetch('/api/auth/webauthn-options/passkey?action=register', { credentials: 'include' });
      if (!optionsRes.ok) {
        throw new Error('Unable to get passkey options.');
      }
      const optionsData = await optionsRes.json();
      if (optionsData?.action !== 'register' || !optionsData?.options) {
        throw new Error('Received unexpected passkey registration response.');
      }
      const registrationResponse = await startRegistration(optionsData.options);
      const callbackBody = new URLSearchParams({
        action: 'register',
        data: JSON.stringify(registrationResponse),
        callbackUrl: typeof window !== 'undefined' ? window.location.href : '/studio/settings',
      });
      const callbackRes = await fetch('/api/auth/callback/passkey?action=register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: callbackBody,
        redirect: 'manual',
      });
      const registrationSucceeded = callbackRes.ok || callbackRes.type === 'opaqueredirect';
      if (!registrationSucceeded) {
        let errorMessage = 'Passkey registration failed on the server.';
        try {
          const errJson = await callbackRes.json();
          if (errJson?.error) errorMessage = errJson.error;
        } catch {
          /* ignore JSON parse issues */
        }
        throw new Error(errorMessage);
      }
      const credentialId = bufferToBase64(registrationResponse.rawId);
      pendingEditIdRef.current = credentialId;
      namingNewPasskeyRef.current = true;
      setPasskeyDialogOpen(false);
      setPasskeyDialogMode(null);
      resetPasskeyDialog();
      completed = true;
      try {
        router.refresh();
      } catch {
        /* ignore refresh errors */
      }
    } catch (err) {
      const errorMessage = err instanceof DOMException
        ? (err.name === 'NotAllowedError' || err.name === 'AbortError'
          ? 'Passkey registration was cancelled. Try again when you are ready.'
          : err.message)
        : (err as Error)?.message || 'Failed to complete passkey registration.';
      setWebauthnError(errorMessage);
      setRegisterPhase('waiting');
      setPasswordStatus('verified');
    } finally {
      if (completed) {
        setRegisterPhase('password');
        setPasswordStatus('idle');
      }
    }
  };

  const handleVerifyPasswordForRegistration = async () => {
    if (registerPhase === 'waiting') {
      setWebauthnError(null);
      await beginPasskeyRegistration();
      return;
    }
    if (passwordStatus === 'verifying') return;
    const valid = await verifyPasswordInput();
    if (!valid) return;
    setRegisterPhase('waiting');
    await beginPasskeyRegistration();
  };

  const handleEditPasskey = (credentialId: string) => {
    pendingEditIdRef.current = null;
    namingNewPasskeyRef.current = false;
    openPasskeyDialog('edit', credentialId);
  };

  const handleSaveEditedPasskey = async () => {
    if (!activeCredentialId) return;
    const label = passkeyNameInput.trim();
    storePasskeyLabel(activeCredentialId, label || undefined, setPasskeyLabels);
    if (namingNewPasskeyRef.current) {
      toast.success(label ? `Passkey "${label}" has been registered.` : 'Passkey has been registered.', {
        position: 'bottom-center',
        duration: 4000,
      });
      newPasskeyToastShownRef.current = true;
    } else {
      toast.success(label ? 'Passkey name updated.' : 'Passkey name cleared.', {
        position: 'bottom-center',
        duration: 2500,
      });
    }
    await persistPasskeyLabel(activeCredentialId, label || undefined);
    namingNewPasskeyRef.current = false;
    pendingEditIdRef.current = null;
    closePasskeyDialog();
  };

  const handleDeletePasskey = (credentialId: string) => {
    openPasskeyDialog('delete', credentialId);
  };

  const handleConfirmDeletePasskey = async () => {
    if (!activeCredentialId) return;
    setDeleteProcessing(true);
    const valid = await verifyPasswordInput();
    if (!valid) {
      setDeleteProcessing(false);
      return;
    }
    try {
      const res = await fetch(`/api/account/passkeys?credentialID=${encodeURIComponent(activeCredentialId)}&_method=DELETE`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || 'Failed to delete passkey.');
      }
      storePasskeyLabel(activeCredentialId, undefined, setPasskeyLabels);
      await persistPasskeyLabel(activeCredentialId, undefined);
      pendingEditIdRef.current = null;
      namingNewPasskeyRef.current = false;
      toast.success('Passkey removed.', { position: 'bottom-center', duration: 3000 });
      closePasskeyDialog();
      try {
        router.refresh();
    } catch {
        /* ignore refresh errors */
      }
    } catch (error) {
      setPasswordStatus('error');
      setPasswordError((error as Error)?.message || 'Failed to delete passkey.');
      setDeleteProcessing(false);
    } finally {
      setDeleteProcessing(false);
    }
  };

  const { theme, setTheme } = useTheme();
  const setCookieTheme = (val: 'light'|'dark'|'system') => { try { document.cookie = `vw_theme=${val}; Max-Age=${60*60*24*365}; Path=/`; } catch {} };
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => setThemeMounted(true), []);
  const currentEmail = account?.email || "unknown@example.com";

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
          <Button type="button" onClick={onSaveProfile} className="w-full sm:w-auto">
            Save profile
          </Button>
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
          <Button type="button" variant="outline" className="w-full text-sm sm:w-auto" onClick={handleRegisterClick}>
            Register new passkey
          </Button>
          <div className="divide-y rounded border mt-2">
            {list.length === 0 && <div className="p-3 text-sm text-muted-foreground">No passkeys added yet.</div>}
            {list.map((a) => {
              const serverLabel = (a as { label?: string | null }).label;
              const label = passkeyLabels[a.credentialID] ?? serverLabel ?? 'Unnamed passkey';
              return (
                <div key={a.credentialID} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 break-words">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground break-all">ID: {a.credentialID}</div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleEditPasskey(a.credentialID)}>
                      Rename
                    </Button>
                    <Button type="button" variant="destructive" size="sm" className="w-full sm:w-auto" onClick={() => handleDeletePasskey(a.credentialID)}>
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Dialog open={passkeyDialogOpen} onOpenChange={(open) => { if (!open) closePasskeyDialog(); }}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-sm overflow-y-auto rounded-lg p-5 sm:max-w-md sm:p-6">
          {passkeyDialogMode === 'register' && (
            <>
              <DialogHeader>
                <DialogTitle>Register a new passkey</DialogTitle>
                <DialogDescription>Secure your account with a trusted device credential.</DialogDescription>
              </DialogHeader>
              {registerPhase === 'password' ? (
                <form
                  className="space-y-4"
                  autoComplete="current-password"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyPasswordForRegistration();
                  }}
                >
                  <div className="space-y-2">
                    <label htmlFor="passkey-password" className="text-sm font-medium">Account password</label>
                    <div className="relative">
                      <input
                        id="passkey-password"
                        name="current-password"
                        type={showRegisterPassword ? 'text' : 'password'}
                        className="w-full rounded-md border px-3 py-2 pr-10 text-sm"
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value);
                          if (passwordStatus !== 'idle') {
                            setPasswordStatus('idle');
                            setPasswordError(null);
                          }
                          if (webauthnError) setWebauthnError(null);
                        }}
                        autoComplete="current-password"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={passwordStatus === 'verifying'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                        aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
                    {webauthnError && <p className="text-xs text-destructive">{webauthnError}</p>}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={closePasskeyDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={passwordStatus === 'verifying'}>
                      {passwordStatus === 'verifying' ? 'Verifying…' : 'Verify password'}
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="rounded-md border border-muted bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
                      Follow the browser prompt in your browser to finish creating the passkey.
                    </div>
                    {webauthnError && (
                      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {webauthnError}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={closePasskeyDialog}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleVerifyPasswordForRegistration}>
                      Retry
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
          {passkeyDialogMode === 'edit' && (
            <>
              <DialogHeader>
                <DialogTitle>Rename passkey</DialogTitle>
                <DialogDescription>Give this passkey a recognizable name.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="edit-passkey-name" className="text-sm font-medium">Passkey name</label>
                  <input
                    id="edit-passkey-name"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={passkeyNameInput}
                    onChange={(e) => setPasskeyNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveEditedPasskey();
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={closePasskeyDialog}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveEditedPasskey}>
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
          {passkeyDialogMode === 'delete' && (
            <>
              <DialogHeader>
                <DialogTitle>Delete passkey</DialogTitle>
                <DialogDescription>Please confirm your password to remove this passkey.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground">
                  {passkeyNameInput ? `Passkey: ${passkeyNameInput}` : 'Unnamed passkey'}
                </div>
                <div className="space-y-2">
                  <label htmlFor="delete-passkey-password" className="text-sm font-medium">Account password</label>
                  <form
                    className="space-y-4"
                    autoComplete="current-password"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleConfirmDeletePasskey();
                    }}
                  >
                    <div className="relative">
                      <input
                        id="delete-passkey-password"
                        name="current-password"
                        type={showDeletePassword ? 'text' : 'password'}
                        className="w-full rounded-md border px-3 py-2 pr-10 text-sm"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (passwordStatus !== 'idle') {
                          setPasswordStatus('idle');
                          setPasswordError(null);
                        }
                      }}
                      autoComplete="current-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                        spellCheck={false}
                        disabled={deleteProcessing}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showDeletePassword ? 'Hide password' : 'Show password'}
                      >
                        {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <DialogFooter className="mt-4">
                      <Button type="button" variant="ghost" onClick={closePasskeyDialog} disabled={deleteProcessing}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="destructive" disabled={deleteProcessing}>
                        {deleteProcessing ? 'Removing…' : 'Delete'}
                      </Button>
                    </DialogFooter>
                  </form>
                  {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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

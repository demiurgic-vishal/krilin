"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import {
  ArrowLeft,
  Code,
  Eye,
  Save,
  Play,
  FileCode,
  FileJson,
  Upload,
  Loader2,
  CheckCircle2,
  MessageSquare
} from "lucide-react";

// Lazy load Monaco Editor to improve initial page load
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading editor...</div>
});

type FileTab = "frontend" | "backend" | "manifest";

interface AppData {
  id: string;
  name: string;
  description: string;
  status: string;
  manifest: any;
}

export default function AppEditPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params?.app_id as string;
  const { user, loading: authLoading } = useAuth();

  const [app, setApp] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFile, setActiveFile] = useState<FileTab>("frontend");
  const [showPreview, setShowPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authToken, setAuthToken] = useState<string>("");

  // File contents
  const [frontendCode, setFrontendCode] = useState("");
  const [backendCode, setBackendCode] = useState("");
  const [manifestCode, setManifestCode] = useState("");

  // Original contents for comparison
  const [originalFrontend, setOriginalFrontend] = useState("");
  const [originalBackend, setOriginalBackend] = useState("");
  const [originalManifest, setOriginalManifest] = useState("");

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && user && appId) {
      loadApp();
    }
  }, [user, authLoading, router, appId]);

  const loadApp = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      // Load app metadata
      const appResponse = await fetch(`http://localhost:8001/api/v1/apps/drafts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!appResponse.ok) throw new Error('Failed to fetch app');

      const appsData = await appResponse.json();
      const appData = appsData.apps.find((a: any) => a.id === appId);

      if (!appData) {
        throw new Error('App not found');
      }

      setApp(appData);

      // Load app files
      const [frontendRes, backendRes, manifestRes] = await Promise.all([
        fetch(`http://localhost:8001/api/v1/apps/${appId}/files/frontend.tsx`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:8001/api/v1/apps/${appId}/files/backend.py`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:8001/api/v1/apps/${appId}/files/manifest.json`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const frontend = await frontendRes.text();
      const backend = await backendRes.text();
      const manifest = await manifestRes.json();

      setFrontendCode(frontend);
      setBackendCode(backend);
      setManifestCode(JSON.stringify(manifest, null, 2));

      setOriginalFrontend(frontend);
      setOriginalBackend(backend);
      setOriginalManifest(JSON.stringify(manifest, null, 2));

    } catch (err: any) {
      console.error('Failed to load app:', err);
      setError(err.message || 'Failed to load app');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      // Save all modified files
      const savePromises = [];

      if (frontendCode !== originalFrontend) {
        savePromises.push(
          fetch(`http://localhost:8001/api/v1/apps/${appId}/files/frontend.tsx`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: frontendCode })
          }).then(res => {
            if (!res.ok) throw new Error('Failed to save frontend.tsx');
            return res.json();
          })
        );
      }

      if (backendCode !== originalBackend) {
        savePromises.push(
          fetch(`http://localhost:8001/api/v1/apps/${appId}/files/backend.py`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: backendCode })
          }).then(res => {
            if (!res.ok) throw new Error('Failed to save backend.py');
            return res.json();
          })
        );
      }

      if (manifestCode !== originalManifest) {
        savePromises.push(
          fetch(`http://localhost:8001/api/v1/apps/${appId}/files/manifest.json`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: manifestCode })
          }).then(res => {
            if (!res.ok) throw new Error('Failed to save manifest.json');
            return res.json();
          })
        );
      }

      if (savePromises.length === 0) {
        setError('No changes to save');
        setSaving(false);
        return;
      }

      await Promise.all(savePromises);

      // Update originals after successful save
      setOriginalFrontend(frontendCode);
      setOriginalBackend(backendCode);
      setOriginalManifest(manifestCode);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (err: any) {
      console.error('Failed to save:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this app to your library?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`http://localhost:8001/api/v1/apps/${appId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to publish app');
      }

      alert('App published successfully! You can now install it from your library.');
      router.push('/apps?tab=library');

    } catch (err: any) {
      console.error('Failed to publish:', err);
      setError(err.message || 'Failed to publish app');
    }
  };

  const hasUnsavedChanges =
    frontendCode !== originalFrontend ||
    backendCode !== originalBackend ||
    manifestCode !== originalManifest;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-3xl font-[var(--font-head)] mb-4 uppercase">Loading...</div>
          <div className="w-32 h-4 bg-[var(--muted)] mx-auto border-2 border-[var(--border)]">
            <div className="h-full bg-[var(--primary)] pixel-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Card>
          <Card.Content className="py-16 text-center">
            <h2 className="text-2xl font-[var(--font-head)] mb-4 uppercase">App Not Found</h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              {error || "The app you're looking for doesn't exist or you don't have access to it."}
            </p>
            <Link href="/apps">
              <Button>Back to Apps</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const currentCode = activeFile === "frontend" ? frontendCode :
                      activeFile === "backend" ? backendCode :
                      manifestCode;

  const setCurrentCode = (code: string) => {
    if (activeFile === "frontend") setFrontendCode(code);
    else if (activeFile === "backend") setBackendCode(code);
    else setManifestCode(code);
  };

  const getLanguage = () => {
    if (activeFile === "frontend") return "typescript";
    if (activeFile === "backend") return "python";
    return "json";
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/apps?tab=drafts">
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={24} />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-[var(--font-head)] uppercase tracking-wider flex items-center gap-3">
                  <Code size={28} />
                  {app.name}
                </h1>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 uppercase">
                  {app.status} • {app.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <span className="text-xs text-[var(--warning)] font-bold uppercase">
                  Unsaved Changes
                </span>
              )}

              {saveSuccess && (
                <div className="flex items-center gap-2 text-[var(--success)] text-sm">
                  <CheckCircle2 size={16} />
                  <span className="font-bold uppercase">Saved!</span>
                </div>
              )}

              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
              >
                <Eye size={16} className="mr-2" />
                {showPreview ? "Hide" : "Show"} Preview
              </Button>

              <Button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                variant="default"
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save
                  </>
                )}
              </Button>

              <Button
                onClick={handlePublish}
                variant="success"
                size="sm"
              >
                <Upload size={16} className="mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="px-4 sm:px-6 lg:px-8 py-4 bg-[var(--destructive)]/10 border-b-2 border-[var(--destructive)]">
          <p className="text-sm text-[var(--destructive)] font-bold uppercase">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Section */}
        <div className={`flex flex-col ${showPreview ? 'w-1/2' : 'w-full'} border-r-4 border-[var(--border)]`}>
          {/* File Tabs */}
          <div className="flex border-b-2 border-[var(--border)] bg-[var(--card)]">
            <button
              onClick={() => setActiveFile("frontend")}
              className={`flex items-center gap-2 px-4 py-3 border-r-2 border-[var(--border)] font-bold uppercase text-sm transition-colors ${
                activeFile === "frontend"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] hover:bg-[var(--card)]"
              }`}
            >
              <FileCode size={16} />
              frontend.tsx
            </button>
            <button
              onClick={() => setActiveFile("backend")}
              className={`flex items-center gap-2 px-4 py-3 border-r-2 border-[var(--border)] font-bold uppercase text-sm transition-colors ${
                activeFile === "backend"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] hover:bg-[var(--card)]"
              }`}
            >
              <FileCode size={16} />
              backend.py
            </button>
            <button
              onClick={() => setActiveFile("manifest")}
              className={`flex items-center gap-2 px-4 py-3 font-bold uppercase text-sm transition-colors ${
                activeFile === "manifest"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] hover:bg-[var(--card)]"
              }`}
            >
              <FileJson size={16} />
              manifest.json
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={getLanguage()}
              value={currentCode}
              onChange={(value) => setCurrentCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on"
              }}
            />
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="w-1/2 flex flex-col bg-[var(--muted)]">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-2">
                <Play size={16} />
                <span className="font-bold uppercase text-sm">Preview</span>
              </div>
              <Button variant="ghost" size="sm">
                <MessageSquare size={16} className="mr-2" />
                AI Chat
              </Button>
            </div>

            <div className="flex-1 p-4">
              <div className="w-full h-full border-4 border-[var(--border)] bg-white">
                <iframe
                  src={`http://localhost:8001/api/v1/apps/${appId}/preview?token=${authToken}`}
                  className="w-full h-full"
                  title="App Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

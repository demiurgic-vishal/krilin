"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { ArrowLeft, Sparkles, Database, Plug, Lightbulb, Loader2, CheckCircle2, Home } from "lucide-react";

interface Schema {
  table_name: string;
  source_type: string;
  source_id?: number;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  metadata: Record<string, any>;
}

interface Integration {
  name: string;
  description: string;
  category: string;
  icon: string;
  auth_type: string;
  official: boolean;
  tags: string[];
}

export default function GenerateAppPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [appName, setAppName] = useState("");
  const [appId, setAppId] = useState("");
  const [category, setCategory] = useState("productivity");
  const [userRequest, setUserRequest] = useState("");
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedAppId, setGeneratedAppId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoadingInfo(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // TODO: Implement schema discovery and integrations list
      // const [schemasData, integrationsData] = await Promise.all([
      //   discoverSchemas(token),
      //   listIntegrations()
      // ]);
      // setSchemas(schemasData.schemas);
      // setIntegrations(integrationsData.integrations);

      // Placeholder
      setSchemas([]);
      setIntegrations([]);
    } catch (err: any) {
      console.error('Failed to load user data:', err);
    } finally {
      setLoadingInfo(false);
    }
  };

  // Auto-generate app ID from app name
  useEffect(() => {
    if (appName) {
      const id = appName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
      setAppId(id);
    }
  }, [appName]);

  const handleGenerate = async () => {
    if (!userRequest.trim()) {
      setError('Please describe what app you want to create');
      return;
    }

    if (!appName.trim()) {
      setError('Please provide an app name');
      return;
    }

    if (!appId.trim()) {
      setError('Please provide an app ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:8001/api/v1/apps/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: appId,
          prompt: userRequest,
          app_name: appName,
          category: category
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate app');
      }

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setGeneratedAppId(result.app_id);
        setTimeout(() => router.push(`/apps?tab=drafts`), 2000);
      } else {
        setError('Failed to generate app');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate app');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/apps">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider flex items-center gap-3">
                <Sparkles size={32} />
                Generate App
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1 uppercase">
                Describe your app and AI will build it for you
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Generation Card */}
        <Card className="mb-8">
          <Card.Header className="bg-[var(--primary)]">
            <Card.Title>What do you want to build?</Card.Title>
            <Card.Description>
              Describe your app idea in natural language. The AI will generate a complete application with UI, state management, and logic.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase mb-2">
                    App Name *
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="My Awesome App"
                    className="w-full p-3 border-2 border-[var(--border)] bg-[var(--card)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase mb-2">
                    App ID * (auto-generated)
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="my-awesome-app"
                    className="w-full p-3 border-2 border-[var(--border)] bg-[var(--muted)] focus:outline-none focus:border-[var(--primary)] font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border-2 border-[var(--border)] bg-[var(--card)] focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="productivity">Productivity</option>
                  <option value="health">Health & Fitness</option>
                  <option value="finance">Finance</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="education">Education</option>
                  <option value="social">Social</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase mb-2">
                  App Description *
                </label>
                <textarea
                  value={userRequest}
                  onChange={(e) => setUserRequest(e.target.value)}
                  placeholder="E.g., I want to build a reading tracker app that shows my progress across multiple books, lets me set reading goals, and displays statistics about my reading habits..."
                  rows={6}
                  className="w-full p-3 border-2 border-[var(--border)] bg-[var(--card)] focus:outline-none focus:border-[var(--primary)] resize-none"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  Describe what you want your app to do. Be specific about features, data it should track, and how users will interact with it.
                </p>
              </div>

              {/* Example Prompts */}
              <div className="border-t-2 border-[var(--border)] pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={20} />
                  <span className="text-sm font-bold uppercase">Example Ideas:</span>
                </div>
                <div className="grid gap-2">
                  {[
                    "A workout tracker with exercise history and progress charts",
                    "A habit tracker that shows streaks and completion rates",
                    "A meal planner with recipe suggestions and grocery lists",
                    "A budget tracker with expense categories and spending insights"
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setUserRequest(example)}
                      className="text-left p-3 border-2 border-[var(--border)] bg-[var(--muted)] hover:bg-[var(--card)] hover:border-[var(--primary)] transition-all text-sm"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 border-2 border-[var(--destructive)] bg-[var(--destructive)]/10">
                  <p className="text-sm text-[var(--destructive)] font-bold">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 border-2 border-[var(--success)] bg-[var(--success)]/10 flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-[var(--success)]" />
                  <div>
                    <p className="font-bold text-[var(--success)]">App Generated Successfully!</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Redirecting to your apps...</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={loading || !userRequest.trim() || !appName.trim() || !appId.trim()}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Generating App... (This may take 1-2 minutes)
                  </>
                ) : (
                  <>
                    <Sparkles size={20} className="mr-2" />
                    Generate App with AI
                  </>
                )}
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* Available Data Card */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <Card.Header className="bg-[var(--accent)]">
              <div className="flex items-center gap-2">
                <Database size={20} />
                <Card.Title>Available Data Sources</Card.Title>
              </div>
            </Card.Header>
            <Card.Content>
              {loadingInfo ? (
                <div className="text-center py-8 text-[var(--muted-foreground)] uppercase text-sm">
                  Loading...
                </div>
              ) : schemas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[var(--muted-foreground)] mb-4 text-sm">
                    No data sources connected yet
                  </p>
                  <Link href="/data-sources">
                    <Button variant="outline" size="sm">
                      Connect Data Sources
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {schemas.map((schema, idx) => (
                    <div key={idx} className="p-2 border-2 border-[var(--border)] bg-[var(--muted)] text-sm">
                      <div className="font-bold uppercase">{schema.table_name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {schema.fields.length} fields
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="bg-[var(--info)]">
              <div className="flex items-center gap-2">
                <Plug size={20} />
                <Card.Title>Available Integrations</Card.Title>
              </div>
            </Card.Header>
            <Card.Content>
              {loadingInfo ? (
                <div className="text-center py-8 text-[var(--muted-foreground)] uppercase text-sm">
                  Loading...
                </div>
              ) : integrations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[var(--muted-foreground)] mb-4 text-sm">
                    No integrations available
                  </p>
                  <Link href="/integrations">
                    <Button variant="outline" size="sm">
                      Browse Integrations
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {integrations.slice(0, 5).map((integration, idx) => (
                    <div key={idx} className="p-2 border-2 border-[var(--border)] bg-[var(--muted)] text-sm">
                      <div className="font-bold uppercase">{integration.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {integration.category}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </main>
    </div>
  );
}

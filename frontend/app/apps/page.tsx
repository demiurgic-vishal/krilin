"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Sparkles, Plus, Search, Clock, Package, Zap, Home, Download, Loader2, CheckCircle2 } from "lucide-react";

interface App {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  icon?: string;
  category?: string;
  tags?: string[];
  installed_at?: string;
  status?: string;
  is_official?: boolean;
}

type TabType = "my-apps" | "browse";

export default function AppsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("my-apps");
  const [myApps, setMyApps] = useState<App[]>([]);
  const [availableApps, setAvailableApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [installing, setInstalling] = useState<Set<string>>(new Set());

  const loadMyApps = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:8001/api/v1/apps', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }

      const data = await response.json();
      setMyApps(data.apps || []);
    } catch (err: any) {
      console.error('Failed to load my apps:', err);
      setMyApps([]);
    }
  }, []);

  const loadAvailableApps = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:8001/api/v1/apps/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available apps');
      }

      const data = await response.json();
      setAvailableApps(data.apps || []);
    } catch (err: any) {
      console.error('Failed to load available apps:', err);
      setAvailableApps([]);
    }
  }, []);

  const loadApps = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadMyApps(), loadAvailableApps()]);
    setLoading(false);
  }, [loadMyApps, loadAvailableApps]);

  const handleInstall = async (appId: string) => {
    try {
      setInstalling(prev => new Set(prev).add(appId));
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:8001/api/v1/apps/${appId}/install`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to install app');
      }

      // Reload apps
      await loadApps();
      alert('App installed successfully!');
    } catch (err: any) {
      console.error('Failed to install app:', err);
      alert(`Failed to install app: ${err.message}`);
    } finally {
      setInstalling(prev => {
        const newSet = new Set(prev);
        newSet.delete(appId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && user) {
      loadApps();
    }
  }, [user, authLoading, router, loadApps]);

  useEffect(() => {
    const currentApps = activeTab === "my-apps" ? myApps : availableApps;

    if (searchQuery.trim() === "") {
      setFilteredApps(currentApps);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = currentApps.filter(
        (app) =>
          app.name.toLowerCase().includes(query) ||
          app.description.toLowerCase().includes(query) ||
          app.category?.toLowerCase().includes(query) ||
          app.tags?.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredApps(filtered);
    }
  }, [searchQuery, activeTab, myApps, availableApps]);

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

  const activeCount = myApps.filter(app => app.status === 'installed').length;
  const installedAppIds = new Set(myApps.map(app => app.id));

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <Home size={24} />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider flex items-center gap-3">
                  <Sparkles size={32} />
                  Apps
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1 uppercase">
                  AI-Generated Applications with UI & State
                </p>
              </div>
            </div>
            <Link href="/apps/new">
              <Button size="lg">
                <Plus size={20} className="mr-2" />
                Generate App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          <Button
            onClick={() => setActiveTab("my-apps")}
            variant={activeTab === "my-apps" ? "default" : "outline"}
            size="md"
          >
            <Package size={16} className="mr-2" />
            My Apps ({myApps.length})
          </Button>
          <Button
            onClick={() => setActiveTab("browse")}
            variant={activeTab === "browse" ? "default" : "outline"}
            size="md"
          >
            <Search size={16} className="mr-2" />
            Browse Apps ({availableApps.length})
          </Button>
        </div>

        {/* Stats - Only show on My Apps */}
        {activeTab === "my-apps" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="border-2 border-[var(--border)] bg-[var(--accent)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{myApps.length}</div>
                  <div className="text-sm uppercase font-medium">Total Apps</div>
                </div>
                <Package size={48} className="opacity-50" />
              </div>
            </div>

            <div className="border-2 border-[var(--border)] bg-[var(--primary)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{activeCount}</div>
                  <div className="text-sm uppercase font-medium">Active</div>
                </div>
                <Zap size={48} className="opacity-50" />
              </div>
            </div>

            <div className="border-2 border-[var(--border)] bg-[var(--muted)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{myApps.length - activeCount}</div>
                  <div className="text-sm uppercase font-medium">Inactive</div>
                </div>
                <Clock size={48} className="opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2" size={20} />
            <input
              type="text"
              placeholder="SEARCH APPS BY NAME, DESCRIPTION, OR CATEGORY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-[var(--border)] bg-[var(--card)] focus:outline-none focus:border-[var(--primary)] uppercase placeholder:text-[var(--muted-foreground)] font-medium"
            />
          </div>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-[var(--muted-foreground)] uppercase">Loading apps...</div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-12">
            {(activeTab === "my-apps" && myApps.length === 0) ? (
              <Card>
                <Card.Content className="py-16">
                  <Sparkles size={64} className="mx-auto mb-6 opacity-50" />
                  <h2 className="text-2xl font-[var(--font-head)] mb-4 uppercase">No Apps Yet</h2>
                  <p className="text-[var(--muted-foreground)] mb-8 max-w-md mx-auto">
                    Browse available apps or generate your first AI-powered app. Describe what you want to build, and AI will create a custom application with UI, state management, and logic.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button size="lg" onClick={() => setActiveTab("browse")}>
                      <Search size={20} className="mr-2" />
                      Browse Apps
                    </Button>
                    <Link href="/apps/new">
                      <Button size="lg" variant="success">
                        <Plus size={20} className="mr-2" />
                        Generate App
                      </Button>
                    </Link>
                  </div>
                </Card.Content>
              </Card>
            ) : (
              <div className="text-[var(--muted-foreground)] uppercase">
                No apps match your search. Try a different query.
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => {
              const isInstalled = installedAppIds.has(app.id);
              const isInstalling = installing.has(app.id);
              const isBrowseTab = activeTab === "browse";

              return (
                <div key={app.id} className="p-6 border-2 border-[var(--border)] bg-[var(--card)] hover:shadow-[8px_8px_0_0_var(--border)] transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {app.icon && (
                        <span className="text-3xl">{app.icon}</span>
                      )}
                      {isBrowseTab ? (
                        isInstalled ? (
                          <div className="px-2 py-1 border-2 border-[var(--border)] uppercase text-xs font-bold bg-[var(--success)] flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Installed
                          </div>
                        ) : app.is_official && (
                          <div className="px-2 py-1 border-2 border-[var(--border)] uppercase text-xs font-bold bg-[var(--primary)]">
                            Official
                          </div>
                        )
                      ) : (
                        <div className={`px-2 py-1 border-2 border-[var(--border)] uppercase text-xs font-bold ${
                          app.status === 'installed' ? 'bg-[var(--success)]' : 'bg-[var(--muted)]'
                        }`}>
                          {app.status === 'installed' ? "Active" : app.status || "Inactive"}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] font-mono">v{app.version}</span>
                  </div>

                  <h3 className="text-xl font-bold mb-2 uppercase line-clamp-1">{app.name}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-4 flex-grow">{app.description}</p>

                  <div className="space-y-2 pt-4 border-t-2 border-[var(--border)]">
                    {app.category && (
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 border-2 border-[var(--border)] bg-[var(--muted)] text-xs font-bold uppercase">
                          {app.category}
                        </div>
                      </div>
                    )}
                    {app.author && (
                      <div className="text-xs text-[var(--muted-foreground)] uppercase">
                        BY {app.author}
                      </div>
                    )}
                    {app.installed_at && (
                      <div className="text-xs text-[var(--muted-foreground)] uppercase">
                        Installed {new Date(app.installed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 pt-4 border-t-2 border-[var(--border)] flex gap-2">
                    {isBrowseTab ? (
                      isInstalled ? (
                        <Link href={`/apps/${app.id}`} className="flex-1">
                          <Button variant="success" className="w-full" size="sm">
                            Open App
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            handleInstall(app.id);
                          }}
                          disabled={isInstalling}
                          variant="default"
                          className="w-full"
                          size="sm"
                        >
                          {isInstalling ? (
                            <>
                              <Loader2 className="mr-2 animate-spin" size={16} />
                              Installing...
                            </>
                          ) : (
                            <>
                              <Download size={16} className="mr-2" />
                              Install
                            </>
                          )}
                        </Button>
                      )
                    ) : (
                      <Link href={`/apps/${app.id}`} className="flex-1">
                        <Button variant="default" className="w-full" size="sm">
                          Open App
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

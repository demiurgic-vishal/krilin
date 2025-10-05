"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getDataSources,
  getDataSourceStats,
  triggerSync,
  deleteDataSource,
  initiateGoogleCalendar,
  initiateGmail,
  initiateWhoop,
  initiateStrava,
  DataSource,
  DataSourceStats,
} from "@/lib/api/data-sources";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import {
  Home,
  Database,
  RefreshCw,
  Trash2,
  Calendar,
  Mail,
  Activity,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Sparkles,
  Loader2,
} from "lucide-react";

const INTEGRATION_CONFIG = {
  google_calendar: {
    name: "Google Calendar",
    icon: Calendar,
    color: "bg-[var(--primary)]",
    description: "Sync your calendar events",
  },
  gmail: {
    name: "Gmail",
    icon: Mail,
    color: "bg-[var(--destructive)]",
    description: "Connect your email",
  },
  whoop: {
    name: "Whoop",
    icon: Activity,
    color: "bg-[var(--success)]",
    description: "Track your fitness data",
  },
  strava: {
    name: "Strava",
    icon: Zap,
    color: "bg-[var(--warning)]",
    description: "Connect your activities",
  },
};

export default function DataSourcesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [stats, setStats] = useState<DataSourceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<Set<number>>(new Set());
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const service = localStorage.getItem('oauth_service');

    if (code && service) {
      localStorage.removeItem('oauth_service');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const [sourcesData, statsData] = await Promise.all([
        getDataSources(token),
        getDataSourceStats(token),
      ]);

      setDataSources(sourcesData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data sources');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (sourceId: number) => {
    try {
      setSyncing(prev => new Set(prev).add(sourceId));
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      await triggerSync(sourceId, token, false);
      setSuccess('Sync started successfully');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to sync');
    } finally {
      setSyncing(prev => {
        const newSet = new Set(prev);
        newSet.delete(sourceId);
        return newSet;
      });
    }
  };

  const handleDelete = async (sourceId: number) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;

    try {
      setDeleting(prev => new Set(prev).add(sourceId));
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      await deleteDataSource(sourceId, token);
      setSuccess('Data source deleted successfully');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(sourceId);
        return newSet;
      });
    }
  };

  const handleConnect = async (type: 'google_calendar' | 'gmail' | 'whoop' | 'strava') => {
    try {
      setConnecting(type);
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const redirectUri = `${window.location.origin}/data-sources`;
      let result;

      if (type === 'google_calendar') {
        result = await initiateGoogleCalendar(redirectUri, token);
      } else if (type === 'gmail') {
        result = await initiateGmail(redirectUri, token);
      } else if (type === 'whoop') {
        result = await initiateWhoop(redirectUri, token);
      } else if (type === 'strava') {
        result = await initiateStrava(redirectUri, token);
      }

      if (result) {
        localStorage.setItem('oauth_service', type);
        window.location.href = result.authorization_url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate connection');
      setConnecting(null);
    }
  };

  if (authLoading || !user || loading) {
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

  const connectedSources = dataSources.filter(s => s.is_active);
  const availableIntegrations = Object.entries(INTEGRATION_CONFIG).filter(
    ([key]) => !connectedSources.some(s => s.source_type === key)
  );

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <Home size={24} />
                </Button>
              </Link>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                Data Sources
              </h1>
            </div>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 border-2 border-[var(--border)] bg-[var(--destructive)] text-[var(--destructive-foreground)] shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center gap-2">
              <XCircle size={20} />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 border-2 border-[var(--border)] bg-[var(--success)] text-black shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} />
              <p className="font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="border-2 border-[var(--border)] bg-[var(--accent)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{stats.total_sources}</div>
                  <div className="text-sm uppercase font-medium">Total Sources</div>
                </div>
                <Database size={48} className="opacity-50" />
              </div>
            </div>

            <div className="border-2 border-[var(--border)] bg-[var(--primary)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{stats.active_sources}</div>
                  <div className="text-sm uppercase font-medium">Active</div>
                </div>
                <CheckCircle2 size={48} className="opacity-50" />
              </div>
            </div>

            <div className="border-2 border-[var(--border)] bg-[var(--success)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{(stats.total_records || 0).toLocaleString()}</div>
                  <div className="text-sm uppercase font-medium">Total Records</div>
                </div>
                <Sparkles size={48} className="opacity-50" />
              </div>
            </div>

            <div className="border-2 border-[var(--border)] bg-[var(--warning)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1 text-xs">
                    {stats.last_sync ? new Date(stats.last_sync).toLocaleDateString() : 'Never'}
                  </div>
                  <div className="text-sm uppercase font-medium">Last Sync</div>
                </div>
                <Clock size={48} className="opacity-50" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Connected Sources */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Header className="bg-[var(--primary)]">
                <Card.Title>Connected Sources</Card.Title>
                <Card.Description>Your active data connections</Card.Description>
              </Card.Header>
              <Card.Content>
                {connectedSources.length === 0 ? (
                  <div className="text-center py-12">
                    <Database size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-[var(--muted-foreground)] mb-4">No data sources connected yet</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Connect an integration from the sidebar to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connectedSources.map((source) => {
                      const config = INTEGRATION_CONFIG[source.source_type as keyof typeof INTEGRATION_CONFIG];
                      if (!config) return null;

                      const Icon = config.icon;
                      const isSyncing = syncing.has(source.id);
                      const isDeleting = deleting.has(source.id);

                      return (
                        <Link href={`/data-sources/${source.id}`} key={source.id}>
                          <div className="p-4 border-2 border-[var(--border)] hover:shadow-[4px_4px_0_0_var(--border)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-3 ${config.color} border-2 border-[var(--border)]`}>
                                  <Icon size={24} />
                                </div>
                                <div>
                                  <div className="font-bold uppercase">{config.name}</div>
                                  <div className="text-sm text-[var(--muted-foreground)]">
                                    {source.record_count?.toLocaleString() || 0} records
                                  </div>
                                  {source.last_sync_at && (
                                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                                      Last synced: {new Date(source.last_sync_at).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSync(source.id)}
                                  disabled={isSyncing}
                                >
                                  {isSyncing ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <RefreshCw size={16} />
                                  )}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(source.id)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* Available Integrations */}
          <div>
            <Card>
              <Card.Header className="bg-[var(--accent)]">
                <Card.Title>Available Integrations</Card.Title>
                <Card.Description>Connect new data sources</Card.Description>
              </Card.Header>
              <Card.Content>
                {availableIntegrations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 size={32} className="mx-auto mb-3 text-[var(--success)]" />
                    <p className="text-sm text-[var(--muted-foreground)]">
                      All integrations connected!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableIntegrations.map(([key, config]) => {
                      const Icon = config.icon;
                      const isConnecting = connecting === key;

                      return (
                        <div
                          key={key}
                          className="p-4 border-2 border-[var(--border)]"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 ${config.color} border-2 border-[var(--border)]`}>
                              <Icon size={20} />
                            </div>
                            <div>
                              <div className="font-bold text-sm uppercase">{config.name}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                {config.description}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleConnect(key as any)}
                            disabled={isConnecting}
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Plus size={16} className="mr-2" />
                                Connect
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

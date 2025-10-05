"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getDataSource,
  getDataSourceRecords,
  getSyncHistory,
  triggerSync,
  deleteDataSource,
  DataSource,
  DataRecord,
  SyncHistory,
} from "@/lib/api/data-sources";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Mail,
  Activity,
  Loader2,
} from "lucide-react";

const INTEGRATION_ICONS = {
  google_calendar: Calendar,
  gmail: Mail,
  whoop: Activity,
  strava: Activity,
};

export default function DataSourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sourceId = parseInt(params.id as string);
  const { user, loading: authLoading } = useAuth();

  const [source, setSource] = useState<DataSource | null>(null);
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsPage, setRecordsPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'history'>('records');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, sourceId, recordsPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const [sourceData, recordsData, historyData] = await Promise.all([
        getDataSource(sourceId, token),
        getDataSourceRecords(sourceId, token, 20, recordsPage * 20),
        getSyncHistory(token, sourceId, 10),
      ]);

      setSource(sourceData);
      setRecords(recordsData.records || []);
      setRecordsTotal(recordsData.total || 0);
      setSyncHistory(historyData || []);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data source');
      setRecords([]);
      setSyncHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      await triggerSync(sourceId, token);
      await loadData();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${source?.name}? This will remove all synced data.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      await deleteDataSource(sourceId, token);
      router.push('/data-sources');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
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

  if (error || !source) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle size={64} className="mx-auto mb-4 text-[var(--destructive)]" />
          <p className="text-[var(--muted-foreground)] mb-6 text-lg">{error || 'Data source not found'}</p>
          <Link href="/data-sources">
            <Button variant="outline">Back to Data Sources</Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = INTEGRATION_ICONS[source.source_type as keyof typeof INTEGRATION_ICONS] || Database;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/data-sources">
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={24} />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--primary)] border-2 border-[var(--border)]">
                  <Icon size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">{source.name}</h1>
                  <p className="text-sm text-[var(--muted-foreground)] uppercase mt-1">{source.source_type}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 border-2 border-[var(--border)] uppercase text-xs font-bold ${
                source.status === 'active' ? 'bg-[var(--success)]' : 'bg-[var(--muted)]'
              }`}>
                {source.status}
              </div>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                {syncing ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                Sync Now
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Stats Cards */}
          <div className="border-2 border-[var(--border)] bg-[var(--primary)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">
                  {source.sync_frequency ? `${source.sync_frequency / 3600}h` : 'Manual'}
                </div>
                <div className="text-sm uppercase font-medium">Sync Frequency</div>
              </div>
              <RefreshCw size={48} className="opacity-50" />
            </div>
          </div>

          <div className="border-2 border-[var(--border)] bg-[var(--accent)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold mb-1">
                  {source.last_sync_at
                    ? new Date(source.last_sync_at).toLocaleDateString()
                    : 'Never'}
                </div>
                <div className="text-sm uppercase font-medium">Last Sync</div>
              </div>
              <Clock size={48} className="opacity-50" />
            </div>
          </div>

          <div className="border-2 border-[var(--border)] bg-[var(--info)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">{recordsTotal.toLocaleString()}</div>
                <div className="text-sm uppercase font-medium">Total Records</div>
              </div>
              <Database size={48} className="opacity-50" />
            </div>
          </div>
        </div>

        {/* Custom Retro Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-3 border-2 border-[var(--border)] uppercase font-bold transition-all ${
              activeTab === 'records'
                ? 'bg-[var(--primary)] shadow-[4px_4px_0_0_var(--border)] translate-x-[-2px] translate-y-[-2px]'
                : 'bg-[var(--card)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
            }`}
          >
            Records
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 border-2 border-[var(--border)] uppercase font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[var(--primary)] shadow-[4px_4px_0_0_var(--border)] translate-x-[-2px] translate-y-[-2px]'
                : 'bg-[var(--card)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
            }`}
          >
            Sync History
          </button>
        </div>

        {/* Records Tab */}
        {activeTab === 'records' && (
          <Card>
            <Card.Header className="bg-[var(--accent)]">
              <Card.Title>Synced Records</Card.Title>
              <Card.Description>Data synced from {source.name}</Card.Description>
            </Card.Header>
            <Card.Content>
              {records.length === 0 ? (
                <div className="text-center py-12">
                  <Database size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-[var(--muted-foreground)]">No records synced yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <div key={record.id} className="p-4 border-2 border-[var(--border)] bg-[var(--card)]">
                      <div className="flex items-start justify-between mb-3">
                        <div className="font-bold uppercase text-sm">{record.record_type}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-[var(--muted)] p-3 border-2 border-[var(--border)] text-xs font-mono overflow-x-auto">
                        <pre>{JSON.stringify(record.data, null, 2)}</pre>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {recordsTotal > 20 && (
                    <div className="flex justify-between items-center pt-4 border-t-2 border-[var(--border)]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRecordsPage(Math.max(0, recordsPage - 1))}
                        disabled={recordsPage === 0}
                      >
                        Previous
                      </Button>
                      <div className="text-sm font-bold">
                        Page {recordsPage + 1} of {Math.ceil(recordsTotal / 20)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRecordsPage(recordsPage + 1)}
                        disabled={(recordsPage + 1) * 20 >= recordsTotal}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Sync History Tab */}
        {activeTab === 'history' && (
          <Card>
            <Card.Header className="bg-[var(--info)]">
              <Card.Title>Sync History</Card.Title>
              <Card.Description>Recent synchronization events</Card.Description>
            </Card.Header>
            <Card.Content>
              {syncHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-[var(--muted-foreground)]">No sync history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {syncHistory.map((sync) => {
                    const StatusIcon =
                      sync.status === 'completed'
                        ? CheckCircle2
                        : sync.status === 'failed'
                        ? XCircle
                        : Clock;

                    const statusBg =
                      sync.status === 'completed'
                        ? 'bg-[var(--success)]'
                        : sync.status === 'failed'
                        ? 'bg-[var(--destructive)]'
                        : 'bg-[var(--warning)]';

                    return (
                      <div key={sync.id} className="flex items-start gap-4 p-4 border-2 border-[var(--border)] bg-[var(--card)]">
                        <div className={`p-2 ${statusBg} border-2 border-[var(--border)]`}>
                          <StatusIcon size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className={`px-2 py-1 border-2 border-[var(--border)] uppercase text-xs font-bold ${statusBg}`}>
                              {sync.status}
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {new Date(sync.started_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm font-bold">
                            {sync.records_synced} records synced
                          </div>
                          {sync.error_message && (
                            <div className="text-sm text-[var(--destructive)] mt-2 p-2 border-2 border-[var(--destructive)] bg-[var(--destructive)]/10">
                              {sync.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Content>
          </Card>
        )}
      </main>
    </div>
  );
}

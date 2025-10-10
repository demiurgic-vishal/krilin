"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { AppRunner } from "@/components/AppRunner";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

interface AppData {
  id: string;
  name: string;
  description: string;
  status: string;
}

export default function AppRuntimePage() {
  const router = useRouter();
  const params = useParams();
  const appId = params?.app_id as string;
  const { user, loading: authLoading } = useAuth();

  const [app, setApp] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string>("");

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

      // Check if this is an official platform app with a hardcoded page
      const hardcodedApps: Record<string, string> = {
        'habit-tracker': '/apps/habit-tracker',
        'torrent-streamer': '/apps/torrent-streamer',
        'calendar-events': '/apps/calendar-events',
        'journal': '/apps/journal'
      };

      if (hardcodedApps[appId]) {
        // Redirect to the hardcoded page
        router.push(hardcodedApps[appId]);
        return;
      }

      // Check if app is installed
      const installedResponse = await fetch('http://localhost:8001/api/v1/apps', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!installedResponse.ok) throw new Error('Failed to fetch installed apps');

      const installedData = await installedResponse.json();
      const installedApp = installedData.apps.find((a: any) => a.id === appId);

      if (!installedApp) {
        throw new Error('App not found in your workspace. Please install it first.');
      }

      setApp(installedApp);
    } catch (err: any) {
      console.error('Failed to load app:', err);
      setError(err.message || 'Failed to load app');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 animate-spin" />
          <div className="text-xl font-[var(--font-head)] uppercase">Loading App...</div>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Card>
          <Card.Content className="py-16 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-[var(--destructive)]" />
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

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/apps">
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={24} />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-[var(--font-head)] uppercase tracking-wider">
                  {app.name}
                </h1>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 uppercase">
                  {app.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* App Content */}
      <div className="flex-1 p-6 overflow-auto">
        <AppRunner
          appId={appId}
          authToken={authToken}
          onError={(error) => setError(error)}
        />
      </div>
    </div>
  );
}

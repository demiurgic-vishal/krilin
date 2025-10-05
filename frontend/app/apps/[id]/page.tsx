"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { getWorkflow, uninstallWorkflow } from "@/lib/api/workflows";
import { DeclarativeUIRenderer } from "@/components/workflows/declarative-ui-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Trash2, Settings, ExternalLink } from "lucide-react";

interface Workflow {
  id: number;
  name: string;
  description: string;
  version: string;
  manifest: {
    metadata: {
      name: string;
      version: string;
      description: string;
      author?: string;
      icon?: string;
    };
    data_requirements: Array<{
      name: string;
      description: string;
      schema: Record<string, string>;
    }>;
    ui_components: Array<{
      id: string;
      name: string;
      description: string;
      schema: any;
    }>;
    triggers?: Array<{
      type: string;
      name: string;
      config: Record<string, any>;
    }>;
  };
  field_mappings: Record<string, {
    data_source_id: number;
    data_source_name: string;
    table_name: string;
    field_map: Record<string, string>;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AIWorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = parseInt(params.id as string);
  const { user, loading: authLoading } = useAuth();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowData, setWorkflowData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadWorkflow();
    }
  }, [user, workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const data = await getWorkflow(workflowId, token);
      setWorkflow(data);

      // Initialize workflow data context
      setWorkflowData({
        workflow: {
          name: data.name,
          version: data.version,
          is_active: data.is_active
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async () => {
    if (!confirm('Are you sure you want to uninstall this workflow? This will remove all configuration and data mappings.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      await uninstallWorkflow(workflowId, token);
      router.push('/apps');
    } catch (err: any) {
      alert(`Failed to uninstall workflow: ${err.message}`);
    }
  };

  const handleWorkflowAction = async (action: string, data: any) => {
    console.log('Workflow action triggered:', action, data);
    // TODO: Implement workflow action execution
    // This would call the workflow execution API with the action and data
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-muted-foreground">Loading workflow...</div>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">{error || 'Workflow not found'}</p>
          <Link href="/apps">
            <Button>Back to AI Workflows</Button>
          </Link>
        </div>
      </div>
    );
  }

  const metadata = workflow.manifest.metadata;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/apps">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                {metadata.icon && <span className="text-3xl">{metadata.icon}</span>}
                <div>
                  <h1 className="text-2xl font-bold">{metadata.name}</h1>
                  <p className="text-sm text-muted-foreground">v{metadata.version}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={workflow.is_active ? "default" : "secondary"}>
                {workflow.is_active ? "Active" : "Inactive"}
              </Badge>
              <Button variant="destructive" size="sm" onClick={handleUninstall}>
                <Trash2 className="h-4 w-4 mr-2" />
                Uninstall
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Workflow UI */}
          <div className="lg:col-span-2 space-y-6">
            {workflow.manifest.ui_components && workflow.manifest.ui_components.length > 0 ? (
              workflow.manifest.ui_components.map((component) => (
                <div key={component.id} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">{component.name}</h2>
                    {component.description && (
                      <p className="text-sm text-muted-foreground">{component.description}</p>
                    )}
                  </div>
                  <DeclarativeUIRenderer
                    schema={component.schema}
                    data={workflowData}
                    onAction={handleWorkflowAction}
                  />
                </div>
              ))
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No UI Components</CardTitle>
                  <CardDescription>
                    This workflow doesn't have any UI components defined yet.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Sidebar - Workflow Info */}
          <div className="space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{metadata.description}</p>
                </div>
                {metadata.author && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Author</div>
                    <div className="text-sm">{metadata.author}</div>
                  </div>
                )}
                <Separator />
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Installed</div>
                  <div className="text-sm">{new Date(workflow.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Last Updated</div>
                  <div className="text-sm">{new Date(workflow.updated_at).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>

            {/* Data Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Data Sources</CardTitle>
                <CardDescription>Connected data for this workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(workflow.field_mappings).map(([reqName, mapping]) => (
                  <div key={reqName} className="p-3 bg-muted rounded-lg">
                    <div className="font-medium text-sm mb-1">{reqName}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {mapping.data_source_name} / {mapping.table_name}
                    </div>
                  </div>
                ))}
                {Object.keys(workflow.field_mappings).length === 0 && (
                  <p className="text-sm text-muted-foreground">No data sources connected</p>
                )}
              </CardContent>
            </Card>

            {/* Triggers */}
            {workflow.manifest.triggers && workflow.manifest.triggers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Triggers</CardTitle>
                  <CardDescription>When this workflow runs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workflow.manifest.triggers.map((trigger, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{trigger.type}</Badge>
                      <span className="text-muted-foreground">{trigger.name}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <Link href={`/apps/${workflowId}/settings`}>
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Workflow Settings
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

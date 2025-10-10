"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Input } from "@/components/retroui/Input";
import { Badge } from "@/components/retroui/Badge";
import { Text } from "@/components/retroui/Text";
import { Textarea } from "@/components/retroui/Textarea";
import { Loader2, AlertCircle } from "lucide-react";

interface AppRunnerProps {
  appId: string;
  authToken: string;
  onError?: (error: string) => void;
}

interface Manifest {
  name: string;
  description?: string;
  version?: string;
}

/**
 * AppRunner - Unified component for running user-generated apps
 *
 * This component:
 * 1. Fetches TSX code from backend
 * 2. Transforms imports to use platform components
 * 3. Compiles TSX to JS using Babel
 * 4. Renders the app in-page (no iframe)
 * 5. Provides Krilin SDK access
 *
 * Used for both preview and installed apps.
 */
export function AppRunner({ appId, authToken, onError }: AppRunnerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [compiledApp, setCompiledApp] = useState<{code: string; sdk: any} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const babelLoadedRef = useRef(false);

  // Load and compile app
  useEffect(() => {
    loadAndRunApp();
  }, [appId, authToken]);

  // Render app when container is ready and app is compiled
  useEffect(() => {
    if (compiledApp && containerRef.current) {
      console.log('[AppRunner] Container ready, rendering app');
      renderApp(compiledApp.code, compiledApp.sdk);
    }
  }, [compiledApp, containerRef.current]);

  const loadBabel = (): Promise<void> => {
    if (babelLoadedRef.current) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).Babel) {
        babelLoadedRef.current = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@babel/standalone@7.23.5/babel.min.js';
      script.async = true;
      script.onload = () => {
        babelLoadedRef.current = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Babel'));
      document.head.appendChild(script);
    });
  };

  const loadAndRunApp = async () => {
    try {
      console.log('[AppRunner] Starting loadAndRunApp for app:', appId);
      setLoading(true);
      setError(null);

      // Load Babel if not already loaded
      console.log('[AppRunner] Loading Babel...');
      await loadBabel();
      console.log('[AppRunner] Babel loaded');

      // Fetch manifest and frontend code in parallel
      console.log('[AppRunner] Fetching app files...');
      const [manifestResponse, frontendResponse] = await Promise.all([
        fetch(`http://localhost:8001/api/v1/apps/${appId}/files/manifest.json`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`http://localhost:8001/api/v1/apps/${appId}/files/frontend.tsx`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      console.log('[AppRunner] Manifest response:', manifestResponse.status);
      console.log('[AppRunner] Frontend response:', frontendResponse.status);

      if (!manifestResponse.ok || !frontendResponse.ok) {
        throw new Error('Failed to load app files');
      }

      const manifestData: Manifest = await manifestResponse.json();
      const tsxCode = await frontendResponse.text();

      console.log('[AppRunner] Manifest:', manifestData);
      console.log('[AppRunner] TSX code length:', tsxCode.length);

      setManifest(manifestData);

      // Transform the TSX code
      console.log('[AppRunner] Transforming code...');
      const transformedCode = transformAppCode(tsxCode);
      console.log('[AppRunner] Transformed code length:', transformedCode.length);

      // Compile with Babel
      console.log('[AppRunner] Compiling with Babel...');
      const Babel = (window as any).Babel;
      if (!Babel) {
        throw new Error('Babel not loaded');
      }
      const compiled = Babel.transform(transformedCode, {
        presets: ['react', 'typescript'],
        filename: 'app.tsx'
      }).code;
      console.log('[AppRunner] Compiled successfully, code length:', compiled.length);

      // Create Krilin SDK
      console.log('[AppRunner] Creating Krilin SDK...');
      const krilinSDK = createKrilinSDK(appId, authToken);
      (window as any).krilin = krilinSDK;
      console.log('[AppRunner] Krilin SDK created');

      // Store compiled app - rendering will happen when container is ready
      console.log('[AppRunner] Storing compiled app for rendering');
      setCompiledApp({ code: compiled, sdk: krilinSDK });

      setLoading(false);
      console.log('[AppRunner] loadAndRunApp complete');
    } catch (err: any) {
      console.error('[AppRunner] Failed to load app:', err);
      console.error('[AppRunner] Error stack:', err.stack);
      const errorMessage = err.message || 'Failed to load app';
      setError(errorMessage);
      onError?.(errorMessage);
      setLoading(false);
    }
  };

  const transformAppCode = (code: string): string => {
    // Remove problematic imports and transform to use provided components
    let transformed = code;

    // Remove imports - we'll provide components via execution context
    transformed = transformed.replace(/import\s+.*?from\s+['"]@\/components\/ui['"];?\s*/g, '');
    transformed = transformed.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');

    // Remove export default
    transformed = transformed.replace(/export\s+default\s+/, '');

    return transformed;
  };

  const createKrilinSDK = (appId: string, token: string) => {
    return {
      actions: {
        call: async (name: string, params: any) => {
          const response = await fetch(`http://localhost:8001/api/v1/apps/${appId}/actions/${name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ parameters: params })
          });
          if (!response.ok) {
            throw new Error(`Action ${name} failed: ${response.statusText}`);
          }
          return response.json();
        }
      },
      storage: {
        query: async (table: string, filters?: any) => {
          const response = await fetch(`http://localhost:8001/api/v1/apps/${appId}/storage/${table}/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ filters: filters || {} })
          });
          if (!response.ok) {
            throw new Error(`Storage query failed: ${response.statusText}`);
          }
          return response.json();
        },
        insert: async (table: string, data: any) => {
          const response = await fetch(`http://localhost:8001/api/v1/apps/${appId}/storage/${table}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
          });
          if (!response.ok) {
            throw new Error(`Storage insert failed: ${response.statusText}`);
          }
          return response.json();
        },
        update: async (table: string, id: number, data: any) => {
          const response = await fetch(`http://localhost:8001/api/v1/apps/${appId}/storage/${table}/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
          });
          if (!response.ok) {
            throw new Error(`Storage update failed: ${response.statusText}`);
          }
          return response.json();
        },
        delete: async (table: string, id: number) => {
          const response = await fetch(`http://localhost:8001/api/v1/apps/${appId}/storage/${table}/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
            throw new Error(`Storage delete failed: ${response.statusText}`);
          }
          return response.json();
        }
      }
    };
  };

  const renderApp = (compiledCode: string, krilinSDK: any) => {
    try {
      console.log('[AppRunner] Starting renderApp');
      console.log('[AppRunner] Compiled code length:', compiledCode.length);

      // Create a function that executes the compiled code with proper context
      // Provide all necessary dependencies as parameters
      const AppComponent = new Function(
        'React',
        'useState',
        'useEffect',
        'useRef',
        'Card',
        'Button',
        'Input',
        'Badge',
        'Text',
        'Textarea',
        'krilin',
        `
        ${compiledCode}

        // Find the app component function
        // It's either named export or default export or just a function
        // Try common patterns
        if (typeof app1App === 'function') {
          console.log('[AppRunner] Found app1App component');
          return app1App;
        }
        if (typeof App === 'function') {
          console.log('[AppRunner] Found App component');
          return App;
        }
        if (typeof Component === 'function') {
          console.log('[AppRunner] Found Component');
          return Component;
        }

        // If none found, look for any function that starts with uppercase
        const functionNames = Object.keys(this).filter(k => /^[A-Z]/.test(k) && typeof this[k] === 'function');
        console.log('[AppRunner] Found function names:', functionNames);
        if (functionNames.length > 0) return this[functionNames[0]];

        throw new Error('Could not find app component');
        `
      )(
        React,
        useState,
        useEffect,
        useRef,
        Card,
        Button,
        Input,
        Badge,
        Text,
        Textarea,
        krilinSDK
      );

      console.log('[AppRunner] AppComponent:', AppComponent);
      console.log('[AppRunner] Container ref:', containerRef.current);

      // Render the component
      if (containerRef.current && AppComponent) {
        console.log('[AppRunner] Rendering app component');
        import('react-dom/client').then((ReactDOM) => {
          if (containerRef.current) {
            console.log('[AppRunner] Creating root and rendering');
            const root = ReactDOM.createRoot(containerRef.current);
            root.render(React.createElement(AppComponent));
            console.log('[AppRunner] Render complete');
          }
        }).catch((err) => {
          console.error('[AppRunner] Failed to import react-dom/client:', err);
          setError(`Failed to load React DOM: ${err.message}`);
        });
      } else {
        console.error('[AppRunner] Missing container or component');
        if (!containerRef.current) console.error('[AppRunner] No container ref');
        if (!AppComponent) console.error('[AppRunner] No AppComponent');
      }
    } catch (err: any) {
      console.error('[AppRunner] Failed to render app:', err);
      console.error('[AppRunner] Error stack:', err.stack);
      setError(`Failed to render app: ${err.message}`);
      onError?.(`Failed to render app: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 animate-spin text-[var(--primary)]" />
          <p className="text-[var(--muted-foreground)] uppercase font-bold">
            Loading {manifest?.name || 'App'}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md">
          <Card.Content className="py-8 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-[var(--destructive)]" />
            <h3 className="text-xl font-bold uppercase mb-2">Failed to Load App</h3>
            <p className="text-[var(--muted-foreground)] text-sm mb-4">{error}</p>
            <Button onClick={loadAndRunApp}>Retry</Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // App container - the compiled app will render here
  return <div ref={containerRef} className="w-full h-full" />;
}

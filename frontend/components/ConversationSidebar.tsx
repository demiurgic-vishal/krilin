"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, Trash2, Edit2, Clock } from "lucide-react";
import { Button } from "./retroui/Button";
import { Card } from "./retroui/Card";

interface Conversation {
  id: number;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  preview: string;
}

interface ConversationSidebarProps {
  appId: string;
  currentConversationId: number | null;
  onSelectConversation: (conversationId: number | null, messages: Array<{role: string; content: string}>) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onClose?: () => void;
}

export function ConversationSidebar({
  appId,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onClose
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [appId, isOpen]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(
        `http://localhost:8001/api/v1/apps/${appId}/conversations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(
        `http://localhost:8001/api/v1/apps/${appId}/conversations/${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const messages = data.conversation_history.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }));
        onSelectConversation(conversationId, messages);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this conversation?')) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(
        `http://localhost:8001/api/v1/apps/${appId}/conversations/${conversationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          onNewConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleRenameConversation = async (conversationId: number) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(
        `http://localhost:8001/api/v1/apps/${appId}/conversations/${conversationId}?title=${encodeURIComponent(editTitle)}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setConversations(prev =>
          prev.map(c => c.id === conversationId ? { ...c, title: editTitle } : c)
        );
        setEditingId(null);
        setEditTitle("");
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 bg-[var(--card)] border-r-4 border-[var(--border)] flex flex-col shadow-[4px_0_0_0_var(--border)]">
      {/* Header */}
      <div className="p-4 border-b-4 border-[var(--border)] bg-[var(--primary)] text-[var(--primary-foreground)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} />
            <h2 className="text-lg font-[var(--font-head)] uppercase">Conversations</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="hover:opacity-80 transition-opacity"
            >
              ×
            </button>
          )}
        </div>
        <Button
          onClick={onNewConversation}
          size="sm"
          variant="secondary"
          className="w-full"
        >
          <Plus size={16} className="mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-8 text-[var(--muted-foreground)] text-sm uppercase">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)] text-sm">
            <p className="uppercase mb-2">No conversations yet</p>
            <p className="text-xs">Start chatting to refine your app!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`p-3 border-2 cursor-pointer transition-all ${
                  currentConversationId === conv.id
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-[2px_2px_0_0_var(--primary)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)] hover:shadow-[2px_2px_0_0_var(--border)]'
                }`}
              >
                {editingId === conv.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRenameConversation(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameConversation(conv.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full bg-[var(--background)] border-2 border-[var(--border)] px-2 py-1 text-sm font-bold uppercase"
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm uppercase flex-1 line-clamp-2">
                        {conv.title}
                      </h3>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(conv.id);
                            setEditTitle(conv.title);
                          }}
                          className="p-1 hover:bg-[var(--muted)] transition-colors"
                          title="Rename"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="p-1 hover:bg-[var(--destructive)]/10 text-[var(--destructive)] transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-2">
                      {conv.preview}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <Clock size={10} />
                      <span>{formatDate(conv.last_message_at || conv.updated_at)}</span>
                      <span>•</span>
                      <span>{conv.message_count} messages</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

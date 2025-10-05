"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { executeAction, streamAgentChat, type StreamEvent } from "@/lib/api/apps";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import {
  Target, Plus, CheckCircle2, TrendingUp, MessageSquare,
  Calendar, Flame, Award, Home, Sparkles, ArrowRight, Send
} from "lucide-react";

// Habit interface
interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  category: string;
  color: string;
  icon: string;
  active: boolean;
  current_streak?: number;
}

// Stats interface
interface Stats {
  total_habits: number;
  completed_today: number;
  completion_rate: number;
  pending_today: number;
}

export default function HabitTrackerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAgentChat, setShowAgentChat] = useState(false);

  // Form state
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    frequency: "daily",
    category: "general"
  });

  // Agent chat state
  const [chatMessages, setChatMessages] = useState<Array<{role: string; content: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load habits and stats
  useEffect(() => {
    if (user) {
      loadHabits();
      loadStats();
    }
  }, [user]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const result = await executeAction('habit-tracker', 'get_habits', {});

      if (result.success) {
        setHabits(result.result);
      }
    } catch (err: any) {
      console.error('Failed to load habits:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await executeAction('habit-tracker', 'get_stats', { period: 'week' });

      if (result.success) {
        setStats(result.result);
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newHabit.name.trim()) return;

    try {
      const result = await executeAction('habit-tracker', 'create_habit', newHabit);

      if (result.success) {
        setNewHabit({ name: "", description: "", frequency: "daily", category: "general" });
        setShowCreateForm(false);
        loadHabits();
        loadStats();
      }
    } catch (err: any) {
      alert(`Failed to create habit: ${err.message}`);
    }
  };

  const handleLogHabit = async (habitId: string) => {
    try {
      const result = await executeAction('habit-tracker', 'log_habit', {
        habit_id: habitId,
        notes: ""
      });

      if (result.success) {
        loadHabits(); // Reload to update streak
        loadStats();
      }
    } catch (err: any) {
      alert(`Failed to log habit: ${err.message}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatInput.trim() || chatStreaming) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      setChatStreaming(true);
      let assistantMessage = "";

      // Add placeholder for assistant message
      setChatMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      // Stream agent response
      for await (const event of streamAgentChat('habit-tracker', userMessage, {})) {
        if (event.type === 'text') {
          assistantMessage += event.content;

          // Update the last message (assistant's message)
          setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: assistantMessage
            };
            return newMessages;
          });
        } else if (event.type === 'tool_use') {
          console.log('Agent using tool:', event.content);
        } else if (event.type === 'result') {
          console.log('Agent finished:', event.content);
        }
      }

      // Reload habits in case agent modified them
      loadHabits();
      loadStats();
    } catch (err: any) {
      console.error('Chat error:', err);
      alert(`Failed to chat with agent: ${err.message}`);
    } finally {
      setChatStreaming(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-3xl font-[var(--font-head)] mb-4 uppercase">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
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
                  <Target size={32} className="text-[var(--primary)]" />
                  Habit Tracker
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1 uppercase">
                  Build Streaks, Track Progress, Stay Consistent
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAgentChat(!showAgentChat)}
              >
                <MessageSquare size={20} className="mr-2" />
                AI Coach
              </Button>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus size={20} className="mr-2" />
                New Habit
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="border-2 border-[var(--border)] bg-[var(--card)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{stats.total_habits}</div>
                  <div className="text-sm uppercase font-medium">Total Habits</div>
                </div>
                <Target size={48} className="opacity-50" />
              </div>
            </div>

            <div className="border-2 border-[var(--border)] bg-[var(--success)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{stats.completed_today}</div>
                  <div className="text-sm uppercase font-medium">Done Today</div>
                </div>
                <CheckCircle2 size={48} className="opacity-50" />
              </div>
            </div>

            <div className="border-2 border-[var(--border)] bg-[var(--primary)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{stats.completion_rate}%</div>
                  <div className="text-sm uppercase font-medium">Completion Rate</div>
                </div>
                <TrendingUp size={48} className="opacity-50" />
              </div>
            </div>

            <div className="border-2 border-[var(--border)] bg-[var(--accent)] p-6 shadow-[4px_4px_0_0_var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{stats.pending_today}</div>
                  <div className="text-sm uppercase font-medium">Pending Today</div>
                </div>
                <Calendar size={48} className="opacity-50" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Habits */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Form */}
            {showCreateForm && (
              <Card>
                <Card.Header>
                  <Card.Title>Create New Habit</Card.Title>
                  <Card.Description>
                    Define a new habit to track daily
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  <form onSubmit={handleCreateHabit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 uppercase">
                        Habit Name *
                      </label>
                      <input
                        type="text"
                        value={newHabit.name}
                        onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
                        placeholder="E.g., Morning Exercise"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 uppercase">
                        Description
                      </label>
                      <textarea
                        value={newHabit.description}
                        onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-[var(--primary)] h-20"
                        placeholder="What does this habit involve?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 uppercase">
                        Category
                      </label>
                      <select
                        value={newHabit.category}
                        onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="general">General</option>
                        <option value="health">Health</option>
                        <option value="productivity">Productivity</option>
                        <option value="learning">Learning</option>
                        <option value="social">Social</option>
                        <option value="wellness">Wellness</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">
                        <Plus size={20} className="mr-2" />
                        Create Habit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card.Content>
              </Card>
            )}

            {/* Habits List */}
            <div>
              <h2 className="text-2xl font-[var(--font-head)] uppercase mb-4">
                Your Habits
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-[var(--muted-foreground)] uppercase">
                    Loading habits...
                  </div>
                </div>
              ) : habits.length === 0 ? (
                <Card>
                  <Card.Content className="py-16 text-center">
                    <Target size={64} className="mx-auto mb-6 opacity-50" />
                    <h3 className="text-2xl font-[var(--font-head)] mb-4 uppercase">
                      No Habits Yet
                    </h3>
                    <p className="text-[var(--muted-foreground)] mb-8 max-w-md mx-auto">
                      Start building positive habits today. Click "New Habit" to create your first habit.
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus size={20} className="mr-2" />
                      Create Your First Habit
                    </Button>
                  </Card.Content>
                </Card>
              ) : (
                <div className="space-y-4">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className="border-2 border-[var(--border)] bg-[var(--card)] p-6 shadow-[4px_4px_0_0_var(--border)] hover:shadow-[8px_8px_0_0_var(--border)] transition-all hover:translate-x-[-4px] hover:translate-y-[-4px]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{habit.icon || '🎯'}</span>
                            <h3 className="text-xl font-bold uppercase">{habit.name}</h3>
                            <span className="px-2 py-1 border-2 border-[var(--border)] bg-[var(--muted)] text-xs font-bold uppercase">
                              {habit.category}
                            </span>
                          </div>
                          {habit.description && (
                            <p className="text-sm text-[var(--muted-foreground)] mb-3">
                              {habit.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Flame size={20} className="text-orange-500" />
                              <span className="text-2xl font-bold">
                                {habit.current_streak || 0}
                              </span>
                              <span className="text-sm text-[var(--muted-foreground)] uppercase">
                                Day Streak
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleLogHabit(habit.id)}
                          className="ml-4"
                        >
                          <CheckCircle2 size={20} className="mr-2" />
                          Log Today
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Agent Chat */}
          <div>
            {showAgentChat ? (
              <Card className="sticky top-4">
                <Card.Header>
                  <Card.Title className="flex items-center gap-2">
                    <Sparkles size={20} className="text-[var(--primary)]" />
                    Habit Coach AI
                  </Card.Title>
                  <Card.Description>
                    Get personalized advice and motivation
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  {/* Chat Messages */}
                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-[var(--muted-foreground)] py-8">
                        <p className="mb-4">👋 Hello! I'm your Habit Coach.</p>
                        <p className="text-sm">
                          Ask me about your habits, get motivation, or request insights!
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-4 border-2 border-[var(--border)] ${
                            msg.role === 'user'
                              ? 'bg-[var(--primary)] ml-8'
                              : 'bg-[var(--card)] mr-8'
                          }`}
                        >
                          <div className="text-xs uppercase font-bold mb-2 opacity-75">
                            {msg.role === 'user' ? 'You' : 'Coach'}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me anything..."
                      disabled={chatStreaming}
                      className="flex-1 px-4 py-2 border-2 border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-50"
                    />
                    <Button type="submit" disabled={chatStreaming || !chatInput.trim()}>
                      <Send size={20} />
                    </Button>
                  </form>
                </Card.Content>
              </Card>
            ) : (
              <Card className="sticky top-4">
                <Card.Content className="py-16 text-center">
                  <Sparkles size={64} className="mx-auto mb-6 opacity-50 text-[var(--primary)]" />
                  <h3 className="text-xl font-[var(--font-head)] mb-4 uppercase">
                    Habit Coach AI
                  </h3>
                  <p className="text-[var(--muted-foreground)] mb-6">
                    Get personalized habit insights, motivation, and advice from your AI coach.
                  </p>
                  <Button onClick={() => setShowAgentChat(true)}>
                    <MessageSquare size={20} className="mr-2" />
                    Start Chat
                  </Button>
                </Card.Content>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

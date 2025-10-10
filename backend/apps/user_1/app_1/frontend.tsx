import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '@/components/ui';

export default function app1App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('unknown');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await window.krilin.actions.call('get_tomorrow_events', {});

      // The API wraps the result in {success, result, error}
      const result = response.result || response;

      setEvents(result.events || []);
      setDataSource(result.source || 'unknown');

      if (result.error) {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setError(error.message || 'Failed to load events');
      setEvents([]);
      setDataSource('error');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'meeting':
        return '👥';
      case 'deadline':
        return '📅';
      case 'event':
        return '🎯';
      default:
        return '📌';
    }
  };

  const getEventBadgeVariant = (type) => {
    // Badge variants match the RetroUI theme
    return type === 'deadline' ? 'destructive' : 'default';
  };

  const getNextWeekDateRange = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfWeek = new Date(tomorrow);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const startStr = tomorrow.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    const endStr = endOfWeek.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <Card className="mb-6 border-2 border-[var(--border)] shadow-[4px_4px_0_0_var(--border)]">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title className="text-3xl font-bold text-[var(--foreground)]">
                Next Week's Schedule 📅
              </Card.Title>
              <Button onClick={loadEvents} className="text-sm">
                Refresh
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-lg text-[var(--muted-foreground)]">{getNextWeekDateRange()}</p>
            {dataSource === 'integration' && (
              <Badge className="mt-2 bg-green-500">
                Connected to Calendar
              </Badge>
            )}
          </Card.Content>
        </Card>

        {/* Integration Warning */}
        {!loading && events.length === 0 && dataSource !== 'integration' && (
          <Card className="mb-4 border-2 border-[var(--border)] shadow-[4px_4px_0_0_var(--border)] bg-yellow-50">
            <Card.Header>
              <Card.Title className="text-[var(--foreground)] flex items-center gap-2">
                ⚠️ No Calendar Connected
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-[var(--muted-foreground)] mb-3">
                To see your actual calendar events, please connect a calendar integration:
              </p>
              <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1">
                <li>Google Calendar</li>
                <li>Microsoft Calendar (Outlook)</li>
              </ul>
              <p className="text-sm text-[var(--muted-foreground)] mt-3">
                Go to your Krilin settings to connect a calendar integration.
              </p>
            </Card.Content>
          </Card>
        )}

        {/* Events List */}
        {loading ? (
          <Card className="border-2 border-[var(--border)] shadow-[4px_4px_0_0_var(--border)]">
            <Card.Content className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-[var(--primary)]"></div>
              <p className="mt-4 text-[var(--muted-foreground)]">Loading events...</p>
            </Card.Content>
          </Card>
        ) : events.length === 0 ? (
          <Card className="border-2 border-[var(--border)] shadow-[4px_4px_0_0_var(--border)]">
            <Card.Content className="text-center py-12">
              <p className="text-4xl mb-4">🎉</p>
              <p className="text-[var(--muted-foreground)]">No events scheduled for the next week</p>
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card
                key={event.id}
                className="border-2 border-[var(--border)] shadow-[4px_4px_0_0_var(--border)] hover:shadow-[6px_6px_0_0_var(--border)] transition-shadow"
              >
                <Card.Header>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getEventIcon(event.type)}</span>
                      <div>
                        <Card.Title className="text-xl text-[var(--foreground)]">
                          {event.title}
                        </Card.Title>
                        {event.date && (
                          <p className="text-sm text-[var(--muted-foreground)] mt-1">
                            {event.date}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={getEventBadgeVariant(event.type)}>
                      {event.time}
                    </Badge>
                  </div>
                </Card.Header>
                {event.description && (
                  <Card.Content>
                    <p className="text-[var(--muted-foreground)]">{event.description}</p>
                  </Card.Content>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {!loading && events.length > 0 && (
          <Card className="mt-6 border-2 border-[var(--border)] shadow-[4px_4px_0_0_var(--border)]">
            <Card.Header>
              <Card.Title className="text-[var(--foreground)]">Summary</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="flex items-center justify-around gap-4">
                <div className="text-center">
                  <Badge className="mb-2">Total Events</Badge>
                  <p className="text-3xl font-bold text-[var(--primary)]">{events.length}</p>
                </div>
                <div className="text-center">
                  <Badge className="mb-2">Meetings</Badge>
                  <p className="text-3xl font-bold text-[var(--primary)]">
                    {events.filter(e => e.type === 'meeting').length}
                  </p>
                </div>
                <div className="text-center">
                  <Badge variant="destructive" className="mb-2">Deadlines</Badge>
                  <p className="text-3xl font-bold text-[var(--primary)]">
                    {events.filter(e => e.type === 'deadline').length}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    </div>
  );
}

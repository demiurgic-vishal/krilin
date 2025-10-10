# app 1

I want an app to remind me of all meetings/events i have tomorrow and generate a todo list of all the work i need to do for those meetings/events today

## App Structure

This is a Krilin platform app with the following files:

- **manifest.json**: App metadata and configuration
- **frontend.tsx**: React component (UI)
- **backend.py**: Python actions and logic

## Krilin RetroUI Components

**IMPORTANT: Always use these themed components!**

```typescript
// Card
<Card><Card.Header><Card.Title>Title</Card.Title></Card.Header><Card.Content>Content</Card.Content></Card>

// Button
<Button>Click</Button>
<Button variant="destructive">Delete</Button>

// Input
<Input placeholder="Text..." />

// Badge
<Badge>Label</Badge>
```

**Styling:**
- Use `bg-[var(--primary)]`, `text-[var(--foreground)]`, `border-[var(--border)]`
- Shadows: `shadow-[4px_4px_0_0_var(--border)]`
- Always use thick borders: `border-2 border-[var(--border)]`

## Guidelines

- **ALWAYS use RetroUI components** - NEVER use plain divs
- Use CSS variables for all colors
- Match retro/pixel-art aesthetic

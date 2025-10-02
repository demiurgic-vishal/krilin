# Enable Streaming in Frontend

## Quick Update to Enable Streaming

Replace the `handleSendMessage` function in `/frontend/app/chat/page.tsx`:

### Current Code (Line 6):
```typescript
import { useSendMessage, useConversations } from "@/lib/hooks/useChat"
```

### Change to:
```typescript
import { useSendMessage, useConversations, useStreamingMessage } from "@/lib/hooks/useChat"
```

### Current Code (Line 17):
```typescript
const { sendMessage, loading: sendingMessage } = useSendMessage()
```

### Change to:
```typescript
const { sendStreamingMessage, loading: sendingMessage } = useStreamingMessage()
```

### Current Code (Lines 66-105):
```typescript
const handleSendMessage = async (message: string) => {
  // Add user message immediately
  const userMessage = {
    role: 'user' as const,
    content: message,
    timestamp: new Date().toLocaleTimeString()
  }
  setMessages(prev => [...prev, userMessage])

  try {
    const response = await sendMessage({
      conversationId: conversationId || undefined,
      message,
      agentType: 'general_assistant'
    })

    // Add AI response
    const aiMessage = {
      role: 'assistant' as const,
      content: response.message,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, aiMessage])

    // Set conversation ID if this was a new conversation
    if (!conversationId && response.conversation_id) {
      setConversationId(response.conversation_id)
      refetch()
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    // Show error message
    const errorMessage = {
      role: 'assistant' as const,
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, errorMessage])
  }
}
```

### Replace with:
```typescript
const handleSendMessage = async (message: string) => {
  // Add user message immediately
  const userMessage = {
    role: 'user' as const,
    content: message,
    timestamp: new Date().toLocaleTimeString()
  }
  setMessages(prev => [...prev, userMessage])

  // Add placeholder for AI response
  const aiMessageId = Date.now()
  const aiMessage = {
    role: 'assistant' as const,
    content: '',
    timestamp: new Date().toLocaleTimeString()
  }
  setMessages(prev => [...prev, aiMessage])

  try {
    const response = await sendStreamingMessage({
      conversationId: conversationId || undefined,
      message,
      agentType: 'general_assistant',
      onToken: (token: string) => {
        // Update AI message content with each token
        setMessages(prev => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content += token
          }
          return updated
        })
      },
      onComplete: (fullMessage: string) => {
        // Final update with complete message
        setMessages(prev => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = fullMessage
          }
          return updated
        })
      },
      onError: (error: string) => {
        console.error('Streaming error:', error)
        setMessages(prev => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = 'Sorry, I encountered an error. Please try again.'
          }
          return updated
        })
      }
    })

    // Set conversation ID if this was a new conversation
    if (!conversationId && response.conversation_id) {
      setConversationId(response.conversation_id)
      refetch()
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    // Error already handled by onError callback
  }
}
```

## That's It!

After making these changes:

1. **Restart your frontend dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Go to `/chat` page**

3. **Send a message**

4. **Watch it stream in real-time!** ✨

## What You'll See

**Before (non-streaming):**
- Type message
- Wait 2-3 seconds
- See complete response appear

**After (streaming):**
- Type message
- See response appear token-by-token immediately
- ChatGPT-like typing effect!

## Files Already Updated

✅ `lib/hooks/useChat.ts` - Added `useStreamingMessage` hook
✅ `lib/api/client.ts` - Added `sendStreamingMessage` method
✅ Backend streaming endpoint is ready

Just update `app/chat/page.tsx` and you're done!

## Alternative: Keep Both

You can also keep both streaming and non-streaming and add a toggle:

```typescript
const [useStreaming, setUseStreaming] = useState(true)

// In your component:
<button onClick={() => setUseStreaming(!useStreaming)}>
  {useStreaming ? '⚡ Streaming ON' : '💬 Streaming OFF'}
</button>

// In handleSendMessage:
if (useStreaming) {
  // Use sendStreamingMessage
} else {
  // Use sendMessage
}
```

Let users choose their preferred experience!

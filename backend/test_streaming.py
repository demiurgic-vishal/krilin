#!/usr/bin/env python3
"""
Test script to verify Claude Agent SDK streaming is working properly.
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.claude_agent_service import GeneralAssistant


async def test_streaming():
    """Test streaming with the General Assistant."""
    print("🧪 Testing Claude Agent SDK Streaming")
    print("=" * 60)

    agent = GeneralAssistant()

    context = {
        "user_id": 1,
        "user_preferences": {},
        "recent_messages": []
    }

    message = "Tell me a short story about Krillin training. Keep it to about 3 sentences."

    print(f"\n📤 Sending message: {message}")
    print("\n📥 Streaming response:\n")
    print("-" * 60)

    token_count = 0
    full_response = ""

    try:
        print("⏳ Waiting for response...\n")
        async for event in agent.process_message_streaming(message, context):
            print(f"[DEBUG] Event type: {event.event_type}", flush=True)

            if event.event_type == "text":
                # Print each chunk as it arrives
                print(f"[CHUNK #{token_count + 1}]: {repr(event.content)}", flush=True)
                print(event.content, end="", flush=True)
                full_response += event.content
                token_count += 1

            elif event.event_type == "tool_use":
                print(f"\n🔧 [Tool: {event.content.get('tool')}]", flush=True)

            elif event.event_type == "result":
                print("\n" + "-" * 60)
                print(f"✅ Stream complete!")
                print(f"📊 Tokens/chunks received: {token_count}")
                print(f"💰 Cost: ${event.metadata.get('cost_usd', 'N/A')}")
                print(f"⏱️  Duration: {event.metadata.get('duration_ms', 'N/A')}ms")

            elif event.event_type == "error":
                print(f"\n❌ Error: {event.content}")

        print("\n" + "=" * 60)
        print(f"\n📝 Full response length: {len(full_response)} characters")
        print(f"🎯 Number of chunks: {token_count}")

        if token_count == 1:
            print("\n⚠️  WARNING: Only received 1 chunk - streaming may not be working!")
            print("Expected: Multiple small chunks appearing one by one")
        elif token_count > 1:
            print(f"\n✅ SUCCESS: Received {token_count} chunks - streaming is working!")

    except Exception as e:
        print(f"\n❌ Error during streaming: {e}")
        import traceback
        traceback.print_exc()
        return False

    return token_count > 1


async def main():
    print("\n🚀 Starting Streaming Test\n")

    success = await test_streaming()

    if success:
        print("\n✅ Streaming test PASSED")
        sys.exit(0)
    else:
        print("\n❌ Streaming test FAILED")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

"""
Habit Tracker App

A complete productivity app for tracking daily habits, building streaks,
and maintaining consistency.

Features:
- Create and manage habits
- Log daily completions
- Track streaks and progress
- Get insights and statistics
- Embedded Claude AI coach for motivation and guidance

This app demonstrates the Cloud OS App Platform architecture:
- Complete app with UI, state, and logic (not a simple workflow)
- Embedded Claude agent with custom tools
- Outputs for app composition (other apps can use habit data)
- Uses platform APIs (storage, streams, notifications)
"""
from . import backend, agent_tools

__version__ = "1.0.0"
__all__ = ["backend", "agent_tools"]

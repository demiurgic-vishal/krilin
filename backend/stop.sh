#!/bin/bash
# Krilin AI - Stop Script

set -e

echo "🛑 Stopping Krilin AI services..."
docker-compose down

echo ""
echo "✅ All services stopped"
echo ""
echo "💾 To remove volumes (delete data):"
echo "  docker-compose down -v"
echo ""

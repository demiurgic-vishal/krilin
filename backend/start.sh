#!/bin/bash
# Krilin AI - Quick Start Script

set -e

echo "🥋 KRILIN AI - STARTING DEVELOPMENT ENVIRONMENT"
echo "================================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env file and add your OPENAI_API_KEY"
    echo ""
fi

# Build and start services
echo "🏗️  Building Docker containers..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service health
echo ""
echo "🔍 Checking service health..."
docker-compose ps

echo ""
echo "✅ KRILIN AI IS READY!"
echo ""
echo "📊 Services Status:"
echo "  • PostgreSQL:  http://localhost:5432"
echo "  • Redis:       http://localhost:6379"
echo "  • Backend API: http://localhost:8000"
echo "  • API Docs:    http://localhost:8000/docs"
echo ""
echo "📝 View logs:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f celery-worker"
echo "  docker-compose logs -f celery-beat"
echo ""
echo "🛑 Stop services:"
echo "  docker-compose down"
echo ""

#!/bin/bash

echo "🚀 Starting Kaze Scheduling Application..."
echo "📅 Date: $(date)"
echo "🌍 Location: Europe/Paris timezone"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Setting up environment..."

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
KAZE_API_TOKEN=your-kaze-api-token-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
EOF
    echo "✅ Created .env.local file"
else
    echo "✅ .env.local file already exists"
fi

echo ""
echo "🌐 Starting application..."
echo "📍 URL: http://localhost:3000"
echo "🔄 The application will automatically reload when you make changes"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev

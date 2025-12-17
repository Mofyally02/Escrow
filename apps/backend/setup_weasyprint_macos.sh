#!/bin/bash
# Setup script for WeasyPrint on macOS
# Installs required system dependencies via Homebrew

set -e

echo "🔧 Setting up WeasyPrint dependencies for macOS..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed. Please install it first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

echo "📦 Installing WeasyPrint system dependencies..."
brew install cairo pango gdk-pixbuf libffi glib

echo "✅ System dependencies installed!"
echo ""
echo "🔄 Reinstalling WeasyPrint Python package..."
pip install --force-reinstall weasyprint

echo ""
echo "✅ WeasyPrint setup complete!"
echo ""
echo "🧪 Testing WeasyPrint import..."
python3 -c "from weasyprint import HTML; print('✅ WeasyPrint is working correctly!')" || {
    echo "❌ WeasyPrint test failed. Please check the error above."
    exit 1
}

echo ""
echo "🎉 All done! WeasyPrint is ready to use."


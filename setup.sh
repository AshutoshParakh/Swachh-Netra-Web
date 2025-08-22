#!/bin/bash

# Swachh Netra Web Portal Setup Script
echo "🚀 Setting up Swachh Netra Admin Web Portal..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing root dependencies..."
    npm install

    print_status "Installing backend dependencies..."
    cd backend && npm install
    cd ..

    print_status "Installing frontend dependencies..."
    cd frontend && npm install
    cd ..

    print_success "All dependencies installed successfully!"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."

    # Backend environment
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_warning "Backend .env file created from example. Please update with your Firebase credentials."
    else
        print_warning "Backend .env file already exists."
    fi

    # Frontend environment
    if [ ! -f "frontend/.env" ]; then
        cp frontend/.env.example frontend/.env
        print_warning "Frontend .env file created from example. Please update with your Firebase credentials."
    else
        print_warning "Frontend .env file already exists."
    fi

    print_success "Environment files setup complete!"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p backups
    
    print_success "Directories created successfully!"
}

# Display setup completion message
display_completion() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update environment variables in backend/.env and frontend/.env"
    echo "2. Configure Firebase credentials"
    echo "3. Run 'npm run dev' to start both frontend and backend"
    echo ""
    echo "📚 Available commands:"
    echo "  npm run dev          - Start both frontend and backend"
    echo "  npm run server       - Start backend only"
    echo "  npm run client       - Start frontend only"
    echo "  npm run build        - Build frontend for production"
    echo ""
    echo "🔗 URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:5000"
    echo "  Health:   http://localhost:5000/health"
    echo ""
    echo "📖 For more information, see README.md"
}

# Main setup process
main() {
    echo "🛡️ Swachh Netra Admin Portal Setup"
    echo "=================================="
    echo ""

    check_node
    check_npm
    install_dependencies
    setup_environment
    create_directories
    display_completion
}

# Run main function
main

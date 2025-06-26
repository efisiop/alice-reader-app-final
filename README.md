# Alice Reader App

## Overview

The Alice Reader app is an advanced reading assistance application specifically designed for **Alice's Adventures in Wonderland**. It provides an immersive reading experience with contextual definitions, AI assistance, and specialized tools to help users understand and engage with classic literature.

## ✨ Key Features

### 📖 **Enhanced Reading Interface**
- **3/4 + 1/4 Layout**: Main reading area (75%) with dedicated navigation sidebar (25%)
- **Interactive Text Selection**: Click or highlight any word for instant definitions
- **Contextual Dictionary**: Prioritized Alice-specific glossary with fallback to external dictionaries
- **Smart Definition Display**: Definitions appear at the top of the section for better visibility
- **Phrasal Recognition**: Supports multi-word expressions and Victorian-era terminology

### 🎯 **Alice-Specific Features**
- **Custom Glossary System**: Specialized definitions for Alice in Wonderland terms
- **Chapter-Aware Definitions**: Context-sensitive definitions based on reading progress
- **Victorian Language Support**: Understanding of period-specific language and expressions
- **Literary Context**: Definitions include usage examples from the text

### 🤖 **AI-Powered Assistance**
- **Contextual AI Help**: Ask questions about the text with selected passages as context
- **Reading Comprehension**: Get explanations of complex passages or themes
- **Interactive Learning**: Engage with the text through AI-guided questions

### 👥 **Human Support**
- **Live Consultants**: Connect with reading specialists for personalized help
- **Expert Guidance**: Get assistance with literary analysis and comprehension
- **Real-time Support**: Access to human help when needed

### 📊 **Reading Analytics**
- **Progress Tracking**: Monitor reading progress through chapters and pages
- **Vocabulary Building**: Track looked-up words and definitions
- **Engagement Metrics**: Understand reading patterns and improvements

### ♿ **Accessibility Features**
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader Compatible**: ARIA labels and semantic HTML structure

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **npm** (v8 or later)
- **Supabase Account** (for full functionality)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/efisiop/alice-reader-app-final.git
   cd alice-reader-app-final
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Add your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup:**
   ```bash
   # Run database migration
   node scripts/run_migration.js
   
   # Import Alice glossary (optional)
   node scripts/import_alice_glossary.js
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

6. **Access the Application:**
   - Open http://localhost:5173
   - Register a new account or use test credentials
   - Navigate to the reader interface at `/#/reader/interaction`

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Library**: Material-UI (MUI) for consistent design
- **Backend**: Supabase (PostgreSQL + Authentication + Storage)
- **State Management**: React Context API with Service Registry pattern
- **Deployment**: GitHub Actions → GitHub Pages

### Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Service        │    │   Supabase      │
│                 │◄──►│  Registry       │◄──►│   Backend       │
│  - Components   │    │                 │    │                 │
│  - Pages        │    │  - Auth Service │    │  - Database     │
│  - Hooks        │    │  - Book Service │    │  - Auth         │
└─────────────────┘    │  - Dict Service │    │  - Storage      │
                       │  - AI Service   │    │  - Edge Funcs   │
                       └─────────────────┘    └─────────────────┘
```

### Key Components

#### MainInteractionPage
- **Layout**: Horizontal split (3/4 content + 1/4 navigation)
- **Text Selection**: Advanced word/phrase recognition with context expansion
- **Definition Display**: Top-positioned with gradient background
- **Navigation**: Integrated sidebar with icon-based actions

#### Alice Glossary System
- **Priority System**: Custom Alice definitions → Contextual → External APIs
- **Database Integration**: PostgreSQL functions for efficient lookup
- **Import System**: CSV-based glossary management
- **Chapter Mapping**: Page-to-chapter relationship for contextual definitions

## 🔧 Configuration

### Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Settings
VITE_APP_NAME="Alice Reader"
VITE_DEFAULT_BOOK_ID="550e8400-e29b-41d4-a716-446655440000"
```

### Database Schema

#### Core Tables
- `users`: User authentication and profiles
- `books`: Book catalog and metadata
- `book_sections`: Text content organized by chapters/sections
- `user_interactions`: Reading analytics and progress tracking
- `alice_glossary`: Custom Alice-specific definitions
- `verification_codes`: Access code management

#### Key Features
- **Row Level Security (RLS)**: Secure multi-tenant data access
- **Database Functions**: Optimized definition lookup with priority system
- **Triggers**: Automatic profile creation and progress tracking

## 📱 User Interface

### Navigation Structure

```
Alice Reader App
├── Authentication
│   ├── Login
│   ├── Register
│   └── Verification
├── Reader Dashboard
│   ├── Book Overview
│   ├── Progress Tracking
│   └── Quick Actions
└── Interactive Reader
    ├── Page Input (Top)
    ├── Section Selection
    ├── Text Content (3/4 width)
    │   ├── Definition Display (Top)
    │   └── Formatted Text
    └── Navigation Sidebar (1/4 width)
        ├── AI Assistance
        ├── Live Consultants
        └── Info Center
```

### Key UI Improvements

#### Enhanced Text Interaction
- **Smart Selection**: Partial word selection expands to full word
- **Phrase Recognition**: Supports 2-4 word expressions
- **Multi-node Selection**: Handles selections across HTML elements
- **Fallback Strategy**: Progressive fallback for definition lookup

#### Modern Design Elements
- **Gradient Backgrounds**: Beautiful definition display areas
- **Icon Integration**: Material Design icons for intuitive navigation
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: Hover effects and transitions

## 🧪 Testing

### Test Suite Structure

```bash
# Unit Tests
npm run test

# Integration Tests
npm run test:integration

# End-to-End Tests
npm run test:e2e

# Database Tests
node scripts/test_glossary.js
```

### Testing the Alice Glossary

1. **Setup Test Data:**
   ```bash
   # Import sample glossary
   node scripts/import_alice_glossary.js
   ```

2. **Test Definition Lookup:**
   - Navigate to reader interface
   - Select "A Caucus-Race" in the text
   - Verify custom Alice definition appears
   - Test fallback with common words

3. **Test Phrase Recognition:**
   - Select partial word (e.g., "Caucus")
   - Verify expansion to "Caucus-Race"
   - Test multi-word selections

### Manual Testing Checklist

- [ ] User registration and verification
- [ ] Page navigation and section loading
- [ ] Text selection and definition lookup
- [ ] Alice-specific glossary terms
- [ ] AI assistant functionality
- [ ] Responsive design on mobile/tablet
- [ ] Accessibility features (keyboard navigation)

## 🚀 Deployment

### GitHub Pages Deployment

The application is automatically deployed to GitHub Pages via GitHub Actions:

1. **Build Process:**
   ```bash
   npm run build:prod
   ```

2. **Deployment Pipeline:**
   - Triggered on push to `main` branch
   - Builds production-optimized bundle
   - Deploys to `gh-pages` branch
   - Available at: https://efisiop.github.io/alice-reader-app-final/

3. **Environment Configuration:**
   - Production Supabase credentials
   - Optimized bundle splitting
   - Service worker for offline functionality

### Manual Deployment

```bash
# Build for production
npm run build:prod

# Deploy to GitHub Pages
npm run deploy
```

## 📚 Documentation

### Comprehensive Guides

- **[Alice Glossary Guide](docs/alice-glossary-guide.md)**: Setting up and managing custom definitions
- **[UI Enhancement Guide](docs/ui-enhancement-guide.md)**: Understanding the new layout and features
- **[Testing Guide](TESTING.md)**: Complete testing procedures and validation
- **[Deployment Guide](docs/deployment-guide.md)**: Production deployment instructions
- **[Troubleshooting Guide](docs/troubleshooting-guide.md)**: Common issues and solutions

### API Documentation

- **Dictionary Service**: Handles definition lookup with priority system
- **Book Service**: Manages book content and user progress
- **Interaction Service**: Tracks user engagement and analytics
- **AI Service**: Provides contextual assistance and responses

## 🔍 Troubleshooting

### Common Issues

#### Definition Lookup Not Working
```bash
# Test database connection
node test_connection_simple.js

# Verify glossary import
node scripts/test_glossary.js
```

#### UI Layout Issues
- Clear browser cache and reload
- Check console for JavaScript errors
- Verify Material-UI theme consistency

#### Deployment Problems
- Check GitHub Actions logs
- Verify environment variables
- Test build process locally

### Debug Tools

Access debugging tools in browser console:
```javascript
// Test services
window._debug.services();

// Check authentication
window._debug.auth();

// Access Supabase client
window._debug.supabase;
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow code standards**: TypeScript, ESLint, Prettier
4. **Add tests**: Ensure new features have adequate test coverage
5. **Update documentation**: Keep README and docs current
6. **Submit PR**: Detailed description of changes

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with React rules
- **Prettier**: Consistent code formatting
- **Material-UI**: Follow design system guidelines

### Git Conventions

```bash
# Commit message format
type(scope): description

# Examples
feat(glossary): add Alice-specific definition lookup
fix(ui): resolve definition positioning issue
docs(readme): update feature documentation
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Lewis Carroll**: Original Alice's Adventures in Wonderland
- **Project Gutenberg**: Public domain text source
- **React Community**: Excellent framework and ecosystem
- **Material-UI Team**: Beautiful component library
- **Supabase Team**: Powerful backend-as-a-service platform

---

## 📞 Support

For questions, issues, or contributions:

- **GitHub Issues**: [Report bugs or request features](https://github.com/efisiop/alice-reader-app-final/issues)
- **Documentation**: Check the `docs/` directory for detailed guides
- **Testing**: Run the test suite and check TESTING.md for validation

**Happy Reading! 📖✨**

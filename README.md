# Alice Reader App

## Overview

The Alice Reader app is a reading assistance application designed to help users improve their reading experience through various features including word definitions, AI assistance, and live help from consultants.

## Features

- **Interactive Reading Interface**: Navigate through books with an intuitive interface
- **Dictionary Integration**: Look up word definitions with a simple tap
- **AI Assistant**: Get context-aware answers to questions about the text
- **Consultant Support**: Request help from reading consultants when needed
- **Reading Statistics**: Track reading progress and performance
- **Accessibility Features**: Support for various accessibility needs

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/efisiop/alice-reader-app-final.git
   cd alice-reader-app-final
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file based on `.env.example`
   - Add your Supabase URL and API key

4. Start the development server:
   ```bash
   npm run dev
   ```

## Documentation

Comprehensive documentation is available in the `docs` directory:

- [Beta Testing Guide](docs/beta-testing-guide.md): Instructions for beta testers
- [Production Readiness Checklist](docs/production-readiness-checklist.md): Checklist for production deployment
- [Troubleshooting Guide](docs/troubleshooting-guide.md): Solutions for common issues
- [Deployment Guide](docs/deployment-guide.md): Instructions for deploying to GitHub Pages
- [Dictionary Service Guide](docs/dictionary-service-guide.md): Information about the dictionary service

## Architecture

The Alice Reader app is built with:

- **Frontend**: React, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: React Context API with service registry pattern
- **Styling**: Material-UI (MUI)
- **Deployment**: GitHub Actions to GitHub Pages

### Authentication & User Management

- User signup automatically triggers profile creation via a database trigger
- Authentication is handled through Supabase Auth
- Book verification uses a consolidated verification process that handles code validation and profile updates in one step

## Troubleshooting

If you encounter issues with the application, please refer to our [Troubleshooting Guide](docs/troubleshooting-guide.md) which covers common problems and their solutions, including:

- Application initialization issues
- Service registry problems
- Backend connection issues
- Authentication errors
- Deployment issues

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

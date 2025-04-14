# Alice Reader App Deployment Guide

This guide details the steps to deploy the Alice Reader App to GitHub Pages using GitHub Actions.

## Prerequisites

- GitHub repository with the Alice Reader App code
- GitHub account with permissions to configure the repository
- Supabase project with production configuration

## Setup Steps

### 1. Configure GitHub Repository

1. Go to your repository's Settings > Pages
2. Under "Build and deployment":
   - Source: "GitHub Actions"
   - Branch: Leave as is (deployment will be handled by the workflow)

### 2. Configure GitHub Secrets

1. Go to Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase project's anon/public key

### 3. Environment Files

The repository includes several environment files:
- `.env.example`: Template for environment variables
- `.env`: Local development environment (gitignored)
- `.env.production`: Production environment (created by CI/CD)

### 4. Deployment Process

The deployment process is automated using GitHub Actions:

1. Push changes to the `main` branch
2. GitHub Actions workflow will:
   - Install dependencies
   - Clear npm and Vite cache to ensure clean builds
   - Run type checking
   - Create production environment file
   - Build the project
   - Create 404.html for SPA routing
   - Deploy to GitHub Pages
3. Access your app at: `https://<username>.github.io/alice-reader-app-final/`

### 5. Manual Deployment

If needed, you can trigger a manual deployment:

1. Go to Actions > Deploy to GitHub Pages
2. Click "Run workflow"
3. Select the branch and click "Run workflow"

### 6. Troubleshooting

Common issues and solutions:

1. **404 Errors on Routes**:
   - Ensure the base path in `vite.config.ts` matches your repository name exactly
   - Verify the 404.html file is properly created and deployed
   - Make sure you're using HashRouter for GitHub Pages

2. **Environment Variables**:
   - Check GitHub Secrets are properly set
   - Verify the environment variables in the build logs

3. **Build Failures**:
   - Check the Actions logs for detailed error messages
   - The workflow includes cache clearing steps to prevent stale cache issues
   - Type checking is performed before build to catch type errors

### 7. Monitoring

- Monitor the deployment status in the Actions tab
- Check the environment URL after deployment
- Verify all routes and features work in production

## Security Considerations

1. Never commit sensitive information to the repository
2. Keep the Supabase keys secure in GitHub Secrets
3. Regularly rotate the Supabase anon key
4. Monitor the access logs in Supabase

## Support

For deployment issues:
1. Check the GitHub Actions logs
2. Review the deployment documentation
3. Contact the development team for assistance

## Updating the Deployment

To update the deployed application:
1. Make changes to the codebase
2. Commit and push to the main branch
3. GitHub Actions will automatically deploy the updates

Remember to:
- Test changes locally before pushing
- Monitor the deployment process
- Verify the changes in production
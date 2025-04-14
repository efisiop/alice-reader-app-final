# Alice Reader App Troubleshooting Guide

This guide provides comprehensive troubleshooting information for common issues encountered in the Alice Reader application, with a focus on initialization errors, circular dependencies, and other technical challenges.

## Table of Contents

1. [Application Initialization Issues](#application-initialization-issues)
2. [Circular Dependencies](#circular-dependencies)
3. [Type Export/Import Issues](#type-exportimport-issues)
4. [Service Registry Problems](#service-registry-problems)
5. [Backend Connection Issues](#backend-connection-issues)
6. [Authentication Errors](#authentication-errors)
7. [Deployment Issues](#deployment-issues)
8. [Performance Problems](#performance-problems)
9. [Diagnostic Tools](#diagnostic-tools)

## Application Initialization Issues

### Symptoms

- Error message: "The application failed to initialize"
- Blank screen with error overlay
- Console errors related to missing variables or services
- Error: "Can't find variable: isBackendAvailable"

### Root Causes

1. **Service Initialization Order**: Services with dependencies may initialize before their dependencies are ready.
2. **Missing Environment Variables**: Required environment variables not set or loaded.
3. **Circular Dependencies**: Services importing each other in a circular pattern.
4. **Failed Backend Connection**: Unable to connect to Supabase or other backend services.

### Solutions

1. **Check Service Registry Initialization**:
   ```typescript
   // Ensure services are registered with proper dependencies
   initManager.register('serviceA', async () => {
     // Wait for dependencies to be ready
     await registry.getService('dependencyService');
     const service = await createServiceA();
     registry.register('serviceA', service);
   });
   ```

2. **Verify Environment Variables**:
   - Check `.env` files for missing variables
   - Ensure environment variables are properly loaded with `import.meta.env.VARIABLE_NAME`
   - Use fallbacks for optional variables: `import.meta.env.VARIABLE_NAME || 'default'`

3. **Fix Backend Configuration**:
   - Ensure `backendConfig.ts` properly exports `isBackendAvailable`
   - Make sure all services that need backend access import from the correct location

4. **Implement Retry Logic**:
   ```typescript
   // Add retry logic for critical initialization steps
   const initWithRetry = async (fn, maxRetries = 3) => {
     let retries = 0;
     while (retries < maxRetries) {
       try {
         return await fn();
       } catch (error) {
         retries++;
         if (retries >= maxRetries) throw error;
         await new Promise(r => setTimeout(r, 1000 * retries)); // Exponential backoff
       }
     }
   };
   ```

## Circular Dependencies

### Symptoms

- TypeScript errors about circular dependencies
- Runtime errors: "Cannot access X before initialization"
- Indirectly exported binding errors: "Indirectly exported binding name 'X' is not found"
- Inconsistent behavior depending on import order

### Root Causes

1. **Direct Circular Imports**: Module A imports from Module B, which imports from Module A.
2. **Indirect Circular Imports**: Module A imports from Module B, which imports from Module C, which imports from Module A.
3. **Barrel File Issues**: Re-exporting multiple modules in an index.ts file can create hidden circular dependencies.
4. **Type vs. Value Imports**: Mixing type and value imports can cause circular reference issues.

### Solutions

1. **Use Interface Segregation**:
   - Move interfaces to separate files
   - Use `export type` instead of `export` for interfaces
   ```typescript
   // types.ts
   export type ServiceInterface = {
     method1(): void;
     method2(): Promise<string>;
   };

   // service.ts
   import type { ServiceInterface } from './types';
   ```

2. **Avoid Barrel Files for Services**:
   - Import directly from source files instead of through barrel files
   - If barrel files are necessary, be careful about what's re-exported

3. **Use Lazy Loading**:
   - Load dependencies dynamically when needed
   ```typescript
   const getDependency = async () => {
     const { default: dependency } = await import('./dependency');
     return dependency;
   };
   ```

4. **Implement Service Locator Pattern**:
   - Use a central registry to access services
   - Initialize services on-demand
   ```typescript
   // Access services through registry instead of direct imports
   const service = await registry.getService('serviceName');
   ```

5. **Use Type-Only Imports**:
   - When only types are needed, use `import type` syntax
   ```typescript
   import type { ServiceInterface } from './service';
   ```

## Type Export/Import Issues

### Symptoms

- Error: "Indirectly exported binding name 'X' is not found"
- TypeScript errors about missing types
- Runtime errors about undefined types

### Root Causes

1. **Re-export Issues**: Types re-exported through multiple files can lose their definitions.
2. **Circular Type Dependencies**: Types that depend on each other circularly.
3. **Mixing Type and Value Exports**: Exporting types and values together can cause issues.

### Solutions

1. **Use `export type`**:
   - When re-exporting types, use `export type` syntax
   ```typescript
   export type { ServiceInterface } from './service';
   ```

2. **Direct Imports**:
   - Import types directly from their source files
   ```typescript
   import type { ServiceInterface } from './service';
   // Instead of
   // import type { ServiceInterface } from './index';
   ```

3. **Separate Type Definitions**:
   - Keep type definitions in separate files from implementations
   ```typescript
   // types.ts
   export interface ServiceInterface { ... }

   // service.ts
   import type { ServiceInterface } from './types';
   ```

4. **Type-Only Imports in Implementation Files**:
   - Use `import type` in files that only need the type information
   ```typescript
   import type { ServiceInterface } from './types';
   ```

## Service Registry Problems

### Symptoms

- Error: "Service X is not registered"
- Error: "Cannot read properties of undefined (reading 'method')"
- Services not initializing in the correct order

### Root Causes

1. **Missing Service Registration**: Services not properly registered in the registry.
2. **Initialization Order**: Dependencies not initialized before services that need them.
3. **Async Initialization Issues**: Not properly handling asynchronous service initialization.

### Solutions

1. **Implement Dependency Management**:
   ```typescript
   // Define service dependencies
   const SERVICE_DEPENDENCIES = {
     'serviceA': ['serviceB', 'serviceC'],
     'serviceB': ['serviceD'],
     // ...
   };

   // Initialize services in the correct order
   const initializeServices = async () => {
     const initialized = new Set();

     const initService = async (name) => {
       if (initialized.has(name)) return;

       // Initialize dependencies first
       const dependencies = SERVICE_DEPENDENCIES[name] || [];
       for (const dep of dependencies) {
         await initService(dep);
       }

       // Initialize the service
       await initManager.initialize(name);
       initialized.add(name);
     };

     // Initialize all services
     for (const service of Object.keys(SERVICE_DEPENDENCIES)) {
       await initService(service);
     }
   };
   ```

2. **Add Service Verification**:
   ```typescript
   // Verify that all required services are registered
   const verifyServices = () => {
     const requiredServices = [
       'authService',
       'bookService',
       // ...
     ];

     for (const service of requiredServices) {
       if (!registry.has(service)) {
         throw new Error(`Required service ${service} is not registered`);
       }
     }
   };
   ```

3. **Implement Service Factory Pattern**:
   ```typescript
   // Export factory function instead of singleton
   export const createService = async () => {
     // Create and configure service
     return service;
   };

   // Register service using factory
   initManager.register('serviceName', async () => {
     const service = await createService();
     registry.register('serviceName', service);
   });
   ```

## Backend Connection Issues

### Symptoms

- Error: "Failed to connect to backend"
- Mock backend used when real backend was expected
- Authentication failures
- Data not loading

### Root Causes

1. **Supabase Configuration**: Incorrect Supabase URL or API key.
2. **Network Issues**: Network connectivity problems.
3. **CORS Issues**: Cross-Origin Resource Sharing restrictions.
4. **Backend Availability Check**: Incorrect implementation of `isBackendAvailable`.

### Solutions

1. **Implement Proper Backend Configuration**:
   ```typescript
   // src/services/backendConfig.ts
   // Helper to decide whether to use mock or real backend
   export const isBackendAvailable = true; // Set to true to use real Supabase, false to use mock

   // Log the backend status for debugging
   console.log(`Backend status: Using ${isBackendAvailable ? 'REAL Supabase' : 'MOCK'} backend`);
   ```

2. **Add Connection Verification**:
   ```typescript
   // Check if Supabase is available
   export const checkSupabaseConnection = async (): Promise<boolean> => {
     try {
       if (!supabaseClient) {
         const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
         const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

         if (!supabaseUrl || !supabaseKey) {
           return false;
         }

         supabaseClient = createClient(supabaseUrl, supabaseKey);
       }

       // Try a simple query to check connection
       const { error } = await supabaseClient.from('books').select('id').limit(1);

       return !error;
     } catch (error) {
       return false;
     }
   };
   ```

3. **Implement Retry Logic**:
   ```typescript
   // Add retry logic for backend operations
   export const executeWithRetries = async (operation, maxRetries = 3) => {
     let retries = 0;
     while (retries < maxRetries) {
       try {
         return await operation();
       } catch (error) {
         retries++;
         if (retries >= maxRetries) throw error;
         await new Promise(r => setTimeout(r, 1000 * retries)); // Exponential backoff
       }
     }
   };
   ```

## Authentication Errors

### Symptoms

- Error: "undefined is not an object (evaluating 'data.subscription')"
- Users not staying logged in
- Authentication state not updating properly

### Root Causes

1. **Auth State Listener Issues**: Problems with the auth state change listener.
2. **Async Code Handling**: Not properly handling asynchronous auth operations.
3. **Supabase Client Issues**: Problems with the Supabase client initialization.

### Solutions

1. **Implement Robust Auth State Handling**:
   ```typescript
   // Set up the auth state change listener with proper error handling
   try {
     const result = backendOnAuthStateChange(async (_event, newSession) => {
       setSession(newSession);
       setUser(newSession?.user ?? null);
       setLoading(false);

       if (newSession?.user) {
         try {
           // Profile should be automatically created by database trigger
           const { data: userProfile } = await backendGetUserProfile(newSession.user.id);
           setProfile(userProfile);
         } catch (error) {
           console.error('Error fetching user profile on auth change:', error);
         }
       } else {
         setProfile(null);
       }
     });

     // Safely access the subscription if it exists
     if (result && result.data && result.data.subscription) {
       subscription = result.data.subscription;
     } else {
       console.log('Auth state change listener set up without subscription');
     }
   } catch (error) {
     console.error('Error setting up auth state change listener:', error);
   }
   ```

2. **Properly Handle Async Auth Operations**:
   ```typescript
   export async function onAuthStateChange(callback: Function) {
     try {
       // Check if we should use the real backend
       const useReal = await useRealBackend();

       if (useReal) {
         const client = await getSupabaseClient();
         return client.auth.onAuthStateChange(callback);
       } else {
         return mockBackend.auth.onAuthStateChange(callback);
       }
     } catch (error) {
       appLog('BackendService', 'Auth state change setup failed, falling back to mock', 'error', error);
       return mockBackend.auth.onAuthStateChange(callback);
     }
   }
   ```

## Deployment Issues

### Symptoms

- Application works locally but fails when deployed
- Routing issues in production
- Assets not loading in production
- Environment variable issues

### Root Causes

1. **Base Path Configuration**: Incorrect base path in Vite configuration.
2. **Router Configuration**: Using BrowserRouter instead of HashRouter for GitHub Pages.
3. **Environment Variables**: Missing or incorrect environment variables in production.
4. **Build Cache Issues**: Stale build cache causing inconsistent builds.

### Solutions

1. **Configure Base Path for GitHub Pages**:
   ```typescript
   // vite.config.ts
   export default defineConfig({
     plugins: [react()],
     base: '/alice-reader-app-final/', // Must match repository name exactly
     // ...
   });
   ```

2. **Use HashRouter for GitHub Pages**:
   ```typescript
   // For GitHub Pages, use HashRouter instead of BrowserRouter
   import { HashRouter as Router } from 'react-router-dom';

   function App() {
     return (
       <Router>
         {/* Routes */}
       </Router>
     );
   }
   ```

3. **Verify Environment Variables**:
   - GitHub Actions workflow automatically creates `.env.production` file with secrets
   - Ensure all required variables are set in GitHub repository secrets
   - Add fallbacks for critical variables:
   ```typescript
   const apiUrl = import.meta.env.VITE_API_URL || 'https://default-api.example.com';
   ```

4. **Clear Build Cache**:
   - The GitHub Actions workflow includes steps to clear npm and Vite cache
   - For local builds, you can run:
   ```bash
   npm cache clean --force
   rm -rf node_modules/.vite
   ```

## Performance Problems

### Symptoms

- Slow application startup
- Laggy UI interactions
- High memory usage
- Console warnings about performance

### Root Causes

1. **Inefficient Service Initialization**: Services initializing unnecessarily or in an inefficient order.
2. **Memory Leaks**: Components not properly cleaning up resources.
3. **Excessive Re-renders**: Components re-rendering too frequently.

### Solutions

1. **Lazy Load Services**:
   ```typescript
   // Only initialize services when needed
   const getService = async (name) => {
     if (!registry.has(name)) {
       await initManager.initialize(name);
     }
     return registry.get(name);
   };
   ```

2. **Implement Memoization**:
   ```typescript
   // Use useMemo and useCallback to prevent unnecessary recalculations
   const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
   const memoizedCallback = useCallback(() => {
     doSomething(a, b);
   }, [a, b]);
   ```

3. **Optimize Component Rendering**:
   ```typescript
   // Use React.memo to prevent unnecessary re-renders
   const MyComponent = React.memo(({ prop1, prop2 }) => {
     // Component implementation
   });
   ```

4. **Clean Up Resources**:
   ```typescript
   useEffect(() => {
     // Set up resource

     return () => {
       // Clean up resource
     };
   }, []);
   ```

## Diagnostic Tools

### Service Status Check

The application includes a Service Status Check tool that can help diagnose initialization issues:

1. Navigate to `/service-status` in the application
2. Check the status of all services
3. Look for any services that failed to initialize
4. Check the console for detailed error messages

### Debug Mode

Enable debug mode to get more detailed logging:

1. Add `?debug=true` to the URL
2. Open the browser console
3. Look for detailed log messages with service initialization information

### Logging

The application uses a structured logging system:

```typescript
appLog('ServiceName', 'Message', 'info|warning|error|success', optionalData);
```

View logs in the browser console or in the LogViewer component (if available in the current view).

### Troubleshooting Scripts

The application includes several scripts to help diagnose issues:

1. **Check for circular dependencies**:
   ```bash
   npm run check-circular-deps
   ```

2. **Verify service initialization**:
   ```bash
   npm run verify-services
   ```

3. **Test backend connection**:
   ```bash
   npm run verify-supabase
   ```

## Common Error Messages and Solutions

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Indirectly exported binding name 'X' is not found" | Circular type dependencies | Use `export type` and direct imports |
| "Can't find variable: isBackendAvailable" | Missing or incorrect import | Ensure `isBackendAvailable` is properly exported and imported |
| "undefined is not an object (evaluating 'data.subscription')" | Auth state listener issues | Add null checks and error handling |
| "Service X is not registered" | Service initialization failure | Check initialization order and dependencies |
| "Failed to connect to backend" | Supabase connection issues | Verify Supabase URL and API key |
| "Verification code is invalid or has already been used" | Invalid verification code | Ensure the code is valid and hasn't been used before |
| "User profile not found" | Database trigger issue | Check Supabase logs for trigger execution errors |

## Preventative Measures

To prevent these issues from occurring in the future:

1. **Automated Checks**:
   - Run `npm run check-circular-deps` before committing changes
   - Use TypeScript's strict mode to catch potential null/undefined errors
   - Add tests for service initialization

2. **Code Organization**:
   - Follow the Service Registry pattern consistently
   - Keep interfaces and implementations separate
   - Use direct imports for services instead of barrel files
   - Document service dependencies clearly

3. **Error Handling**:
   - Add comprehensive error handling for all async operations
   - Use fallbacks for critical functionality
   - Log detailed error information for debugging

4. **Testing**:
   - Test application initialization thoroughly
   - Test with both mock and real backends
   - Test authentication flows comprehensively
   - Test with network throttling and intermittent connectivity

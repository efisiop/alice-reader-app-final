// src/services/initOrder.ts
import { SERVICE_DEPENDENCIES } from './dependencies';
import { appLog } from '../components/LogViewer';

/**
 * Get the initialization order for services using topological sorting
 * 
 * This ensures that services are initialized in the correct order,
 * with dependencies initialized before the services that depend on them.
 * 
 * @returns Array of service names in initialization order
 */
export function getInitializationOrder(): string[] {
  const visited = new Set<string>();
  const result: string[] = [];
  const temporaryMark = new Set<string>();
  
  function visit(serviceName: string): void {
    // Check for circular dependencies
    if (temporaryMark.has(serviceName)) {
      const cycle = Array.from(temporaryMark).join(' -> ') + ` -> ${serviceName}`;
      appLog('InitOrder', `Circular dependency detected: ${cycle}`, 'error');
      console.error(`Circular dependency detected: ${cycle}`);
      return;
    }
    
    // Skip if already visited
    if (visited.has(serviceName)) return;
    
    // Mark temporarily for cycle detection
    temporaryMark.add(serviceName);
    
    // Visit dependencies first
    const dependencies = SERVICE_DEPENDENCIES[serviceName] || [];
    for (const dep of dependencies) {
      visit(dep);
    }
    
    // Mark as visited and add to result
    visited.add(serviceName);
    temporaryMark.delete(serviceName);
    result.push(serviceName);
  }
  
  // Visit all services
  for (const service of Object.keys(SERVICE_DEPENDENCIES)) {
    if (!visited.has(service)) {
      visit(service);
    }
  }
  
  appLog('InitOrder', `Initialization order: ${result.join(', ')}`, 'info');
  return result;
}

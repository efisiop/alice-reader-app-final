// scripts/generate-service-wrappers.js
const fs = require('fs');
const path = require('path');

// Configuration
const SERVICES_DIR = path.resolve(__dirname, '../src/services');
const OUTPUT_DIR = path.resolve(__dirname, '../src/services/generated');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Process a service file to extract exports and generate a wrapper
function processServiceFile(filePath) {
  console.log(`Processing ${filePath}`);
  
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract service name from file path
  const fileName = path.basename(filePath);
  const serviceName = fileName.replace('.ts', '');
  
  // Extract exported functions using regex
  const exportRegex = /export\s+(?:const|function)\s+(\w+)/g;
  const exportedFunctions = [];
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    exportedFunctions.push(match[1]);
  }
  
  // Extract interface name and methods
  const interfaceRegex = /export\s+interface\s+(\w+)(?:\s+extends\s+\w+)?\s*{([^}]*)}/gs;
  let interfaceName = `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Interface`;
  let interfaceMethods = [];
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const name = match[1];
    const methods = match[2];
    
    // If this is the main service interface
    if (name.includes('Interface') && name.toLowerCase().includes(serviceName.toLowerCase())) {
      interfaceName = name;
      
      // Extract method names
      const methodRegex = /(\w+)\s*:/g;
      let methodMatch;
      while ((methodMatch = methodRegex.exec(methods)) !== null) {
        interfaceMethods.push(methodMatch[1]);
      }
    }
  }
  
  // Generate wrapper
  const wrapperContent = generateWrapper(serviceName, interfaceName, interfaceMethods, exportedFunctions);
  
  // Write wrapper to file
  const outputPath = path.join(OUTPUT_DIR, `${serviceName}.generated.ts`);
  fs.writeFileSync(outputPath, wrapperContent);
  console.log(`Generated wrapper for ${serviceName} at ${outputPath}`);
}

// Generate wrapper content
function generateWrapper(serviceName, interfaceName, interfaceMethods, exportedFunctions) {
  const serviceNameConstant = serviceName.toUpperCase();
  
  return `// Generated wrapper for ${serviceName}
import { registry, SERVICE_NAMES } from '../registry';
import { initManager } from '../initManager';
import { appLog } from '../../components/LogViewer';

// Import original service for type information
import { ${interfaceName} } from '../${serviceName}';

console.log('Loading generated ${serviceName} module');

// Create service factory
const create${interfaceName} = async (): Promise<${interfaceName}> => {
  appLog('${serviceName}', 'Creating ${serviceName}', 'info');
  console.log('Creating ${serviceName}');
  
  // Import the original service implementation
  const { default: originalService } = await import('../${serviceName}');
  
  return originalService;
};

// Register initialization function
console.log(\`Registering initialization function for ${serviceName}\`);
initManager.register(SERVICE_NAMES.${serviceNameConstant}, async () => {
  console.log(\`Creating ${serviceName} for registration\`);
  const service = await create${interfaceName}();
  console.log(\`Registering ${serviceName} in registry\`);
  registry.register(SERVICE_NAMES.${serviceNameConstant}, service);
  console.log(\`${serviceName} registered successfully\`);
}, []); // No dependencies for now

// Create backward-compatible exports
const createBackwardCompatibleMethod = <T extends any[], R>(
  methodName: string
): ((...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R> => {
    // Ensure service is initialized
    if (!registry.has(SERVICE_NAMES.${serviceNameConstant})) {
      await initManager.initializeService(SERVICE_NAMES.${serviceNameConstant});
    }
    
    // Get service from registry
    const service = registry.get<${interfaceName}>(SERVICE_NAMES.${serviceNameConstant});
    
    // Call method
    return service[methodName](...args);
  };
};

// Export for backward compatibility
${interfaceMethods.map(method => `export const ${method} = createBackwardCompatibleMethod('${method}');`).join('\n')}

// Default export for backward compatibility
export default {
  ${interfaceMethods.join(',\n  ')}
};

console.log('${serviceName} generated module loaded');
`;
}

// Process all service files
function processServices() {
  const serviceFiles = fs.readdirSync(SERVICES_DIR)
    .filter(file => 
      file.endsWith('Service.ts') && 
      !file.includes('.test.') && 
      !file.includes('.generated.')
    )
    .map(file => path.join(SERVICES_DIR, file));
  
  for (const filePath of serviceFiles) {
    processServiceFile(filePath);
  }
}

// Main function
function generateServiceWrappers() {
  processServices();
  console.log(`Service wrappers generated in ${OUTPUT_DIR}`);
}

generateServiceWrappers();

// Debug script for GitHub Pages deployment
console.log('Debug script loaded');

// Check if we're running on GitHub Pages
const isGitHubPages = window.location.hostname.includes('github.io');
console.log('Running on GitHub Pages:', isGitHubPages);

// Log the base URL
console.log('Base URL:', window.location.origin + window.location.pathname);

// Check if the Supabase environment variables are available
console.log('Supabase URL available:', !!window.SUPABASE_URL);
console.log('Supabase Key available:', !!window.SUPABASE_KEY);

// Create a debug element on the page
function createDebugElement() {
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.bottom = '10px';
    debugDiv.style.right = '10px';
    debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugDiv.style.color = 'white';
    debugDiv.style.padding = '10px';
    debugDiv.style.borderRadius = '5px';
    debugDiv.style.fontFamily = 'monospace';
    debugDiv.style.zIndex = '9999';
    debugDiv.style.maxWidth = '400px';
    debugDiv.style.maxHeight = '300px';
    debugDiv.style.overflow = 'auto';
    
    debugDiv.innerHTML = `
        <h3>Debug Info</h3>
        <p>GitHub Pages: ${isGitHubPages}</p>
        <p>Base URL: ${window.location.origin + window.location.pathname}</p>
        <p>Supabase URL: ${!!window.SUPABASE_URL}</p>
        <p>Supabase Key: ${!!window.SUPABASE_KEY}</p>
        <p>User Agent: ${navigator.userAgent}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
    `;
    
    document.body.appendChild(debugDiv);
}

// Add the debug element when the page loads
window.addEventListener('load', createDebugElement);

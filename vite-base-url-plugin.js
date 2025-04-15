// vite-base-url-plugin.js
export default function baseUrlPlugin() {
  return {
    name: 'base-url-plugin',
    transformIndexHtml(html, { path }) {
      return html.replace(/%BASE_URL%/g, path.startsWith('/') ? path : '/' + path);
    }
  };
}

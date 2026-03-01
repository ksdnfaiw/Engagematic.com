import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

document.documentElement.style.setProperty('--font-geist-sans', 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
document.documentElement.style.setProperty('--font-geist-mono', '"Courier New", Courier, monospace');

createRoot(rootElement).render(
  <ErrorBoundary
    fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          The app failed to load. Check the browser console (F12) for errors, or try refreshing.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          Refresh page
        </button>
      </div>
    }
  >
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </ErrorBoundary>
);

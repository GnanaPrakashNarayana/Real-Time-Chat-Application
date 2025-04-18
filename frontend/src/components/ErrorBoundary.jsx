// frontend/src/components/ErrorBoundary.jsx
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, errorMessage: error.toString() };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex-1 flex items-center justify-center p-6 bg-base-100">
          <div className="text-center p-6 bg-base-200 rounded-lg max-w-md">
            <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
            <p className="mb-4 text-base-content/70">
              {this.state.errorMessage || "An unexpected error occurred"}
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
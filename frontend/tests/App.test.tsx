import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../src/App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('App', () => {
  it('should render home page by default', () => {
    renderWithProviders(<App />);
    
    expect(screen.getByText('Cuentas Claras')).toBeInTheDocument();
    expect(screen.getByText('Chocolate Espeso')).toBeInTheDocument();
  });

  it('should have join plan section', () => {
    renderWithProviders(<App />);
    
    expect(screen.getByText('Unirse a un plan')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('XXXX-XXXX')).toBeInTheDocument();
  });

  it('should have create plan section', () => {
    renderWithProviders(<App />);
    
    expect(screen.getByText('Crear nuevo plan')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej: Paseo a Melgar')).toBeInTheDocument();
  });
});

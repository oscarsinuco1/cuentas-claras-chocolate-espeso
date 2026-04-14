import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl font-bold text-text-primary">
          Página no encontrada
        </h1>
        <p className="text-text-secondary">
          La página que buscas no existe
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-5 h-5" />
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}


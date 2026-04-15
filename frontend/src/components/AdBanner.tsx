import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdBannerProps {
  /**
   * Tu data-ad-slot de Google AdSense
   * Obtenerlo en: https://www.google.com/adsense
   */
  adSlot: string;
  /**
   * Formato del anuncio
   * - 'auto': Responsive automático (recomendado)
   * - 'horizontal': Banner horizontal
   * - 'rectangle': Rectángulo mediano
   */
  format?: 'auto' | 'horizontal' | 'rectangle';
  /**
   * Clase CSS adicional para el contenedor
   */
  className?: string;
}

export default function AdBanner({ 
  adSlot, 
  format = 'auto',
  className = '' 
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Solo cargar el anuncio una vez
    if (isLoaded.current) return;
    
    try {
      // Verificar que el script de AdSense esté cargado
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
        isLoaded.current = true;
      }
    } catch (error) {
      console.error('Error loading ad:', error);
    }
  }, []);

  // Estilos según el formato
  const formatStyles: Record<string, React.CSSProperties> = {
    auto: { display: 'block' },
    horizontal: { display: 'inline-block', width: '100%', height: '90px' },
    rectangle: { display: 'inline-block', width: '300px', height: '250px' },
  };

  // En desarrollo, mostrar placeholder
  const isDev = import.meta.env.DEV;
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXX';

  if (isDev) {
    return (
      <div className={`ad-container ${className}`}>
        <div 
          className="flex items-center justify-center rounded-xl text-text-muted text-xs"
          style={{ 
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            border: '1px dashed rgba(59, 130, 246, 0.2)',
            minHeight: format === 'rectangle' ? '250px' : '90px',
            padding: '1rem'
          }}
        >
          📢 Espacio publicitario (slot: {adSlot})
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={formatStyles[format]}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format={format === 'auto' ? 'auto' : undefined}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  );
}

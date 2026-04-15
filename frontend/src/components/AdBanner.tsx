import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// 🚨 TEMPORAL: Cambiar a false cuando Google apruebe los anuncios
const ADS_DISABLED = true;

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
  // 🚨 Si los anuncios están deshabilitados, no renderizar nada
  if (ADS_DISABLED) {
    return null;
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);
  const [hasAd, setHasAd] = useState(true);

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
      setHasAd(false);
    }
  }, []);

  // Observar si el anuncio tiene contenido después de un tiempo
  useEffect(() => {
    const checkAdLoaded = setTimeout(() => {
      if (adRef.current) {
        // Verificar si el ins tiene contenido (iframe o similar)
        const hasContent = adRef.current.childElementCount > 0 || 
                          adRef.current.innerHTML.trim().length > 0;
        
        // También verificar si tiene altura (anuncio renderizado)
        const hasHeight = adRef.current.offsetHeight > 0;
        
        if (!hasContent && !hasHeight) {
          setHasAd(false);
        }
      }
    }, 3000); // Esperar 3 segundos para que cargue

    return () => clearTimeout(checkAdLoaded);
  }, []);

  // Estilos según el formato
  const formatStyles: Record<string, React.CSSProperties> = {
    auto: { display: 'block' },
    horizontal: { display: 'inline-block', width: '100%', height: '90px' },
    rectangle: { display: 'inline-block', width: '300px', height: '250px' },
  };

  // En desarrollo, mostrar placeholder
  const isDev = import.meta.env.DEV;
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-5389240975670392';

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

  // Si no hay anuncio, no renderizar nada
  if (!hasAd) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`ad-container ${className}`}
      style={{ minHeight: 0 }} // Colapsar si está vacío
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          ...formatStyles[format],
          minHeight: 0, // Permitir colapsar
        }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format={format === 'auto' ? 'auto' : undefined}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  );
}

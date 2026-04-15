import { useState } from 'react';
import { X, Check, RefreshCw } from 'lucide-react';
import { getAvatarUrl, generateAvatarSeed } from '@/utils/avatar';

interface AvatarPickerProps {
  currentSeed?: string | null;
  name: string;
  onSelect: (seed: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ currentSeed, name, onSelect, onClose }: AvatarPickerProps) {
  // Generar opciones de avatares
  const [options, setOptions] = useState<string[]>(() => {
    const seeds: string[] = [];
    // Incluir el actual si existe
    if (currentSeed) {
      seeds.push(currentSeed);
    }
    // Generar 11 opciones más (o 12 si no hay actual)
    const count = currentSeed ? 11 : 12;
    for (let i = 0; i < count; i++) {
      seeds.push(generateAvatarSeed());
    }
    return seeds;
  });
  
  const [selected, setSelected] = useState<string>(currentSeed || options[0]);

  const regenerateOptions = () => {
    const newSeeds: string[] = [selected]; // Mantener el seleccionado
    for (let i = 0; i < 11; i++) {
      newSeeds.push(generateAvatarSeed());
    }
    setOptions(newSeeds);
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl animate-slide-up" style={{ backgroundColor: '#141414' }}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2D2E2F' }}>
          <h2 className="text-lg font-bold text-text-primary">Elige tu avatar</h2>
          <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-white/10">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 flex flex-col items-center gap-2" style={{ borderBottom: '1px solid #2D2E2F' }}>
          <img 
            src={getAvatarUrl(selected, name)} 
            alt="Avatar seleccionado"
            className="w-24 h-24 rounded-2xl shadow-lg"
          />
          <p className="text-sm text-text-secondary">{name}</p>
        </div>

        {/* Grid de opciones */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-muted">Selecciona uno:</p>
            <button 
              onClick={regenerateOptions}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors text-primary-400 hover:bg-primary-400/10"
            >
              <RefreshCw className="w-3 h-3" />
              Más opciones
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {options.map((seed) => (
              <button
                key={seed}
                onClick={() => setSelected(seed)}
                className={`relative p-1 rounded-xl transition-all ${
                  selected === seed 
                    ? 'ring-2 ring-primary-400 bg-primary-400/20' 
                    : 'hover:bg-white/5'
                }`}
              >
                <img 
                  src={getAvatarUrl(seed, name)} 
                  alt="Opción de avatar"
                  className="w-full aspect-square rounded-lg"
                />
                {selected === seed && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-400 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 flex gap-2" style={{ borderTop: '1px solid #2D2E2F' }}>
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-semibold transition-colors text-text-secondary hover:bg-white/5"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl font-semibold bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

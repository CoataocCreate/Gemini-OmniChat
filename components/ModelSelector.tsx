import React, { useState } from 'react';
import { AVAILABLE_MODELS, ModelId } from '../types';
import { Cpu, Zap, Brain, Sparkles } from 'lucide-react';

interface ModelSelectorProps {
  currentModel: ModelId;
  onSelect: (modelId: ModelId) => void;
  disabled: boolean;
  compact?: boolean;
  direction?: 'top' | 'bottom';
}

const getModelIcon = (id: ModelId) => {
  switch (id) {
    case ModelId.LITE: return <Zap className="w-3.5 h-3.5" />;
    case ModelId.FLASH: return <Cpu className="w-3.5 h-3.5" />;
    case ModelId.THINKING: return <Brain className="w-3.5 h-3.5" />;
    case ModelId.PRO: return <Sparkles className="w-3.5 h-3.5" />;
    default: return <Cpu className="w-3.5 h-3.5" />;
  }
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  currentModel, 
  onSelect, 
  disabled,
  compact = false,
  direction = 'bottom'
}) => {
  const [hoveredModel, setHoveredModel] = useState<ModelId | null>(null);

  // Determine active config for description
  const activeId = hoveredModel || currentModel;
  const activeModelConfig = AVAILABLE_MODELS.find(m => m.id === activeId);

  return (
    <div className="relative group/selector w-full">
      {/* Toggle Grid */}
      <div className={`grid gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800 w-full ${
        compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
      }`}>
        {AVAILABLE_MODELS.map((model) => {
          const isActive = model.id === currentModel;
          return (
            <button
              key={model.id}
              onClick={() => onSelect(model.id)}
              onMouseEnter={() => setHoveredModel(model.id)}
              onMouseLeave={() => setHoveredModel(null)}
              disabled={disabled}
              className={`relative flex items-center justify-center gap-1.5 py-2 rounded-[6px] transition-all duration-200 ${
                isActive 
                  ? 'bg-zinc-100 text-black shadow-sm' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {getModelIcon(model.id)}
              <span className={`text-[11px] font-semibold tracking-tight whitespace-nowrap ${isActive ? 'text-black' : 'text-current'}`}>
                {model.name}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Floating Description Tooltip */}
      <div className={`absolute left-0 right-0 z-30 pointer-events-none opacity-0 group-hover/selector:opacity-100 transition-opacity duration-200 flex justify-center ${
        direction === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
      }`}>
        <div className="bg-zinc-950/95 backdrop-blur border border-zinc-800 px-3 py-2 rounded-lg shadow-xl max-w-[250px]">
          <p className="text-[11px] text-zinc-400 text-center font-medium leading-tight">
            {activeModelConfig?.description}
          </p>
        </div>
      </div>
    </div>
  );
};
export enum AppState {
    IDLE = 'IDLE',
    GENERATING_DATA = 'GENERATING_DATA',
    GENERATING_IMAGE = 'GENERATING_IMAGE',
    PROCESSING_SILHOUETTE = 'PROCESSING_SILHOUETTE',
    COMPLETE = 'COMPLETE',
    ERROR = 'ERROR'
  }
  
  export interface Attack {
    name: string;
    cost: string;
    damage: string;
    description: string;
  }
  
  export interface PokemonData {
    name: string;
    type: string;
    hp: string;
    description: string;
    evolution: string;
    visualPrompt: string;
    attacks: Attack[];
    weakness: string;
    resistance: string;
    retreatCost: number;
    script: string;
  }
  
  export interface GeneratedAssets {
    data: PokemonData | null;
    originalImageBase64: string | null;
    silhouetteImageBase64: string | null;
    gallery: string[];
    scriptAudioUrl: string | null;
    introAudioUrl: string | null;
    outroAudioUrl: string | null;
  }
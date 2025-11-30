import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  category: 'navigation' | 'selection' | 'editing' | 'view' | 'general';
  defaultKey: string;
  currentKey: string;
  modifiers: {
    alt?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  enabled: boolean;
}

interface KeyboardShortcutsState {
  shortcuts: KeyboardShortcut[];
  setShortcut: (id: string, newKey: string, modifiers?: KeyboardShortcut['modifiers']) => void;
  resetShortcut: (id: string) => void;
  resetAllShortcuts: () => void;
  toggleShortcut: (id: string, enabled: boolean) => void;
  getShortcut: (id: string) => KeyboardShortcut | undefined;
  getShortcutsByCategory: (category: KeyboardShortcut['category']) => KeyboardShortcut[];
  formatShortcut: (shortcut: KeyboardShortcut) => string;
  isShortcutMatch: (shortcut: KeyboardShortcut, e: KeyboardEvent) => boolean;
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'move-up',
    name: 'Mover para cima',
    description: 'Selecionar atividade anterior',
    category: 'navigation',
    defaultKey: 'ArrowUp',
    currentKey: 'ArrowUp',
    modifiers: {},
    enabled: true
  },
  {
    id: 'move-down',
    name: 'Mover para baixo',
    description: 'Selecionar próxima atividade',
    category: 'navigation',
    defaultKey: 'ArrowDown',
    currentKey: 'ArrowDown',
    modifiers: {},
    enabled: true
  },
  {
    id: 'select-extend-up',
    name: 'Estender seleção para cima',
    description: 'Adicionar atividade anterior à seleção',
    category: 'selection',
    defaultKey: 'ArrowUp',
    currentKey: 'ArrowUp',
    modifiers: { shift: true },
    enabled: true
  },
  {
    id: 'select-extend-down',
    name: 'Estender seleção para baixo',
    description: 'Adicionar próxima atividade à seleção',
    category: 'selection',
    defaultKey: 'ArrowDown',
    currentKey: 'ArrowDown',
    modifiers: { shift: true },
    enabled: true
  },
  {
    id: 'indent-task',
    name: 'Recuar atividade',
    description: 'Tornar subordinada à atividade anterior',
    category: 'editing',
    defaultKey: 'ArrowRight',
    currentKey: 'ArrowRight',
    modifiers: { shift: true },
    enabled: true
  },
  {
    id: 'outdent-task',
    name: 'Promover atividade',
    description: 'Mover para nível hierárquico superior',
    category: 'editing',
    defaultKey: 'ArrowLeft',
    currentKey: 'ArrowLeft',
    modifiers: { shift: true },
    enabled: true
  },
  {
    id: 'zoom-in',
    name: 'Aumentar zoom',
    description: 'Aproximar visualização do cronograma',
    category: 'view',
    defaultKey: 'Equal',
    currentKey: 'Equal',
    modifiers: { ctrl: true },
    enabled: true
  },
  {
    id: 'zoom-out',
    name: 'Diminuir zoom',
    description: 'Afastar visualização do cronograma',
    category: 'view',
    defaultKey: 'Minus',
    currentKey: 'Minus',
    modifiers: { ctrl: true },
    enabled: true
  },
  {
    id: 'toggle-expand',
    name: 'Expandir/Recolher',
    description: 'Alternar expansão do grupo selecionado',
    category: 'navigation',
    defaultKey: 'Space',
    currentKey: 'Space',
    modifiers: {},
    enabled: true
  },
  {
    id: 'delete-task',
    name: 'Excluir atividade',
    description: 'Remover atividade selecionada',
    category: 'editing',
    defaultKey: 'Delete',
    currentKey: 'Delete',
    modifiers: {},
    enabled: true
  },
  {
    id: 'edit-task',
    name: 'Editar atividade',
    description: 'Abrir diálogo de edição',
    category: 'editing',
    defaultKey: 'Enter',
    currentKey: 'Enter',
    modifiers: {},
    enabled: true
  },
  {
    id: 'select-all',
    name: 'Selecionar todas',
    description: 'Selecionar todas as atividades visíveis',
    category: 'selection',
    defaultKey: 'KeyA',
    currentKey: 'KeyA',
    modifiers: { ctrl: true },
    enabled: true
  },
  {
    id: 'escape',
    name: 'Cancelar',
    description: 'Cancelar ação atual ou limpar seleção',
    category: 'general',
    defaultKey: 'Escape',
    currentKey: 'Escape',
    modifiers: {},
    enabled: true
  },
  {
    id: 'undo',
    name: 'Desfazer',
    description: 'Reverter última alteração',
    category: 'general',
    defaultKey: 'KeyZ',
    currentKey: 'KeyZ',
    modifiers: { ctrl: true },
    enabled: true
  },
  {
    id: 'redo',
    name: 'Refazer',
    description: 'Aplicar alteração revertida',
    category: 'general',
    defaultKey: 'KeyY',
    currentKey: 'KeyY',
    modifiers: { ctrl: true },
    enabled: true
  }
];

const formatModifiers = (modifiers: KeyboardShortcut['modifiers']): string => {
  const parts: string[] = [];
  if (modifiers.ctrl) parts.push('Ctrl');
  if (modifiers.alt) parts.push('Alt');
  if (modifiers.shift) parts.push('Shift');
  if (modifiers.meta) parts.push('Cmd');
  return parts.join('+');
};

const formatKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Space': 'Space',
    'Enter': 'Enter',
    'Escape': 'Esc',
    'Delete': 'Del',
    'Backspace': 'Backspace',
    'Tab': 'Tab',
    'Equal': '+',
    'Minus': '-',
    'KeyA': 'A',
    'KeyZ': 'Z',
    'KeyY': 'Y'
  };
  return keyMap[key] || key;
};

export const useKeyboardShortcutsStore = create<KeyboardShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: DEFAULT_SHORTCUTS,

      setShortcut: (id, newKey, modifiers) => {
        set((state) => ({
          shortcuts: state.shortcuts.map((s) =>
            s.id === id
              ? { ...s, currentKey: newKey, modifiers: modifiers ?? s.modifiers }
              : s
          )
        }));
      },

      resetShortcut: (id) => {
        set((state) => ({
          shortcuts: state.shortcuts.map((s) =>
            s.id === id
              ? { ...s, currentKey: s.defaultKey, modifiers: DEFAULT_SHORTCUTS.find(d => d.id === id)?.modifiers ?? s.modifiers }
              : s
          )
        }));
      },

      resetAllShortcuts: () => {
        set({ shortcuts: DEFAULT_SHORTCUTS });
      },

      toggleShortcut: (id, enabled) => {
        set((state) => ({
          shortcuts: state.shortcuts.map((s) =>
            s.id === id ? { ...s, enabled } : s
          )
        }));
      },

      getShortcut: (id) => {
        return get().shortcuts.find((s) => s.id === id);
      },

      getShortcutsByCategory: (category) => {
        return get().shortcuts.filter((s) => s.category === category);
      },

      formatShortcut: (shortcut) => {
        const modifierStr = formatModifiers(shortcut.modifiers);
        const keyStr = formatKey(shortcut.currentKey);
        return modifierStr ? `${modifierStr}+${keyStr}` : keyStr;
      },

      isShortcutMatch: (shortcut, e) => {
        if (!shortcut.enabled) return false;
        
        const modifiersMatch = 
          (!!shortcut.modifiers.alt === e.altKey) &&
          (!!shortcut.modifiers.ctrl === e.ctrlKey) &&
          (!!shortcut.modifiers.shift === e.shiftKey) &&
          (!!shortcut.modifiers.meta === e.metaKey);
        
        const keyMatch = e.code === shortcut.currentKey || e.key === shortcut.currentKey;
        
        return modifiersMatch && keyMatch;
      }
    }),
    {
      name: 'visionplan-keyboard-shortcuts',
      version: 1
    }
  )
);

export const SHORTCUT_CATEGORIES = {
  navigation: { label: 'Navegação', icon: 'Navigation' },
  selection: { label: 'Seleção', icon: 'MousePointer' },
  editing: { label: 'Edição', icon: 'Edit' },
  view: { label: 'Visualização', icon: 'Eye' },
  general: { label: 'Geral', icon: 'Settings' }
} as const;

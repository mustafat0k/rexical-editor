/**
 * Cangjie Input Method Handler for Lexical
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  TextNode,
} from 'lexical';
import {useCallback, useEffect, useMemo, useState} from 'react';
import * as React from 'react';
import {createPortal} from 'react-dom';

import {CANGJIE_DICTIONARY as BASIC_DICTIONARY} from './cangjieData';
// Inlining the Data Bridge for offline-first bundling
import CANGJIE_DATA_BRIDGE from './cangjie5.json';

const CANGJIE_MAP = new Map<string, string[]>();

Object.entries(BASIC_DICTIONARY).forEach(([k, w]) => {
  CANGJIE_MAP.set(k, w);
});

CANGJIE_DATA_BRIDGE.forEach((item: any) => {
  const existing = CANGJIE_MAP.get(item.k) || [];
  const newChars = Array.isArray(item.w) ? item.w : [item.w];
  const combined = Array.from(new Set([...existing, ...newChars]));
  CANGJIE_MAP.set(item.k, combined);
});

class CangjieOption extends MenuOption {
  character: string;
  code: string;
  originalIndex: number;

  constructor(character: string, code: string, index: number) {
    super(code + character + index);
    this.character = character;
    this.code = code;
    this.originalIndex = index;
  }
}

function CangjieMenuItem({
  isSelected,
  onClick,
  onMouseEnter,
  option,
  index,
}: {
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: CangjieOption;
  index: number;
}) {
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={`item ${isSelected ? 'selected' : ''}`}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 16px',
        cursor: 'pointer',
        borderRadius: '6px',
        background: isSelected ? 'var(--ime-active-item-bg, #3b5998)' : 'transparent',
        color: isSelected ? 'var(--ime-active-item-text, #fff)' : 'var(--ime-menu-text, #333)',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease'
      }}>
      <span style={{ color: isSelected ? '#ddd' : 'var(--ime-index-color, #888)', marginRight: '8px', fontSize: '0.9em', minWidth: '1.2em' }}>
        {index + 1}
      </span>
      <span style={{ fontSize: '1.3em', fontWeight: 500 }}>
        {option.character}
      </span>
    </li>
  );
}

function CangjieMenu({
  options,
  selectedIndex,
  selectOptionAndCleanUp,
  setHighlightedIndex,
}: {
  options: CangjieOption[];
  selectedIndex: number | null;
  selectOptionAndCleanUp: (option: CangjieOption) => void;
  setHighlightedIndex: (index: number) => void;
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const {key} = event;
      if (key === ' ' && options.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        selectOptionAndCleanUp(options[selectedIndex ?? 0]);
        return;
      }
      const num = parseInt(key, 10);
      if (!isNaN(num) && num > 0 && num <= options.length && num <= 9) {
        event.preventDefault();
        event.stopPropagation();
        selectOptionAndCleanUp(options[num - 1]);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [options, selectOptionAndCleanUp, selectedIndex]);

  return (
    <div className="typeahead-menu cangjie-menu" style={{ 
      zIndex: 10000,
      marginTop: '25px'
    }}>
      <ul style={{
        display: 'flex',
        flexDirection: 'row',
        margin: 0,
        padding: '8px',
        listStyle: 'none',
        background: 'var(--ime-menu-bg, #fff)',
        border: '1px solid var(--ime-menu-border, #ddd)',
        borderRadius: '8px',
        boxShadow: 'var(--ime-menu-shadow, 0 4px 12px rgba(0,0,0,0.15))',
        whiteSpace: 'nowrap',
        overflow: 'visible',
        width: 'auto',
        minWidth: 'fit-content',
        maxWidth: '90vw'
      }}>
        {options.slice(0, 9).map((option, i) => (
          <CangjieMenuItem
            key={option.key}
            isSelected={selectedIndex === i}
            onClick={() => {
              setHighlightedIndex(i);
              selectOptionAndCleanUp(option);
            }}
            onMouseEnter={() => {
              setHighlightedIndex(i);
            }}
            option={option}
            index={i}
          />
        ))}
      </ul>
    </div>
  );
}

export default function CangjieHandler({
  enabled = true,
}: {
  enabled?: boolean;
}): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const triggerFn = useCallback((text: string) => {
    if (!enabled) return null;
    const match = /(?:^|\s|[^a-zA-Z])([a-y]{1,5})$/.exec(text);
    if (match) {
      const code = match[1];
      if (CANGJIE_MAP.has(code)) {
        return {
          leadOffset: match.index + (match[0].length - code.length),
          matchingString: code,
          replaceableString: code,
        };
      }
    }
    return null;
  }, [enabled]);

  const options = useMemo(() => {
    if (!enabled || !queryString) return [];
    const candidates = CANGJIE_MAP.get(queryString) || [];
    return candidates.map((char, index) => new CangjieOption(char, queryString, index));
  }, [queryString, enabled]);

  const onSelectOption = useCallback(
    (
      selectedOption: CangjieOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selectedOption == null) {
          return;
        }
        if (nodeToRemove) {
          nodeToRemove.remove();
        }
        selection.insertNodes([$createTextNode(selectedOption.character)]);
        closeMenu();
      });
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<CangjieOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={triggerFn}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        {selectedIndex, selectOptionAndCleanUp, setHighlightedIndex},
      ) =>
        anchorElementRef.current && options.length
          ? createPortal(
              <CangjieMenu
                options={options}
                selectedIndex={selectedIndex}
                selectOptionAndCleanUp={selectOptionAndCleanUp}
                setHighlightedIndex={setHighlightedIndex}
              />,
              anchorElementRef.current,
            )
          : null
      }
    />
  );
}

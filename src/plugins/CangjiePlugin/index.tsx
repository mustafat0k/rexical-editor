/**
 * Cangjie Input Method Plugin for Lexical
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  TextNode,
} from 'lexical';
import {useCallback, useEffect, useMemo, useState} from 'react';
import * as React from 'react';
import {createPortal} from 'react-dom';

import {CANGJIE_DICTIONARY} from './cangjieData';

class CangjieOption extends MenuOption {
  character: string;
  code: string;
  index: number;

  constructor(character: string, code: string, index: number) {
    super(character + index); // Unique key
    this.character = character;
    this.code = code;
    this.index = index;
  }
}

function CangjieMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: CangjieOption;
}) {
  let className = 'item';
  if (isSelected) {
    className += ' selected';
  }
  return (
    <li
      key={(option as any).key}
      tabIndex={-1}
      className={className}
      ref={(option as any).setRefElement}
      role="option"
      aria-selected={isSelected}
      onMouseEnter={onMouseEnter}
      onClick={onClick}>
      <span className="text">
        <span style={{ color: '#888', marginRight: '8px' }}>{option.index + 1}.</span>
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
      const num = parseInt(key, 10);
      if (!isNaN(num) && num > 0 && num <= options.length) {
        event.preventDefault();
        event.stopPropagation();
        selectOptionAndCleanUp(options[num - 1]);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [options, selectOptionAndCleanUp]);

  return (
    <div className="typeahead-menu cangjie-menu">
      <ul style={{
        margin: 0,
        padding: '4px 0',
        listStyle: 'none',
        background: 'var(--cangjie-bg, #fff)',
        border: '1px solid var(--cangjie-border, #ccc)',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        minWidth: '150px'
      }}>
        {options.map((option, i) => (
          <CangjieMenuItem
            key={(option as any).key}
            index={i}
            isSelected={selectedIndex === i}
            onClick={() => {
              setHighlightedIndex(i);
              selectOptionAndCleanUp(option);
            }}
            onMouseEnter={() => {
              setHighlightedIndex(i);
            }}
            option={option}
          />
        ))}
      </ul>
    </div>
  );
}

export default function CangjiePlugin(): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const triggerFn = useCallback((text: string) => {
    const match = /(?:^|\s|[^a-zA-Z])([a-y]{1,5})$/.exec(text);
    if (match) {
      const code = match[1];
      if (CANGJIE_DICTIONARY[code]) {
        return {
          leadOffset: match.index + (match[0].length - code.length),
          matchingString: code,
          replaceableString: code,
        };
      }
    }
    return null;
  }, []);

  const options = useMemo(() => {
    if (!queryString) return [];
    const candidates = CANGJIE_DICTIONARY[queryString] || [];
    return candidates.map((char, index) => new CangjieOption(char, queryString, index));
  }, [queryString]);

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

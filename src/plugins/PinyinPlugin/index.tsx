/**
 * Pinyin Input Method Handler for Lexical
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  $getSelection,
  $isRangeSelection,
  TextNode,
} from 'lexical';
import {useCallback, useMemo, useState} from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Inlining the Data Bridge for offline-first bundling
import {PINYIN_DATA as PINYIN_DATA_BRIDGE} from './pinyinData';

class PinyinOption extends MenuOption {
  char: string;
  index: number;

  constructor(char: string, index: number) {
    super(char + index);
    this.char = char;
    this.index = index;
  }
}

function PinyinMenuItem({
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
  option: PinyinOption;
}) {
  let className = 'item';
  if (isSelected) {
    className += ' selected';
  }
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={className}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      onMouseEnter={onMouseEnter}
      onClick={onClick}>
      <span className="text">
        <span className="number">{index + 1}:</span> {option.char}
      </span>
    </li>
  );
}

export function PinyinHandler({
  enabled = true,
}: {
  enabled?: boolean;
}): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const triggerFn = useCallback((text: string) => {
    if (!enabled) return null;
    // Only match pure lowercase syllables (no uppercase, no digits)
    // Must be an exact key in the Pinyin dictionary to avoid English false-positives
    const match = /(?:^|[^a-z])([a-z]{1,6})$/.exec(text);
    if (match) {
      const syllable = match[1];
      if (PINYIN_DATA_BRIDGE[syllable]) {
        return {
          leadOffset: match.index + (match[0].length - syllable.length),
          matchingString: syllable,
          replaceableString: syllable,
        };
      }
    }
    return null;
  }, [enabled]);

  const options = useMemo(() => {
    if (!queryString) {
      return [];
    }
    const chars = PINYIN_DATA_BRIDGE[queryString] || [];
    return chars.map((char, index) => new PinyinOption(char, index));
  }, [queryString]);

  const onSelectOption = useCallback(
    (
      selectedOption: PinyinOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selectedOption == null) {
          return;
        }

        if (nodeToReplace) {
          nodeToReplace.replace(new TextNode(selectedOption.char));
        }

        closeMenu();
      });
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<PinyinOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={triggerFn}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        {selectedIndex, selectOptionAndCleanUp, setHighlightedIndex},
      ) =>
        anchorElementRef.current && options.length > 0
          ? ReactDOM.createPortal(
              <div className="typeahead-menu pinyin-menu">
                <ul>
                  {options.map((option, i) => (
                    <PinyinMenuItem
                      index={i}
                      isSelected={selectedIndex === i}
                      onClick={() => {
                        setHighlightedIndex(i);
                        selectOptionAndCleanUp(option);
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(i);
                      }}
                      key={option.key}
                      option={option}
                    />
                  ))}
                </ul>
              </div>,
              anchorElementRef.current,
            )
          : null
      }
    />
  );
}

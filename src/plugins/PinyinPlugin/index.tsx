
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  $getSelection,
  $isRangeSelection,
  TextNode,
} from 'lexical';
import {useCallback, useMemo, useState} from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {PINYIN_DATA} from './pinyinData';

class PinyinOption extends MenuOption {
  char: string;
  index: number;

  constructor(char: string, index: number) {
    super(char);
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

export default function PinyinPlugin(): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('', {
    minLength: 1,
    maxLength: 10,
  });

  const options = useMemo(() => {
    if (!queryString) {
      return [];
    }
    const chars = PINYIN_DATA[queryString.toLowerCase()] || [];
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
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
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

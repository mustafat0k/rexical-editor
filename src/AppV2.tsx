/**
 * Version 2 of the Lexical Playground App
 * Supports external props for better integration.
 */

import {DecoratorTextExtension} from '@lexical/extension';
import {LexicalCollaboration} from '@lexical/react/LexicalCollaborationContext';
import {LexicalExtensionComposer} from '@lexical/react/LexicalExtensionComposer';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  defineExtension,
  EditorState,
  LexicalEditor,
} from 'lexical';
import {type JSX, useMemo, useEffect} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

import {isDevPlayground} from './appSettings';
import {buildHTMLConfig} from './buildHTMLConfig';
import {FlashMessageContext} from './context/FlashMessageContext';
import {SettingsContext, useSettings} from './context/SettingsContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import {ToolbarContext} from './context/ToolbarContext';
import Editor from './Editor';
import logo from './images/logo.svg';
import CangjiePlugin from './plugins/CangjiePlugin';
import PinyinPlugin from './plugins/PinyinPlugin';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import DocsPlugin from './plugins/DocsPlugin';
import PasteLogPlugin from './plugins/PasteLogPlugin';
import {TableContext} from './plugins/TablePlugin';
import TestRecorderPlugin from './plugins/TestRecorderPlugin';
import TypingPerfPlugin from './plugins/TypingPerfPlugin';
import Settings from './Settings';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';

interface AppProps {
  initialContent?: string;
  onChange?: (editorState: EditorState) => void;
  darkMode?: boolean;
}

function GlobalStatePlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    (window as any).getEditorContent = () => {
      return JSON.stringify(editor.getEditorState().toJSON());
    };
  }, [editor]);
  return null;
}

function App({initialContent, onChange, darkMode}: AppProps): JSX.Element {
  const {
    settings: {isCollab, emptyEditor, measureTypingPerf, isCangjie, isPinyin},
    setOption,
  } = useSettings();

  const app = useMemo(
    () =>
      defineExtension({
        $initialEditorState: isCollab
          ? null
          : initialContent 
            ? () => {
                const root = $getRoot();
                if (root.getFirstChild() === null) {
                   const p = $createParagraphNode();
                   p.append($createTextNode(initialContent));
                   root.append(p);
                }
              }
            : emptyEditor 
              ? undefined 
              : undefined, // Standard prepopulated text is disabled for cleanliness in v2 unless requested
        dependencies: [DecoratorTextExtension],
        html: buildHTMLConfig(),
        name: '@lexical/playground-v2',
        namespace: 'PlaygroundV2',
        nodes: PlaygroundNodes,
        theme: PlaygroundEditorTheme,
      }),
    [emptyEditor, isCollab, initialContent],
  );

  return (
    <div className={darkMode ? 'lexical-v2-dark' : ''}>
      <LexicalCollaboration>
        <LexicalExtensionComposer extension={app} contentEditable={null}>
          <SharedHistoryContext>
            <TableContext>
              <ToolbarContext>
                <header>
                  <a href="https://lexical.dev" target="_blank" rel="noreferrer">
                    <img src={logo} alt="Lexical Logo" />
                  </a>
                </header>
                <div className="editor-shell">
                  <div className="toolbar-v2">
                    <button
                      type="button"
                      onClick={() => setOption('isCangjie', !isCangjie)}
                      className={'toolbar-item ' + (isCangjie ? 'active' : '')}
                      title="Cangjie IME">
                      <span className="text">倉</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOption('isPinyin', !isPinyin)}
                      className={'toolbar-item ' + (isPinyin ? 'active' : '')}
                      title="Pinyin IME">
                      <span className="text">拼</span>
                    </button>
                  </div>
                  <Editor />
                  <CangjiePlugin enabled={isCangjie} />
                  {isPinyin && <PinyinPlugin />}
                </div>
                <Settings />
                {isDevPlayground ? <DocsPlugin /> : null}
                {isDevPlayground ? <PasteLogPlugin /> : null}
                {isDevPlayground ? <TestRecorderPlugin /> : null}
                {measureTypingPerf ? <TypingPerfPlugin /> : null}
                
                {/* Change Logging Plugin */}
                <OnChangePlugin onChange={(editorState) => {
                  const jsonState = JSON.stringify(editorState.toJSON());
                  console.log('Lexical State Update (JSON):', jsonState);
                  if (onChange) onChange(editorState);
                }} />
                <GlobalStatePlugin />

              </ToolbarContext>
            </TableContext>
          </SharedHistoryContext>
        </LexicalExtensionComposer>
      </LexicalCollaboration>
      
    </div>
  );
}

export default function PlaygroundAppV2(props: AppProps): JSX.Element {
  return (
    <SettingsContext>
      <FlashMessageContext>
        <App {...props} />
      </FlashMessageContext>
    </SettingsContext>
  );
}

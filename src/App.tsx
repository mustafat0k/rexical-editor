/**
 * Professional Lexical Playground Entry
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
import CangjieHandler from './plugins/CangjiePlugin';
import PinyinHandler from './plugins/PinyinPlugin';
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

function $prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const p = $createParagraphNode();
    p.append($createTextNode('Professional Lexical Environment Refined. Type "am" (倉) or "ni" (音) to test.'));
    root.append(p);
  }
}

function App({initialContent, onChange, darkMode}: AppProps): JSX.Element {
  const {
    settings: {isCollab, emptyEditor, measureTypingPerf, activeIME},
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
              : $prepopulatedRichText,
        dependencies: [DecoratorTextExtension],
        html: buildHTMLConfig(),
        name: '@lexical/playground',
        namespace: 'Playground',
        nodes: PlaygroundNodes,
        theme: PlaygroundEditorTheme,
      }),
    [emptyEditor, isCollab, initialContent],
  );

  return (
    <div className={darkMode ? 'dark-theme-body' : ''}>
      <LexicalCollaboration>
        <LexicalExtensionComposer extension={app} contentEditable={null}>
          <SharedHistoryContext>
            <TableContext>
              <ToolbarContext>
                <header>
                  <a href="https://lexical.dev" target="_blank" rel="noreferrer">
                    <img src={logo} alt="Lexical Logo" />
                  </a>
                  <div className="toolbar-v2-inline">
                    <button
                      type="button"
                      onClick={() => setOption('activeIME', activeIME === 'cj' ? 'none' : 'cj')}
                      className={'toolbar-item ' + (activeIME === 'cj' ? 'active' : '')}
                      title="Cangjie Handler">
                      <span className="text">倉</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOption('activeIME', activeIME === 'py' ? 'none' : 'py')}
                      className={'toolbar-item ' + (activeIME === 'py' ? 'active' : '')}
                      title="Pinyin Handler">
                      <span className="text">音</span>
                    </button>
                  </div>
                </header>
                <div className="editor-shell">
                  <Editor />
                  <CangjieHandler enabled={activeIME === 'cj'} />
                  {activeIME === 'py' && <PinyinHandler />}
                </div>
                <Settings />
                {isDevPlayground ? <DocsPlugin /> : null}
                {isDevPlayground ? <PasteLogPlugin /> : null}
                {isDevPlayground ? <TestRecorderPlugin /> : null}
                {measureTypingPerf ? <TypingPerfPlugin /> : null}
                
                <OnChangePlugin onChange={(editorState) => {
                  const jsonState = JSON.stringify(editorState.toJSON());
                  console.log('Lexical State Refresh Handler (JSON):', jsonState);
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

export default function PlaygroundApp(props: AppProps): JSX.Element {
  return (
    <SettingsContext>
      <FlashMessageContext>
        <App {...props} />
      </FlashMessageContext>
    </SettingsContext>
  );
}

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
} from 'lexical';
import {type JSX, useMemo} from 'react';

import {isDevPlayground} from './appSettings';
import {buildHTMLConfig} from './buildHTMLConfig';
import {FlashMessageContext} from './context/FlashMessageContext';
import {SettingsContext, useSettings} from './context/SettingsContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import {ToolbarContext} from './context/ToolbarContext';
import Editor from './Editor';
import logo from './images/logo.svg';
import CangjiePlugin from './plugins/CangjiePlugin';
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

function App({initialContent, onChange, darkMode}: AppProps): JSX.Element {
  const {
    settings: {isCollab, emptyEditor, measureTypingPerf},
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
                  <Editor />
                  <CangjiePlugin />
                </div>
                <Settings />
                {isDevPlayground ? <DocsPlugin /> : null}
                {isDevPlayground ? <PasteLogPlugin /> : null}
                {isDevPlayground ? <TestRecorderPlugin /> : null}
                {measureTypingPerf ? <TypingPerfPlugin /> : null}
                
                {/* Change Logging Plugin */}
                <OnChangePlugin onChange={(editorState) => {
                  console.log('Lexical Content Changed:', editorState.toJSON());
                  if (onChange) onChange(editorState);
                }} />

              </ToolbarContext>
            </TableContext>
          </SharedHistoryContext>
        </LexicalExtensionComposer>
      </LexicalCollaboration>
      
      <style>{`
        .lexical-v2-dark .editor-shell {
          background: #111 !important;
          color: #eee !important;
        }
        .lexical-v2-dark .editor-container {
          background: #222 !important;
          border-color: #444 !important;
        }
        .lexical-v2-dark .editor {
           color: #eee !important;
        }
        .lexical-v2-dark .toolbar {
          background: #333 !important;
          border-bottom-color: #444 !important;
        }
        .lexical-v2-dark .toolbar .button {
          color: #ccc !important;
        }
        .lexical-v2-dark .toolbar .button:hover {
          background: #444 !important;
        }
        .lexical-v2-dark .scroller {
           background: #222 !important;
        }
        /* Simple dark mode overrides for playground elements */
        .lexical-v2-dark .ContentEditable__root {
          color: #ccc;
        }
        .lexical-v2-dark .toolbar .button i {
          filter: invert(1);
        }
        .lexical-v2-dark .toolbar .button:hover i {
          filter: invert(1) brightness(1.2);
        }
        .lexical-v2-dark .toolbar .chevron-down {
          filter: invert(1);
        }
        .lexical-v2-dark .toolbar .divider {
          background-color: #444 !important;
        }
        /* Dropdowns and menus */
        .lexical-v2-dark .dropdown {
          background: #333 !important;
          border-color: #444 !important;
          color: #eee !important;
        }
        .lexical-v2-dark .dropdown .item {
          background: #333 !important;
          color: #eee !important;
        }
        .lexical-v2-dark .dropdown .item:hover {
          background: #444 !important;
        }
        .lexical-v2-dark .dropdown .item .icon {
           filter: invert(1);
        }
        .lexical-v2-dark .icon.table {
          background-color: #eee !important;
        }

        /* Cangjie Menu Styles */
        .cangjie-menu {
          --cangjie-bg: #fff;
          --cangjie-border: #ccc;
          --cangjie-text: #333;
          --cangjie-hover: #f0f0f0;
          --cangjie-selected: #e6f7ff;
        }
        .lexical-v2-dark .cangjie-menu {
          --cangjie-bg: #222;
          --cangjie-border: #444;
          --cangjie-text: #eee;
          --cangjie-hover: #333;
          --cangjie-selected: #113a5d;
        }
        .cangjie-menu .item {
          padding: 8px 12px;
          cursor: pointer;
          color: var(--cangjie-text);
          font-size: 16px;
          border-bottom: 1px solid var(--cangjie-border);
        }
        .cangjie-menu .item:last-child {
          border-bottom: none;
        }
        .cangjie-menu .item:hover {
          background-color: var(--cangjie-hover);
        }
        .cangjie-menu .item.selected {
          background-color: var(--cangjie-selected);
        }
      `}</style>
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

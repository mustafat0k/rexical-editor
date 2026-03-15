import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '../../..'); // Root of d:/s1/
const DIST_ROOT = path.resolve(PACKAGE_ROOT, 'dist'); 

// Ensure dist exists
if (!fs.existsSync(DIST_ROOT)) {
  fs.mkdirSync(DIST_ROOT, { recursive: true });
}

// 1. Determine next version by scanning dist directory
const existingDirs = fs.readdirSync(DIST_ROOT)
  .filter(d => /^v\d+$/.test(d))
  .map(d => parseInt(d.substring(1)))
  .filter(n => !isNaN(n));

const nextVersion = existingDirs.length > 0 ? Math.max(...existingDirs) + 1 : 1;
const versionDirName = `v${nextVersion}`;
const versionPath = path.join(DIST_ROOT, versionDirName);

console.log(`\n>>> Preparing Release: ${versionDirName} <<<`);

// 2. Run Build
console.log('Executing build process...');
try {
  // Use explicit path to npm and ensure node is in PATH for nested commands
  const nodeDir = 'C:\\Program Files\\nodejs';
  const npmPath = path.join(nodeDir, 'npm.cmd');
  
  execSync(`"${npmPath}" run build:esm:v2`, { 
    cwd: PACKAGE_ROOT, 
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${nodeDir};${process.env.PATH}`
    }
  });
} catch (e) {
  console.error('Build execution failed.', e);
  process.exit(1);
}

// 3. Create versioned folder and move artifacts
if (!fs.existsSync(versionPath)) {
  fs.mkdirSync(versionPath, { recursive: true });
}

const BUILD_OUT = path.join(PACKAGE_ROOT, 'build-esm-v2');
const jsFile = path.join(BUILD_OUT, 'lexical-playground-v2.js');
const cssFile = path.join(BUILD_OUT, 'lexical-playground-v2.css');

if (fs.existsSync(jsFile)) {
  const targetJs = path.join(versionPath, 'editor.bundle.js');
  fs.copyFileSync(jsFile, targetJs);
  console.log(`[OK] JS Bundle: ${targetJs}`);
} else {
  console.error(`[ERROR] JS Bundle not found at ${jsFile}`);
  process.exit(1);
}

if (fs.existsSync(cssFile)) {
  const targetCss = path.join(versionPath, 'style.css');
  fs.copyFileSync(cssFile, targetCss);
  console.log(`[OK] Stylesheet: ${targetCss}`);
}

// 4. Generate/Update sample index.html with Dark Theme support
const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lexical Release ${versionDirName}</title>
    <link rel="stylesheet" href="./style.css">
    <style>
        body { margin: 0; font-family: -apple-system, system-ui, sans-serif; background: #f0f2f5; transition: background 0.3s; }
        .app-container { max-width: 1200px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; min-height: 600px; display: flex; flexDirection: column; }
        .header { padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; }
        .dark-theme-body { background: #18191a; color: #e4e6eb; }
        .app-container.dark-theme { background: #242526; border-color: #3e4042; }
        #editor { flex: 1; position: relative; }
        button { padding: 8px 16px; cursor: pointer; border-radius: 6px; border: 1px solid #ccc; background: #fff; font-weight: 500; }
        button:hover { background: #f5f5f5; }
        .dark-theme button { background: #3a3b3c; border-color: #4e4f50; color: #e4e6eb; }
    </style>
</head>
<body>
    <div class="app-container" id="shell">
        <div class="header">
            <h2 style="margin:0">Lexical ${versionDirName} (Cangjie + Deep Dark Mode)</h2>
            <button onclick="toggleTheme()">Toggle Theme</button>
        </div>
        <div id="editor"></div>
    </div>

    <script type="module">
        import { initLexicalPlaygroundV2 } from './editor.bundle.js';
        
        const shell = document.getElementById('shell');
        let isDark = localStorage.getItem('theme') === 'dark';
        
        function applyTheme() {
            if (isDark) {
                document.body.classList.add('dark-theme-body');
                shell.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme-body');
                shell.classList.remove('dark-theme');
            }
        }

        window.toggleTheme = () => {
            isDark = !isDark;
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            applyTheme();
            // Re-init to ensure plugins pick up global class if they don't use reactive variables
            location.reload(); 
        };

        applyTheme();

        initLexicalPlaygroundV2('editor', {
            initialContent: 'Welcome to Lexical ${versionDirName}. Type "am" to test Cangjie (倉).',
            darkMode: isDark
        });
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(versionPath, 'index.html'), indexHtmlContent);
console.log(`[OK] Sample Demo: ${path.join(versionPath, 'index.html')}`);

console.log(`\n>>> Release ${versionDirName} Finalized Successfully! <<<`);

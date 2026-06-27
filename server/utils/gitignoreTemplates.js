/**
 * Collection of .gitignore templates for common project types
 */

const templates = {
  node: {
    name: 'Node.js',
    icon: '<i data-lucide="hexagon" class="lucide-icon-md"></i>',
    content: `# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/
out/

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Coverage
coverage/
.nyc_output/
`
  },

  python: {
    name: 'Python',
    icon: '<i data-lucide="code" class="lucide-icon-md"></i>',
    content: `# Byte-compiled
__pycache__/
*.py[cod]
*$py.class

# Virtual environments
venv/
.venv/
env/
.env

# Distribution
dist/
build/
*.egg-info/
*.egg

# IDE
.vscode/
.idea/
*.swp

# Jupyter
.ipynb_checkpoints/

# Testing
.pytest_cache/
.coverage
htmlcov/

# OS
.DS_Store
Thumbs.db
`
  },

  java: {
    name: 'Java',
    icon: '<i data-lucide="coffee" class="lucide-icon-md"></i>',
    content: `# Compiled
*.class
*.jar
*.war
*.ear

# Build
target/
build/
out/

# IDE
.idea/
*.iml
.vscode/
.classpath
.project
.settings/

# Maven
pom.xml.tag
pom.xml.releaseBackup

# Gradle
.gradle/
gradle-app.setting

# Logs
*.log

# OS
.DS_Store
Thumbs.db
`
  },

  react: {
    name: 'React',
    icon: '<i data-lucide="atom" class="lucide-icon-md"></i>',
    content: `# Dependencies
node_modules/

# Build
build/
dist/
.next/
out/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/

# Testing
coverage/

# OS
.DS_Store
Thumbs.db
`
  },

  go: {
    name: 'Go',
    icon: '<i data-lucide="wind" class="lucide-icon-md"></i>',
    content: `# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary
*.test

# Output
*.out

# Vendor (if not committing)
# vendor/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Environment
.env
`
  },

  rust: {
    name: 'Rust',
    icon: '<i data-lucide="cog" class="lucide-icon-md"></i>',
    content: `# Build
/target/
**/*.rs.bk

# Cargo.lock (for libraries, keep for binaries)
# Cargo.lock

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Environment
.env
`
  },

  csharp: {
    name: 'C# / .NET',
    icon: '<i data-lucide="hash" class="lucide-icon-md"></i>',
    content: `# Build
[Bb]in/
[Oo]bj/
[Dd]ebug/
[Rr]elease/

# User-specific
*.suo
*.user
*.userosscache
*.sln.docstates

# IDE
.vs/
.vscode/
*.csproj.user

# NuGet
packages/
*.nupkg

# OS
.DS_Store
Thumbs.db

# Environment
.env
`
  },

  cpp: {
    name: 'C / C++',
    icon: '<i data-lucide="zap" class="lucide-icon-md"></i>',
    content: `# Compiled
*.o
*.obj
*.exe
*.dll
*.so
*.dylib
*.a
*.lib
*.out

# Build
build/
cmake-build-*/
CMakeFiles/
CMakeCache.txt

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
`
  },

  flutter: {
    name: 'Flutter / Dart',
    icon: '<i data-lucide="smartphone" class="lucide-icon-md"></i>',
    content: `# Flutter/Dart
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
build/

# IDE
.idea/
.vscode/
*.iml

# iOS/Android
ios/Pods/
ios/.symlinks/
**/android/.gradle/
**/android/local.properties

# OS
.DS_Store
Thumbs.db
`
  },

  generic: {
    name: 'Generic',
    icon: '<i data-lucide="file-text" class="lucide-icon-md"></i>',
    content: `# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
desktop.ini

# Environment
.env
.env.local

# Logs
*.log

# Build
dist/
build/
out/
`
  }
};

/**
 * Get all template names and icons
 */
function listTemplates() {
  return Object.entries(templates).map(([key, val]) => ({
    key,
    name: val.name,
    icon: val.icon
  }));
}

/**
 * Get a specific template's content
 */
function getTemplate(key) {
  return templates[key] || templates.generic;
}

module.exports = { templates, listTemplates, getTemplate };

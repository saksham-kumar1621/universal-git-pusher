const fs = require('fs');
const path = require('path');

/**
 * Detect the type of project in a directory
 */
function detectProject(dirPath) {
  const files = new Set();

  try {
    const entries = fs.readdirSync(dirPath);
    entries.forEach(e => files.add(e.toLowerCase()));
  } catch {
    return { type: 'generic', name: 'Unknown', language: 'Unknown', framework: null, gitignoreKey: 'generic' };
  }

  const dirName = path.basename(dirPath);

  // Check for specific project indicators
  // Node.js / JavaScript
  if (files.has('package.json')) {
    // Read package.json for more info
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dirPath, 'package.json'), 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['next']) return { type: 'nextjs', name: dirName, language: 'JavaScript', framework: 'Next.js', gitignoreKey: 'react' };
      if (deps['nuxt'] || deps['nuxt3']) return { type: 'nuxt', name: dirName, language: 'JavaScript', framework: 'Nuxt.js', gitignoreKey: 'react' };
      if (deps['react']) return { type: 'react', name: dirName, language: 'JavaScript', framework: 'React', gitignoreKey: 'react' };
      if (deps['vue']) return { type: 'vue', name: dirName, language: 'JavaScript', framework: 'Vue.js', gitignoreKey: 'react' };
      if (deps['angular']) return { type: 'angular', name: dirName, language: 'TypeScript', framework: 'Angular', gitignoreKey: 'react' };
      if (deps['express']) return { type: 'express', name: dirName, language: 'JavaScript', framework: 'Express.js', gitignoreKey: 'node' };
      if (deps['svelte']) return { type: 'svelte', name: dirName, language: 'JavaScript', framework: 'Svelte', gitignoreKey: 'react' };

      return { type: 'node', name: dirName, language: 'JavaScript', framework: 'Node.js', gitignoreKey: 'node' };
    } catch {
      return { type: 'node', name: dirName, language: 'JavaScript', framework: 'Node.js', gitignoreKey: 'node' };
    }
  }

  // Python
  if (files.has('requirements.txt') || files.has('setup.py') || files.has('pyproject.toml') || files.has('pipfile')) {
    let framework = null;
    if (files.has('manage.py')) framework = 'Django';
    else if (files.has('app.py') || files.has('wsgi.py')) framework = 'Flask';
    return { type: 'python', name: dirName, language: 'Python', framework, gitignoreKey: 'python' };
  }

  // Java
  if (files.has('pom.xml')) return { type: 'java', name: dirName, language: 'Java', framework: 'Maven', gitignoreKey: 'java' };
  if (files.has('build.gradle') || files.has('build.gradle.kts')) return { type: 'java', name: dirName, language: 'Java', framework: 'Gradle', gitignoreKey: 'java' };

  // Go
  if (files.has('go.mod')) return { type: 'go', name: dirName, language: 'Go', framework: null, gitignoreKey: 'go' };

  // Rust
  if (files.has('cargo.toml')) return { type: 'rust', name: dirName, language: 'Rust', framework: null, gitignoreKey: 'rust' };

  // C# / .NET
  if ([...files].some(f => f.endsWith('.csproj') || f.endsWith('.sln'))) {
    return { type: 'csharp', name: dirName, language: 'C#', framework: '.NET', gitignoreKey: 'csharp' };
  }

  // Flutter
  if (files.has('pubspec.yaml')) return { type: 'flutter', name: dirName, language: 'Dart', framework: 'Flutter', gitignoreKey: 'flutter' };

  // C/C++
  if (files.has('cmakelists.txt') || files.has('makefile')) {
    return { type: 'cpp', name: dirName, language: 'C/C++', framework: null, gitignoreKey: 'cpp' };
  }

  // HTML project
  if (files.has('index.html')) {
    return { type: 'web', name: dirName, language: 'HTML/CSS/JS', framework: null, gitignoreKey: 'generic' };
  }

  return { type: 'generic', name: dirName, language: 'Unknown', framework: null, gitignoreKey: 'generic' };
}

module.exports = { detectProject };

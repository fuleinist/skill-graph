#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');

program
  .name('skill-graph')
  .description('Visual dependency graph for AI agent skills')
  .version('1.0.0');

program
  .command('parse')
  .description('Parse and validate a skill manifest file')
  .argument('<file>', 'Path to skills.json manifest')
  .option('-s, --since <date>', 'Show skills modified after YYYY-MM-DD')
  .action((file, opts) => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const manifest = JSON.parse(content);
      const sinceDate = opts.since ? new Date(opts.since) : null;
      
      if (sinceDate && isNaN(sinceDate.getTime())) {
        console.error('✗ Error: Invalid date format. Use YYYY-MM-DD');
        process.exit(1);
      }
      
      const stats = fs.statSync(file);
      if (sinceDate && stats.mtime < sinceDate) {
        console.log(`⚠ File last modified: ${stats.mtime.toISOString().split('T')[0]}`);
        console.log(`  No skills modified after ${opts.since}`);
        return;
      }
      
      console.log('✓ Valid JSON');
      console.log(`  Skills: ${manifest.skills?.length || 0}`);
      
      if (sinceDate) {
        console.log(`  Filtered since: ${opts.since}`);
      }
      
      if (manifest.skills) {
        manifest.skills.forEach(skill => {
          console.log(`  - ${skill.name}@${skill.version}`);
          if (skill.dependencies) {
            Object.entries(skill.dependencies).forEach(([dep, ver]) => {
              console.log(`      depends on: ${dep}@${ver}`);
            });
          }
          if (skill.conflicts) {
            Object.entries(skill.conflicts).forEach(([dep, ver]) => {
              console.log(`      conflicts with: ${dep}@${ver}`);
            });
          }
        });
      }
      
      // Check for circular dependencies
      const cycles = findCircularDependencies(manifest.skills || []);
      if (cycles.length > 0) {
        console.log('\n⚠ Circular dependencies detected:');
        cycles.forEach(c => console.log(`  ${c.join(' -> ')}`));
      } else {
        console.log('\n✓ No circular dependencies');
      }
      
    } catch (err) {
      console.error('✗ Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('check')
  .description('Check for version conflicts in a skill manifest')
  .argument('<file>', 'Path to skills.json manifest')
  .option('-s, --since <date>', 'Check skills modified after YYYY-MM-DD')
  .action((file, opts) => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const manifest = JSON.parse(content);
      const sinceDate = opts.since ? new Date(opts.since) : null;
      
      if (sinceDate && isNaN(sinceDate.getTime())) {
        console.error('✗ Error: Invalid date format. Use YYYY-MM-DD');
        process.exit(1);
      }
      
      const stats = fs.statSync(file);
      if (sinceDate && stats.mtime < sinceDate) {
        console.log(`⚠ File last modified: ${stats.mtime.toISOString().split('T')[0]}`);
        console.log(`  No recently-modified skills to check`);
        return;
      }
      
      const conflicts = findConflicts(manifest.skills || []);
      
      if (conflicts.length === 0) {
        console.log('✓ No conflicts detected');
      } else {
        console.log('⚠ Conflicts found:');
        conflicts.forEach(c => {
          console.log(`  ${c.skill1}@${c.ver1} conflicts with ${c.skill2}@${c.ver2}`);
        });
      }
    } catch (err) {
      console.error('✗ Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Start the web server for visualization')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-f, --file <file>', 'Path to skills.json manifest', 'skills.json')
  .action((opts) => {
    const http = require('http');
    const url = require('url');
    const fs = require('fs');
    const path = require('path');
    
    const port = opts.port;
    const manifestPath = opts.file;
    
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json'
    };
    
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url);
      let filePath = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname;
      // Sanitize path to prevent directory traversal
      filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
      if (!filePath) filePath = 'index.html';
      filePath = path.join(__dirname, '..', filePath);
      // Ensure resolved path is within the project directory
      const projectRoot = path.join(__dirname, '..');
      if (!filePath.startsWith(projectRoot)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'text/plain';
      
      if (filePath.endsWith('/api/manifest')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try {
          const manifest = fs.existsSync(manifestPath) 
            ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
            : getSampleManifest();
          res.end(JSON.stringify(manifest));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });
    
    server.listen(port, () => {
      console.log(`Skill Graph running at http://localhost:${port}`);
    });
  });

function findCircularDependencies(skills) {
  const cycles = [];
  const visited = new Set();
  const recStack = new Set();
  
  function dfs(skillName, path) {
    const skill = skills.find(s => s.name === skillName);
    if (!skill) return;
    
    if (recStack.has(skillName)) {
      const cycleStart = path.indexOf(skillName);
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart).concat(skillName));
      }
      return;
    }
    
    if (visited.has(skillName)) return;
    
    visited.add(skillName);
    recStack.add(skillName);
    path.push(skillName);
    
    if (skill.dependencies) {
      for (const dep of Object.keys(skill.dependencies)) {
        dfs(dep, [...path]);
      }
    }
    
    recStack.delete(skillName);
  }
  
  skills.forEach(skill => dfs(skill.name, []));
  return cycles;
}

function findConflicts(skills) {
  const conflicts = [];
  
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const s1 = skills[i];
      const s2 = skills[j];
      
      // Check direct conflicts
      if (s1.conflicts && s1.conflicts[s2.name]) {
        conflicts.push({
          skill1: s1.name,
          ver1: s1.version,
          skill2: s2.name,
          ver2: s2.version
        });
      }
      
      if (s2.conflicts && s2.conflicts[s1.name]) {
        conflicts.push({
          skill1: s2.name,
          ver1: s2.version,
          skill2: s1.name,
          ver2: s1.version
        });
      }
    }
  }
  
  return conflicts;
}

function getSampleManifest() {
  return {
    "skills": [
      {
        "name": "skill-graph",
        "version": "1.0.0",
        "description": "Visual dependency graph for AI agent skills",
        "tags": ["visualization", "tools"],
        "dependencies": {
          "d3": "^7.0.0",
          "commander": "^11.0.0"
        },
        "conflicts": {}
      },
      {
        "name": "agent-skills-registry",
        "version": "1.0.0",
        "description": "GitHub registry for AI agent skills",
        "tags": ["registry", "tools"],
        "dependencies": {
          "commander": "^11.0.0"
        },
        "conflicts": {}
      },
      {
        "name": "context-budget",
        "version": "1.0.0",
        "description": "Token budgeting for AI agents",
        "tags": ["monitoring", "tools"],
        "dependencies": {
          "cli-table": "^3.0.0"
        },
        "conflicts": {}
      },
      {
        "name": "local-rag-bridge",
        "version": "1.0.0",
        "description": "API layer for local LLMs",
        "tags": ["api", "backend"],
        "dependencies": {
          "fastapi": "^0.100.0",
          "ollama": "^0.1.0"
        },
        "conflicts": {}
      },
      {
        "name": "prompt-lens",
        "version": "1.0.0",
        "description": "CLI tool for prompt optimization",
        "tags": ["cli", "tools"],
        "dependencies": {
          "tiktoken": "^1.0.0",
          "tree-sitter": "^0.20.0"
        },
        "conflicts": {}
      },
      {
        "name": "stealth-fetch",
        "version": "1.0.0",
        "description": "Anti-detection HTTP library",
        "tags": ["scraping", "utilities"],
        "dependencies": {
          "reqwest": "^0.11.0"
        },
        "conflicts": {
          "context-budget": "^1.0.0"
        }
      },
      {
        "name": "skill-merge",
        "version": "1.0.0",
        "description": "Merge tool for agent skill sets",
        "tags": ["tools", "merge"],
        "dependencies": {
          "commander": "^11.0.0",
          "diff": "^5.0.0"
        },
        "conflicts": {}
      },
      {
        "name": "agent-diff",
        "version": "1.0.0",
        "description": "Diff tool for agent context snapshots",
        "tags": ["debugging", "tools"],
        "dependencies": {
          "ratatui": "^0.20.0"
        },
        "conflicts": {}
      }
    ]
  };
}

program.parse();

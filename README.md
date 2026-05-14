# Skill Graph

Visual dependency graph for AI agent skills — discover which skills work together, detect conflicts, and visualize skill trees.

## Features

- **Interactive Graph Visualization** — D3.js force-directed graph showing skill relationships
- **Dependency Tracking** — See which skills depend on others
- **Conflict Detection** — Highlight incompatible skill versions
- **Search & Filter** — Find skills by name or tag
- **Zoom & Pan** — Navigate large skill graphs
- **CLI Tools** — Parse, validate, and check skill manifests

## Quick Start

### Web UI

```bash
# Install dependencies
npm install

# Start the web server
npm start
# Opens at http://localhost:3000
```

### CLI

```bash
# Parse a skill manifest
npm run cli parse skills.json

# Check for conflicts
npm run cli check skills.json
```

## Skill Manifest Format

```json
{
  "skills": [
    {
      "name": "my-skill",
      "version": "1.0.0",
      "description": "What this skill does",
      "tags": ["tools", "utilities"],
      "dependencies": {
        "other-skill": "^1.0.0"
      },
      "conflicts": {
        "incompatible-skill": "^2.0.0"
      }
    }
  ]
}
```

## Project Structure

```
skill-graph/
├── index.html      # Web visualization (D3.js)
├── skills.json    # Sample skill manifest
├── package.json   # Dependencies
├── src/
│   └── cli.js     # CLI tools
└── SPEC.md        # Specification
```

## Graph Legend

- **Green lines** = Dependencies
- **Red dashed lines** = Conflicts
- **Node size** = Based on number of tags
- **Node color** = Based on primary tag

## License

MIT
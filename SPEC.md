# Skill Graph - Specification

## Concept & Vision

A visual dependency graph tool for AI agent skills. Like `npm ls` but for agent skills with an interactive web visualization. Discover skill relationships, detect version conflicts, and explore skill dependency trees at a glance.

## What It Does

- **Skill Manifest Format**: Standard JSON schema for skill metadata, dependencies, and conflicts
- **Dependency Graph Visualization**: D3.js force-directed graph showing skill relationships
- **Conflict Detection**: Alerts when skills have incompatible version requirements
- **Skill Tree View**: Hierarchical view of skill dependencies
- **Search & Filter**: Find skills by name, tag, or dependency

## Technical Approach

- **Frontend**: Single HTML page with D3.js for visualization
- **Backend**: Node.js CLI for parsing skill manifests and serving API
- **Skill Manifest**: JSON-based format with `name`, `version`, `dependencies`, `conflicts`

## Core Features

1. **Graph Visualization**
   - Force-directed D3.js graph
   - Nodes = skills, edges = dependencies
   - Node color by category/tag
   - Edge style: solid (dependency), dashed (conflict)
   - Zoom/pan controls
   - Click node to see skill details

2. **Skill Manifest Parser**
   - Parse skills.json manifest files
   - Support for version ranges (semver)
   - Detect circular dependencies

3. **Conflict Detection**
   - Scan for version conflicts between skills
   - Highlight conflicting edges in red
   - Show resolution suggestions

4. **Sample Data**
   - Built-in sample skills demonstrating various dependencies
   - Pre-loaded examples: agent-skills-registry, context-budget, etc.

## Out of Scope

- Publishing to npm or other registries
- CI/CD integration
- Real-time collaboration

## Success Criteria

- [ ] Interactive graph renders with sample data
- [ ] Nodes are clickable with detail popup
- [ ] Conflict edges are visually distinct
- [ ] Zoom/pan works smoothly
- [ ] Skill manifest format is documented
- [ ] CLI can parse and validate manifests
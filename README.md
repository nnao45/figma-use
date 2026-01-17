# Figma Bridge

CLI and WebSocket proxy for controlling Figma through a plugin. No MCP protocol — direct WebSocket communication.

## Architecture

```
┌─────────┐      WebSocket      ┌─────────┐      WebSocket      ┌──────────────┐
│   CLI   │ ◄─────────────────► │  Proxy  │ ◄─────────────────► │ Figma Plugin │
└─────────┘    localhost:38451  └─────────┘    localhost:38451  └──────────────┘
```

## Quick Start

```bash
# Install dependencies
bun install

# Start proxy server
bun run --filter proxy start

# Build and install Figma plugin
bun run --filter plugin build
# Then in Figma: Plugins → Development → Import plugin from manifest
# Select: packages/plugin/manifest.json

# Use CLI
cd packages/cli
bun run src/index.ts status
bun run src/index.ts create-rectangle --x 0 --y 0 --width 100 --height 100 --fill "#E11D48" --radius 8
```

## CLI Commands

### Status & Pages

```bash
status                                    # Check plugin connection
get-pages                                 # List all pages
create-page --name "New Page"             # Create page
set-current-page --id "1:2"               # Switch to page
```

### Reading

```bash
get-selection                             # Get selected nodes
get-node --id "1:2"                       # Get node by ID
get-children --id "1:2" --depth 2         # Get children (nested)
find-by-name --name "Button" --type FRAME # Find nodes by name
get-components                            # List all components
get-local-styles --type paint             # Get styles (paint/text/effect/grid)
get-viewport                              # Get viewport position & zoom
```

### Creating Shapes

```bash
create-rectangle --x 0 --y 0 --width 100 --height 50 \
  --fill "#E11D48" --stroke "#000" --strokeWeight 1 --radius 8 --opacity 0.9 \
  --name "Button" --parentId "1:2"

create-ellipse --x 0 --y 0 --width 80 --height 80 --fill "#00FF00"

create-polygon --x 0 --y 0 --size 60 --sides 6    # Hexagon

create-star --x 0 --y 0 --size 60 --points 5 --innerRadius 0.5

create-line --x 0 --y 0 --length 100 --rotation 45

create-vector --x 0 --y 0 --path "M0 0 L100 100"  # SVG path
```

### Creating Containers

```bash
create-frame --x 0 --y 0 --width 400 --height 300 \
  --fill "#FFF" --radius 16 \
  --layoutMode HORIZONTAL --itemSpacing 10 --padding "16,16,16,16" \
  --name "Card"

create-section --x 0 --y 0 --width 500 --height 500 --name "Section"

create-slice --x 0 --y 0 --width 100 --height 100 --name "Export Slice"
```

### Creating Text

```bash
create-text --x 0 --y 0 --text "Hello World" \
  --fontSize 24 --fontFamily "Inter" --fontStyle "Bold" \
  --fill "#333" --opacity 1 \
  --name "Heading"
```

### Creating Components & Instances

```bash
create-component --name "Button Component"

create-instance --componentId "1:2" --x 100 --y 100

clone-node --id "1:2"                     # Duplicate any node
```

### Creating Styles

```bash
create-paint-style --name "Brand/Primary" --color "#E11D48"

create-text-style --name "Heading/H1" --fontFamily "Inter" --fontStyle "Bold" --fontSize 48

create-effect-style --name "Shadow/Medium" --type DROP_SHADOW --color "#00000040" --offsetY 4 --radius 12
```

### Modifying Nodes

```bash
# Position & Size
move-node --id "1:2" --x 100 --y 200
resize-node --id "1:2" --width 200 --height 100

# Appearance
set-fill-color --id "1:2" --color "#FF0000"
set-stroke-color --id "1:2" --color "#000000"
set-corner-radius --id "1:2" --radius 16
set-opacity --id "1:2" --opacity 0.5
set-blend-mode --id "1:2" --mode MULTIPLY

# Effects
set-effect --id "1:2" --type DROP_SHADOW --color "#00000030" --offsetX 0 --offsetY 4 --radius 12 --spread 0

# Properties
rename-node --id "1:2" --name "New Name"
set-visible --id "1:2" --visible false
set-locked --id "1:2" --locked true

# Text
set-text --id "1:2" --text "Updated text"
set-font --id "1:2" --fontFamily "Inter" --fontStyle "Medium" --fontSize 18

# Layout
set-auto-layout --id "1:2" \
  --mode VERTICAL --itemSpacing 8 --padding "16" \
  --primaryAlign CENTER --counterAlign MIN \
  --sizingH HUG --sizingV FILL

set-constraints --id "1:2" --horizontal STRETCH --vertical MIN

set-parent --id "1:2" --parentId "1:3"    # Move to different parent
```

### Grouping & Boolean Operations

```bash
group-nodes --ids "1:2,1:3,1:4" --name "Group"
ungroup-node --id "1:5"
flatten-nodes --ids "1:2,1:3"

union-nodes --ids "1:2,1:3"
subtract-nodes --ids "1:2,1:3"
intersect-nodes --ids "1:2,1:3"
exclude-nodes --ids "1:2,1:3"
```

### Components & Instances

```bash
set-instance-properties --instanceId "1:2" --properties '{"visible": true}'

add-component-property --componentId "1:2" --name "showIcon" --type BOOLEAN --defaultValue true

edit-component-property --componentId "1:2" --name "showIcon" --defaultValue false

delete-component-property --componentId "1:2" --name "showIcon"

set-component-property-refs --id "1:2" --componentPropertyReferences '{"visible": "showIcon"}'
```

### Viewport & Selection

```bash
get-viewport
set-viewport --x 100 --y 100 --zoom 1.5
zoom-to-fit --ids "1:2,1:3"

select-nodes --ids "1:2,1:3"              # Select in Figma UI
```

### Import & Export

```bash
import-svg --svg '<svg>...</svg>' --x 0 --y 0 --name "Icon"

set-image-fill --id "1:2" --url "https://..." --scaleMode FILL

export-node --id "1:2" --format PNG --scale 2 --output ./export.png
export-selection --output ./selection.png --format PNG --scale 2 --padding 20

screenshot --output ./viewport.png --scale 1
```

### Delete

```bash
delete-node --id "1:2"
```

## Configuration

```bash
PORT=38451              # Proxy server port (default: 38451)
```

## Development

```bash
# Run tests (requires Figma open with plugin connected)
cd packages/cli && bun test

# Build plugin after changes
cd packages/plugin && bun run build
```

## Packages

- **proxy** — Elysia WebSocket server
- **plugin** — Figma plugin (connects to proxy)
- **cli** — Command-line interface (citty-based)

## License

MIT

### Layout Child Properties

```bash
# Make child fill available space
set-layout-child --id "1:2" --horizontalSizing FILL

# Make child fixed size  
set-layout-child --id "1:2" --horizontalSizing FIXED --verticalSizing FIXED

# Absolute position within auto-layout
set-layout-child --id "1:2" --positioning ABSOLUTE --x 10 --y 10
```

### Text Properties

```bash
# Line height and spacing
set-text-properties --id "1:2" --lineHeight 24 --letterSpacing 0.5

# Alignment
set-text-properties --id "1:2" --textAlign CENTER --verticalAlign MIDDLE

# Auto resize behavior
set-text-properties --id "1:2" --autoResize HEIGHT

# Truncation
set-text-properties --id "1:2" --autoResize TRUNCATE --maxLines 2

# Paragraph formatting
set-text-properties --id "1:2" --paragraphSpacing 16 --paragraphIndent 24
```

### Min/Max Constraints

```bash
set-min-max --id "1:2" --minWidth 100 --maxWidth 400
set-min-max --id "1:2" --minHeight 50 --maxHeight 200
```

### Rotation

```bash
set-rotation --id "1:2" --angle 45
set-rotation --id "1:2" --angle -30
```

### Stroke Alignment

```bash
set-stroke-align --id "1:2" --align INSIDE   # Stroke inside bounds
set-stroke-align --id "1:2" --align OUTSIDE  # Stroke outside bounds
set-stroke-align --id "1:2" --align CENTER   # Stroke centered on edge
```

### Short Hex Colors

All color parameters support 3-char hex codes:
```bash
--fill "#F00"     # Expands to #FF0000
--fill "#333"     # Expands to #333333
--stroke "#0AF"   # Expands to #00AAFF
```

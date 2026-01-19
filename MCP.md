# MCP Server

figma-use exposes an MCP endpoint with 90+ tools that mirror CLI commands.

## Setup

1. Start the proxy:
   ```bash
   figma-use proxy
   ```

2. Add to your MCP client config:
   ```json
   {
     "mcpServers": {
       "figma-use": {
         "url": "http://localhost:38451/mcp"
       }
     }
   }
   ```

3. Start Figma and open the plugin:
   ```bash
   figma --remote-debugging-port=9222
   # In Figma: Plugins → Development → Figma Use
   ```

Run `figma-use mcp` to get the config snippet.

## Tools

Tools follow the pattern `figma_{command}_{subcommand}`. All CLI commands are available:

### Create
- `figma_create_frame` — create frame with layout, fill, radius
- `figma_create_rect` — create rectangle
- `figma_create_ellipse` — create ellipse
- `figma_create_text` — create text node
- `figma_create_line` — create line
- `figma_create_vector` — create vector path
- `figma_create_component` — create component
- `figma_create_instance` — create component instance
- `figma_create_section` — create section
- `figma_create_page` — create page

### Query
- `figma_node_get` — get node properties
- `figma_node_tree` — get page structure as tree
- `figma_node_children` — get child nodes
- `figma_node_bounds` — get position, size, center
- `figma_find` — find nodes by name or type
- `figma_selection_get` — get current selection

### Modify
- `figma_set_fill` — set fill color
- `figma_set_stroke` — set stroke color and weight
- `figma_set_radius` — set corner radius
- `figma_set_opacity` — set opacity
- `figma_set_text` — set text content
- `figma_set_font` — set font properties
- `figma_set_layout` — set auto-layout
- `figma_node_move` — move node
- `figma_node_resize` — resize node
- `figma_node_delete` — delete node
- `figma_node_clone` — clone node
- `figma_node_rename` — rename node
- `figma_node_to-component` — convert to component

### Export
- `figma_export_node` — export node as PNG/SVG/PDF
- `figma_export_screenshot` — screenshot viewport
- `figma_export_selection` — export selection

### Navigate
- `figma_page_list` — list pages
- `figma_page_set` — switch page
- `figma_viewport_get` — get viewport position
- `figma_viewport_set` — set viewport position
- `figma_viewport_zoom-to-fit` — zoom to fit nodes

### Variables & Styles
- `figma_variable_list` — list variables
- `figma_variable_create` — create variable
- `figma_variable_set` — set variable value
- `figma_style_list` — list styles
- `figma_style_create-paint` — create color style

### Diff
- `figma_diff_create` — compare two nodes, generate patch
- `figma_diff_apply` — apply patch
- `figma_diff_visual` — visual diff as PNG

### Vector Paths
- `figma_path_get` — get path data
- `figma_path_set` — set path data
- `figma_path_scale` — scale path
- `figma_path_flip` — flip path

### Boolean Operations
- `figma_boolean_union` — union nodes
- `figma_boolean_subtract` — subtract nodes
- `figma_boolean_intersect` — intersect nodes
- `figma_boolean_exclude` — exclude nodes

### Other
- `figma_status` — check connection
- `figma_import` — import SVG
- `figma_eval` — execute JS in plugin context

## Example Usage

```json
{
  "method": "tools/call",
  "params": {
    "name": "figma_create_frame",
    "arguments": {
      "x": "100",
      "y": "100",
      "width": "400",
      "height": "300",
      "fill": "#FFFFFF",
      "radius": "12",
      "layout": "VERTICAL",
      "gap": "16"
    }
  }
}
```

## Colors

All color arguments accept:
- Hex: `#RGB`, `#RRGGBB`, `#RRGGBBAA`
- Variable reference: `var:Colors/Primary` or `$Colors/Primary`

## Node IDs

Format: `session:local` (e.g., `1:23`, `45:678`)

Get IDs from `figma_selection_get` or `figma_node_tree`.

## Limitations

- `render` command not yet available via MCP (uses multiplayer protocol)
- `create icon` not yet available via MCP
- All arguments are strings (MCP limitation)

These will be added in a future release. For now, use CLI for these features.

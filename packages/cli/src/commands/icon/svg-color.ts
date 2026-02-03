const COLOR_ATTRS = ['fill', 'stroke']

export function replaceSvgCurrentColor(svg: string, color: string): string {
  let result = svg
  for (const attr of COLOR_ATTRS) {
    const pattern = new RegExp(`(\\b${attr}\\s*=\\s*["'])\\s*currentColor\\s*(["'])`, 'gi')
    result = result.replace(pattern, `$1${color}$2`)
  }
  return result
}

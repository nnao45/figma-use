import { describe, test, expect } from 'bun:test'

import { replaceSvgCurrentColor } from '../../src/commands/icon/svg-color.ts'

describe('icon svg color', () => {
  test('replaces currentColor in fill and stroke attributes', () => {
    const input = '<svg><path fill="currentColor" stroke="currentColor" d="M0 0"/></svg>'
    const output = replaceSvgCurrentColor(input, '#FF0000')
    expect(output).toContain('fill="#FF0000"')
    expect(output).toContain('stroke="#FF0000"')
  })

  test('supports single quotes and case-insensitive currentColor', () => {
    const input = "<svg><path fill='currentcolor' stroke='CURRENTCOLOR' d='M0 0'/></svg>"
    const output = replaceSvgCurrentColor(input, '#00FF00')
    expect(output).toContain("fill='#00FF00'")
    expect(output).toContain("stroke='#00FF00'")
  })

  test('does not replace unrelated attributes', () => {
    const input = '<svg><path fill="#111" stroke="none" data="currentColor"/></svg>'
    const output = replaceSvgCurrentColor(input, '#123456')
    expect(output).toContain('fill="#111"')
    expect(output).toContain('stroke="none"')
    expect(output).toContain('data="currentColor"')
  })
})

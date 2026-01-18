/**
 * Color Palette - demonstrates defineVars with Figma variables
 */

import * as React from 'react'
import { defineVars, Frame, Text } from '../../src/render/index.ts'

// Define variables with explicit fallback values
const colors = defineVars({
  gray50: { name: 'Colors/Gray/50', value: '#F8FAFC' },
  gray100: { name: 'Colors/Gray/100', value: '#F1F5F9' },
  gray200: { name: 'Colors/Gray/200', value: '#E2E8F0' },
  gray300: { name: 'Colors/Gray/300', value: '#CBD5E1' },
  gray400: { name: 'Colors/Gray/400', value: '#94A3B8' },
  gray500: { name: 'Colors/Gray/500', value: '#64748B' },
  gray600: { name: 'Colors/Gray/600', value: '#475569' },
  gray700: { name: 'Colors/Gray/700', value: '#334155' },
  gray800: { name: 'Colors/Gray/800', value: '#1E293B' },
  gray900: { name: 'Colors/Gray/900', value: '#0F172A' },
})

const ColorSwatch = ({ color, label }: { color: any; label: string }) => (
  <Frame
    name={label}
    style={{
      width: 80,
      height: 80,
      backgroundColor: color,
      borderRadius: 8,
    }}
  />
)

export default function ColorPalette() {
  return (
    <Frame
      name="Color Palette"
      style={{
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        backgroundColor: '#FFFFFF',
        width: 600,
        height: 400,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
        Gray Scale
      </Text>
      
      <Frame style={{ flexDirection: 'row', gap: 8, width: 500, height: 100 }}>
        <ColorSwatch color={colors.gray50} label="50" />
        <ColorSwatch color={colors.gray100} label="100" />
        <ColorSwatch color={colors.gray200} label="200" />
        <ColorSwatch color={colors.gray300} label="300" />
        <ColorSwatch color={colors.gray400} label="400" />
      </Frame>
      
      <Frame style={{ flexDirection: 'row', gap: 8, width: 500, height: 100 }}>
        <ColorSwatch color={colors.gray500} label="500" />
        <ColorSwatch color={colors.gray600} label="600" />
        <ColorSwatch color={colors.gray700} label="700" />
        <ColorSwatch color={colors.gray800} label="800" />
        <ColorSwatch color={colors.gray900} label="900" />
      </Frame>
    </Frame>
  )
}

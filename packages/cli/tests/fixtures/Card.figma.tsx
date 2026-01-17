// Example: Render a card component to Figma
// Usage: figma-use render examples/Card.figma.tsx --props '{"title": "Hello", "items": ["A", "B", "C"]}'

import * as React from 'react'
import { Frame, Text, Rectangle } from '../../src/render/index.ts'

type CardProps = {
  title: string
  items: string[]
  variant?: 'primary' | 'secondary'
}

export default function Card({ title, items, variant = 'primary' }: CardProps) {
  const bgColor = variant === 'primary' ? '#3B82F6' : '#6B7280'
  
  return (
    <Frame name="Card" style={{ 
      width: 320, height: 400, backgroundColor: '#FFFFFF',
      flexDirection: 'column', gap: 16, padding: 24, borderRadius: 12 
    }}>
      <Text name="Title" style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
        {title}
      </Text>
      
      <Frame name="Items" style={{ flexDirection: 'column', gap: 8, width: 272 }}>
        {items.map((item, i) => (
          <Frame key={i} name={`Item ${i + 1}`} style={{ 
            flexDirection: 'row', gap: 12, paddingTop: 12, paddingBottom: 12,
            paddingLeft: 16, paddingRight: 16, backgroundColor: '#F3F4F6', borderRadius: 8 
          }}>
            <Frame style={{ width: 8, height: 8, backgroundColor: bgColor, borderRadius: 4 }} />
            <Text style={{ fontSize: 14, color: '#374151' }}>{item}</Text>
          </Frame>
        ))}
      </Frame>
      
      <Frame name="Actions" style={{ flexDirection: 'row', gap: 8 }}>
        <Frame name="Primary Button" style={{ 
          backgroundColor: bgColor, paddingTop: 12, paddingBottom: 12,
          paddingLeft: 24, paddingRight: 24, borderRadius: 8 
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>Action</Text>
        </Frame>
        <Frame name="Secondary Button" style={{ 
          backgroundColor: '#E5E7EB', paddingTop: 12, paddingBottom: 12,
          paddingLeft: 24, paddingRight: 24, borderRadius: 8 
        }}>
          <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
        </Frame>
      </Frame>
    </Frame>
  )
}

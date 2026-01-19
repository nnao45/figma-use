/**
 * Button component variants in Nuxt UI style
 */

import { Frame, Text, Icon } from '../../src/render/index.ts'

const c = {
  bg: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  danger: '#EF4444',
  success: '#10B981',
  white: '#FFFFFF',
  ghost: '#F3F4F6'
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  iconRight?: string
  disabled?: boolean
}

const sizes = {
  sm: { h: 32, px: 12, size: 13, iconSize: 16 },
  md: { h: 40, px: 16, size: 14, iconSize: 18 },
  lg: { h: 48, px: 20, size: 16, iconSize: 20 }
}

const variants = {
  primary: { bg: c.primary, color: c.white, border: undefined },
  secondary: { bg: c.ghost, color: c.text, border: undefined },
  outline: { bg: undefined, color: c.text, border: '#D1D5DB' },
  ghost: { bg: undefined, color: c.text, border: undefined },
  danger: { bg: c.danger, color: c.white, border: undefined }
}

const Button = ({ label, variant = 'primary', size = 'md', icon, iconRight, disabled }: ButtonProps) => {
  const s = sizes[size]
  const v = disabled ? { bg: '#E5E7EB', color: '#9CA3AF', border: undefined } : variants[variant]

  return (
    <Frame
      name={`Button-${variant}-${size}${disabled ? '-disabled' : ''}`}
      style={{
        h: s.h,
        px: s.px,
        rounded: 8,
        flex: 'row',
        gap: 8,
        justify: 'center',
        items: 'center',
        bg: v.bg,
        borderColor: v.border,
        borderWidth: v.border ? 1 : 0
      }}
    >
      {icon && <Icon icon={icon} size={s.iconSize} color={v.color} />}
      <Text style={{ size: s.size, weight: 500, color: v.color }}>{label}</Text>
      {iconRight && <Icon icon={iconRight} size={s.iconSize} color={v.color} />}
    </Frame>
  )
}

export default function Buttons() {
  return (
    <Frame name="Buttons" style={{ flex: 'col', gap: 24, p: 32, bg: c.bg, rounded: 16 }}>
      {/* Variants */}
      <Frame name="variants" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>VARIANTS</Text>
        <Frame style={{ flex: 'row', gap: 12, items: 'center' }}>
          <Button label="Primary" variant="primary" />
          <Button label="Secondary" variant="secondary" />
          <Button label="Outline" variant="outline" />
          <Button label="Ghost" variant="ghost" />
          <Button label="Danger" variant="danger" />
        </Frame>
      </Frame>

      {/* Sizes */}
      <Frame name="sizes" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>SIZES</Text>
        <Frame style={{ flex: 'row', gap: 12, items: 'center' }}>
          <Button label="Small" size="sm" />
          <Button label="Medium" size="md" />
          <Button label="Large" size="lg" />
        </Frame>
      </Frame>

      {/* With Icons */}
      <Frame name="with-icons" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>WITH ICONS</Text>
        <Frame style={{ flex: 'row', gap: 12, items: 'center' }}>
          <Button label="Settings" icon="tabler:settings" />
          <Button label="Download" icon="tabler:download" variant="secondary" />
          <Button label="Delete" icon="tabler:trash" variant="danger" />
          <Button label="Add" icon="tabler:plus" variant="outline" />
        </Frame>
        <Frame style={{ flex: 'row', gap: 12, items: 'center' }}>
          <Button label="Next" iconRight="tabler:chevron-right" />
          <Button label="Expand" iconRight="tabler:chevron-down" variant="secondary" />
        </Frame>
      </Frame>

      {/* States */}
      <Frame name="states" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>STATES</Text>
        <Frame style={{ flex: 'row', gap: 12, items: 'center' }}>
          <Button label="Normal" />
          <Button label="Disabled" disabled />
        </Frame>
      </Frame>
    </Frame>
  )
}

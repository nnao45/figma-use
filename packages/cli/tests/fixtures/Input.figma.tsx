/**
 * Input component variants in Nuxt UI style
 */

import { Frame, Text, Icon } from '../../src/render/index.ts'

const c = {
  bg: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  placeholder: '#9CA3AF',
  border: '#D1D5DB',
  borderFocus: '#3B82F6',
  error: '#EF4444',
  errorBg: '#FFF5F5',
  disabled: '#F3F4F6',
  disabledText: '#6B7280'
}

type InputSize = 'sm' | 'md' | 'lg'

interface InputProps {
  placeholder?: string
  value?: string
  size?: InputSize
  icon?: string
  iconRight?: string
  error?: boolean
  errorMessage?: string
  disabled?: boolean
  label?: string
}

const sizes = {
  sm: { h: 32, px: 10, size: 13 },
  md: { h: 40, px: 12, size: 14 },
  lg: { h: 48, px: 16, size: 15 }
}

const Input = ({
  placeholder,
  value,
  size = 'md',
  icon,
  iconRight,
  error,
  errorMessage,
  disabled,
  label
}: InputProps) => {
  const s = sizes[size]
  const borderColor = error ? c.error : c.border
  const bg = disabled ? c.disabled : error ? c.errorBg : c.bg
  const textColor = disabled ? c.disabledText : value ? c.text : c.placeholder

  return (
    <Frame name={`Input-${size}${error ? '-error' : ''}${disabled ? '-disabled' : ''}`} style={{ flex: 'col', gap: 6 }}>
      {label && <Text style={{ size: 14, weight: 500, color: c.text }}>{label}</Text>}
      <Frame
        style={{
          h: s.h,
          px: s.px,
          rounded: 8,
          flex: 'row',
          gap: 8,
          items: 'center',
          bg,
          borderColor,
          borderWidth: 1
        }}
      >
        {icon && <Icon icon={icon} size={s.size + 2} color={c.muted} />}
        <Text style={{ size: s.size, color: textColor }}>{value || placeholder || 'Placeholder'}</Text>
        {iconRight && <Icon icon={iconRight} size={s.size + 2} color={c.muted} />}
      </Frame>
      {error && errorMessage && (
        <Text style={{ size: 12, color: c.error }}>{errorMessage}</Text>
      )}
    </Frame>
  )
}

export default function Inputs() {
  return (
    <Frame name="Inputs" style={{ flex: 'col', gap: 24, p: 32, bg: c.bg, rounded: 16 }}>
      {/* Sizes */}
      <Frame name="sizes" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>SIZES</Text>
        <Frame style={{ flex: 'row', gap: 16, items: 'end' }}>
          <Input placeholder="Small input" size="sm" />
          <Input placeholder="Medium input" size="md" />
          <Input placeholder="Large input" size="lg" />
        </Frame>
      </Frame>

      {/* With Icons */}
      <Frame name="with-icons" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>WITH ICONS</Text>
        <Frame style={{ flex: 'row', gap: 16, items: 'center' }}>
          <Input placeholder="Search..." icon="tabler:search" />
          <Input placeholder="Email" icon="tabler:mail" />
          <Input value="john@example.com" icon="tabler:mail" iconRight="tabler:check" />
        </Frame>
      </Frame>

      {/* States */}
      <Frame name="states" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>STATES</Text>
        <Frame style={{ flex: 'row', gap: 16, items: 'start' }}>
          <Input placeholder="Default" />
          <Input value="With value" />
          <Input placeholder="Disabled" disabled />
          <Input value="invalid@" error errorMessage="Please enter a valid email" />
        </Frame>
      </Frame>

      {/* With Labels */}
      <Frame name="with-labels" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>WITH LABELS</Text>
        <Frame style={{ flex: 'row', gap: 16, items: 'start' }}>
          <Input label="Email" placeholder="you@example.com" icon="tabler:mail" />
          <Input label="Password" value="password123" icon="tabler:lock" iconRight="tabler:eye-off" />
        </Frame>
      </Frame>
    </Frame>
  )
}

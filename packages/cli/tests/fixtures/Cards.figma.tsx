/**
 * Card component variants in Nuxt UI style
 */

import { Frame, Text, Icon } from '../../src/render/index.ts'

const c = {
  bg: '#FFFFFF',
  bgSubtle: '#F9FAFB',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
}

interface CardProps {
  title: string
  description?: string
  icon?: string
  iconBg?: string
  iconColor?: string
  footer?: string
  variant?: 'default' | 'bordered' | 'elevated'
}

const Card = ({ title, description, icon, iconBg, iconColor, footer, variant = 'default' }: CardProps) => {
  const shadow = variant === 'elevated'
  const border = variant === 'bordered' || variant === 'default'

  return (
    <Frame
      name={`Card-${variant}`}
      style={{
        w: 280,
        p: 20,
        rounded: 12,
        flex: 'col',
        gap: 12,
        bg: c.bg,
        borderColor: border ? c.border : undefined,
        borderWidth: border ? 1 : 0,
        opacity: shadow ? 0.95 : 1
      }}
    >
      <Frame style={{ flex: 'row', gap: 12, items: 'start' }}>
        {icon && (
          <Frame style={{ w: 40, h: 40, rounded: 8, bg: iconBg || c.bgSubtle, flex: 'row', justify: 'center', items: 'center' }}>
            <Icon icon={icon} size={20} color={iconColor || c.primary} />
          </Frame>
        )}
        <Frame style={{ flex: 'col', gap: 4 }}>
          <Text style={{ size: 16, weight: 600, color: c.text }}>{title}</Text>
          {description && <Text style={{ size: 14, color: c.muted }}>{description}</Text>}
        </Frame>
      </Frame>
      {footer && (
        <Frame style={{ pt: 12, borderColor: c.border, borderWidth: 1 }}>
          <Text style={{ size: 13, color: c.muted }}>{footer}</Text>
        </Frame>
      )}
    </Frame>
  )
}

const StatCard = ({ label, value, change, trend }: { label: string; value: string; change: string; trend: 'up' | 'down' }) => (
  <Frame name="StatCard" style={{ w: 200, p: 16, rounded: 12, flex: 'col', gap: 8, bg: c.bg, borderColor: c.border, borderWidth: 1 }}>
    <Text style={{ size: 13, color: c.muted }}>{label}</Text>
    <Text style={{ size: 28, weight: 700, color: c.text }}>{value}</Text>
    <Frame style={{ flex: 'row', gap: 4, items: 'center' }}>
      <Icon icon={trend === 'up' ? 'tabler:trending-up' : 'tabler:trending-down'} size={16} color={trend === 'up' ? c.success : c.error} />
      <Text style={{ size: 13, weight: 500, color: trend === 'up' ? c.success : c.error }}>{change}</Text>
    </Frame>
  </Frame>
)

export default function Cards() {
  return (
    <Frame name="Cards" style={{ flex: 'col', gap: 24, p: 32, bg: c.bgSubtle, rounded: 16 }}>
      {/* Basic Cards */}
      <Frame name="basic" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>BASIC CARDS</Text>
        <Frame style={{ flex: 'row', gap: 16 }}>
          <Card
            title="Getting Started"
            description="Learn the basics and set up your first project"
            icon="tabler:rocket"
            iconBg="#EFF6FF"
            iconColor={c.primary}
          />
          <Card
            title="Documentation"
            description="Explore our comprehensive guides"
            icon="tabler:book"
            iconBg="#F0FDF4"
            iconColor={c.success}
          />
          <Card
            title="API Reference"
            description="Detailed API documentation"
            icon="tabler:code"
            iconBg="#FEF3C7"
            iconColor={c.warning}
          />
        </Frame>
      </Frame>

      {/* Stat Cards */}
      <Frame name="stats" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>STAT CARDS</Text>
        <Frame style={{ flex: 'row', gap: 16 }}>
          <StatCard label="Total Revenue" value="$45,231" change="+12.5%" trend="up" />
          <StatCard label="Active Users" value="2,345" change="+8.2%" trend="up" />
          <StatCard label="Bounce Rate" value="24.5%" change="-3.1%" trend="down" />
        </Frame>
      </Frame>

      {/* Simple Cards */}
      <Frame name="simple" style={{ flex: 'col', gap: 8 }}>
        <Text style={{ size: 12, weight: 600, color: c.muted }}>SIMPLE CARDS</Text>
        <Frame style={{ flex: 'row', gap: 16 }}>
          <Frame style={{ w: 200, p: 16, rounded: 12, bg: c.bg, borderColor: c.border, borderWidth: 1, flex: 'col', gap: 8 }}>
            <Text style={{ size: 15, weight: 600, color: c.text }}>Card Title</Text>
            <Text style={{ size: 14, color: c.muted }}>Simple card with just title and description text.</Text>
          </Frame>
          <Frame style={{ w: 200, p: 16, rounded: 12, bg: c.primary, flex: 'col', gap: 8 }}>
            <Text style={{ size: 15, weight: 600, color: '#FFFFFF' }}>Highlighted</Text>
            <Text style={{ size: 14, color: '#FFFFFF', opacity: 0.8 }}>Card with accent background color.</Text>
          </Frame>
        </Frame>
      </Frame>
    </Frame>
  )
}

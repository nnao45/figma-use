import { defineCommand } from 'citty'

import detach from './detach.ts'
import getMain from './get-main.ts'
import resetProps from './reset-props.ts'
import swap from './swap.ts'

export default defineCommand({
  meta: { description: 'Instance operations' },
  subCommands: {
    detach,
    swap,
    'reset-props': resetProps,
    'get-main': getMain
  }
})

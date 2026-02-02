import { describe, test, expect } from 'bun:test'

import { formatReport, formatJSON } from '../src/reporters/console.ts'

import type { LintResult } from '../src/core/types.ts'

function makeResult(overrides: Partial<LintResult> = {}): LintResult {
  return {
    messages: [],
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    fixableCount: 0,
    ...overrides
  }
}

describe('formatReport', () => {
  test('shows no issues for clean result', () => {
    const report = formatReport(makeResult())
    expect(report).toContain('No issues found')
  })

  test('shows error count', () => {
    const report = formatReport(
      makeResult({
        errorCount: 3,
        messages: [
          {
            ruleId: 'no-groups',
            severity: 'error',
            message: 'Avoid groups',
            nodeId: '1:1',
            nodePath: ['Frame', 'Group 1']
          },
          {
            ruleId: 'no-groups',
            severity: 'error',
            message: 'Avoid groups',
            nodeId: '1:2',
            nodePath: ['Frame', 'Group 2']
          },
          {
            ruleId: 'no-groups',
            severity: 'error',
            message: 'Avoid groups',
            nodeId: '1:3',
            nodePath: ['Frame', 'Group 3']
          }
        ]
      })
    )
    expect(report).toContain('3 errors')
  })

  test('shows warning count', () => {
    const report = formatReport(
      makeResult({
        warningCount: 1,
        messages: [
          {
            ruleId: 'no-default-names',
            severity: 'warning',
            message: 'Use descriptive name',
            nodeId: '1:1',
            nodePath: ['Frame 1']
          }
        ]
      })
    )
    expect(report).toContain('1 warning')
  })

  test('shows singular error', () => {
    const report = formatReport(
      makeResult({
        errorCount: 1,
        messages: [
          {
            ruleId: 'no-groups',
            severity: 'error',
            message: 'Avoid groups',
            nodeId: '1:1',
            nodePath: ['Group 1']
          }
        ]
      })
    )
    expect(report).toContain('1 error')
    expect(report).not.toContain('1 errors')
  })

  test('shows info count', () => {
    const report = formatReport(
      makeResult({
        infoCount: 2,
        messages: [
          {
            ruleId: 'info-rule',
            severity: 'info',
            message: 'Info 1',
            nodeId: '1:1',
            nodePath: ['Node']
          },
          {
            ruleId: 'info-rule',
            severity: 'info',
            message: 'Info 2',
            nodeId: '1:1',
            nodePath: ['Node']
          }
        ]
      })
    )
    expect(report).toContain('2 info')
  })

  test('groups messages by node', () => {
    const report = formatReport(
      makeResult({
        errorCount: 2,
        messages: [
          {
            ruleId: 'rule-a',
            severity: 'error',
            message: 'Error A',
            nodeId: '1:1',
            nodePath: ['Frame', 'Child']
          },
          {
            ruleId: 'rule-b',
            severity: 'error',
            message: 'Error B',
            nodeId: '1:1',
            nodePath: ['Frame', 'Child']
          }
        ]
      })
    )
    expect(report).toContain('Frame/Child (1:1)')
    expect(report).toContain('Error A')
    expect(report).toContain('Error B')
  })

  test('shows fixable count', () => {
    const report = formatReport(
      makeResult({
        warningCount: 1,
        fixableCount: 1,
        messages: [
          {
            ruleId: 'fixable-rule',
            severity: 'warning',
            message: 'Can be fixed',
            nodeId: '1:1',
            nodePath: ['Node']
          }
        ]
      })
    )
    expect(report).toContain('--fix')
    expect(report).toContain('1 issue')
  })

  test('shows suggestions in verbose mode', () => {
    const report = formatReport(
      makeResult({
        warningCount: 1,
        messages: [
          {
            ruleId: 'rule',
            severity: 'warning',
            message: 'Problem',
            nodeId: '1:1',
            nodePath: ['Node'],
            suggest: 'Try this fix'
          }
        ]
      }),
      { verbose: true }
    )
    expect(report).toContain('Try this fix')
  })

  test('hides suggestions without verbose', () => {
    const report = formatReport(
      makeResult({
        warningCount: 1,
        messages: [
          {
            ruleId: 'rule',
            severity: 'warning',
            message: 'Problem',
            nodeId: '1:1',
            nodePath: ['Node'],
            suggest: 'Try this fix'
          }
        ]
      })
    )
    expect(report).not.toContain('Try this fix')
  })
})

describe('formatJSON', () => {
  test('returns valid JSON', () => {
    const result = makeResult({ errorCount: 1 })
    const json = formatJSON(result)
    const parsed = JSON.parse(json)
    expect(parsed.errorCount).toBe(1)
  })

  test('is pretty-printed', () => {
    const json = formatJSON(makeResult())
    expect(json).toContain('\n')
    expect(json).toContain('  ')
  })
})

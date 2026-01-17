const CLI = 'bun run src/index.ts'
const cwd = import.meta.dir + '/..'

export async function run(cmd: string): Promise<unknown> {
  const proc = Bun.spawn(['sh', '-c', `${CLI} ${cmd}`], { cwd, stdout: 'pipe', stderr: 'pipe' })
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  await proc.exited
  if (proc.exitCode !== 0) throw new Error(stderr || stdout)
  try {
    return JSON.parse(stdout)
  } catch {
    return stdout.trim()
  }
}

export const createdNodes: string[] = []

export function trackNode(id: string) {
  createdNodes.push(id)
}

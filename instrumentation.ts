export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startAgentRunner } = await import('./lib/runner');
    startAgentRunner();
  }
}

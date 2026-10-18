export async function register() {
  // Only start the background agent runner loop in persistent server environments (local dev, VPS, Docker).
  // Skip in serverless environments (Vercel, AWS Lambda) where background timers freeze and cause cold-start crashes.
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    !process.env.VERCEL &&
    !process.env.AWS_LAMBDA_FUNCTION_NAME
  ) {
    try {
      const { startAgentRunner } = await import('./lib/runner');
      startAgentRunner();
    } catch (err) {
      console.warn('[Instrumentation] Background runner init skipped:', err);
    }
  }
}


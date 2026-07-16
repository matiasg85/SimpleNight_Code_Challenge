/**
 * environments.ts
 *
 * Central registry of execution environments.
 * Add a new entry here to support additional targets (e.g. uat, e2e-sandbox).
 *
 * Active environment is selected via the TEST_ENV environment variable
 * (default: "staging").  BASE_URL can override the resolved URL at runtime.
 */

export interface Environment {
  name: string;
  baseUrl: string;
}

const ENVIRONMENTS: Record<string, Environment> = {
  staging: {
    name: 'Staging',
    // BASE_URL env var lets CI pipelines inject a branch-specific preview URL
    baseUrl: process.env.BASE_URL ?? 'https://wl.stg.simplenight.com',
  },
  production: {
    name: 'Production',
    baseUrl: 'https://wl.simplenight.com',
  },
};

/**
 * Returns the Environment for the given key.
 * Falls back to the TEST_ENV environment variable, then to "staging".
 *
 * @throws if the resolved key does not match any registered environment.
 */
export function getEnvironment(envName?: string): Environment {
  const key = envName ?? process.env.TEST_ENV ?? 'staging';
  const env = ENVIRONMENTS[key];

  if (!env) {
    const available = Object.keys(ENVIRONMENTS).join(', ');
    throw new Error(
      `Unknown environment: "${key}". Available environments: ${available}`,
    );
  }

  return env;
}

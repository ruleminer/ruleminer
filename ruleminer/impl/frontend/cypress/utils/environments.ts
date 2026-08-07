export interface AuthConfig {
  baseUrl: string; // base keycloak url with port
  username: string;
  password: string;
}

export interface EnvironmentConfig {
  auth: AuthConfig;
  appUrl: string; // base app url with port
}

export enum Environments {
  LOCAL = 'local',
}

export function getConfig(): EnvironmentConfig {
  const envValue = Cypress.env('env');
  // Convert to lowercase to handle case-insensitive environment values
  const currentEnv: Environments = envValue?.toLowerCase() as Environments;
  const config: Record<Environments, EnvironmentConfig> = Cypress.env('config');
  const currentConfig = config[currentEnv];
  
  if (!currentConfig) {
    throw new Error(`Configuration not found for environment: ${envValue}. Available environments: ${Object.keys(config).join(', ')}`);
  }
  
  return currentConfig;
}

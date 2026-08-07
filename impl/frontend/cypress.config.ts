import { defineConfig } from 'cypress';
import { EnvironmentConfig, Environments } from 'cypress/utils/environments';

const RESET = '\x1b[0m';
const BRIGHT = '\x1b[1m'; // Bold

const FG_GREEN = '\x1b[32m';
const FG_YELLOW = '\x1b[33m';
const FG_CYAN = '\x1b[36m';

const config: Record<Environments, EnvironmentConfig> = {
  [Environments.LOCAL]: {
    auth: {
      baseUrl: 'http://localhost:8080',
      username: 'john',
      password: process.env.JOHN_PASSWORD ?? '',
    },
    appUrl: 'http://localhost:4200',
  },
};

const env = {
  env: Environments.LOCAL,
  config,
};

export default defineConfig({
  env,
  e2e: {
    experimentalStudio: true,
    async setupNodeEvents(on, config) {
      const slowNetworkValue = config.env['slowNetwork'];
      const isSlowNetwork = slowNetworkValue === true || String(slowNetworkValue).toLowerCase() === 'true';

      const prefix = `${BRIGHT}${FG_CYAN}[SLOW NETWORK MODE]${RESET}`;

      if (isSlowNetwork) {
        console.log(`${prefix} ${BRIGHT}${FG_GREEN}🐢 ENABLED${RESET}`);
        on('before:browser:launch', (browser, launchOptions) => {
          return launchOptions;
        });
      } else {
        console.log(`${prefix} ${BRIGHT}${FG_YELLOW}ℹ️ DISABLED${RESET}`);
      }
      return config;
    },
  },
  defaultCommandTimeout: 60000,
  experimentalFetchPolyfill: true,
  retries: {
    runMode: 3,
    openMode: 3,
  },
});

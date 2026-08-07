import './commands';

const slowNetworkEnv = Cypress.env('slowNetwork');
const isSlowNetworkEnabled = slowNetworkEnv === true || String(slowNetworkEnv).toLowerCase() === 'true';

if (isSlowNetworkEnabled) {
    beforeEach(() => {
        cy.log('🐢 Simulating SLOW NETWORK conditions...');
        Cypress.automation('remote:debugger:protocol', {
            command: 'Network.emulateNetworkConditions',
            params: {
                offline: false,
                latency: 200,
                downloadThroughput: Math.floor(750 * 1024 / 8),
                uploadThroughput: Math.floor(250 * 1024 / 8),
            },
        }).catch((err) => {
            console.error('[Cypress Network Throttling] Error applying slow network conditions via CDP:', err);
            cy.log('⚠️ WARN: Failed to apply slow network conditions. Tests will run with default network speed.');
        });
    });

    afterEach(() => {
        cy.log('Restoring default network conditions...');
        Cypress.automation('remote:debugger:protocol', {
            command: 'Network.emulateNetworkConditions',
            params: {
                offline: false,
                latency: 0,
                downloadThroughput: -1,
                uploadThroughput: -1,
            },
        }).catch((err) => {
            console.error('[Cypress Network Throttling] Error restoring default network conditions via CDP:', err);
            cy.log('⚠️ WARN: Failed to restore default network conditions.');
        });
    });
}

console.log('cypress/support/e2e.ts executed.');
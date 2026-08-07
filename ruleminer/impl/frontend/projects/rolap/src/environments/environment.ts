export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  calcApiUrl: 'http://localhost:8000/calculate',
  manageApiUrl: 'http://localhost:8000/manage',
  bugsReportingApiUrl: 'http://localhost:8000/bugs',
  baseHref: '',
  keycloak: {
    url: 'http://localhost:8080/auth',
    realm: 'ROLAP',
    clientId: 'rolap-web',
  },
  allowSidebarLeftResize: true,
  sidebarWidth: 240, // default width of left sidebar (in pixels)
  closedSidebarWidth: 25, // width of closed sidebar (in pixels)
  minimalSidebarWidth: 85, // minimal sidebar width (in pixels)
  maximumSidebarWidth: 60, // maximum sidebar width (percentage of window width)
  logoBreakPoint: 185, // value in pixels specifying the minimum width of the sidebar, below this value the text is removed from the logo
  notifyTime: 10000, // time to hide notification
  coverageMaxRulesFiltering: 20, // max rules which can be selected for filtering the dataset on the coverage tab
  coverageMaxRulesVisible: 10, // max rules for which the coverage is visible on the coverage tab
  rules: {
    conclusionDecimalPlaces: 2, // default number of decimal places in rules conclusions (regression and survival)
    numbersDecimalPlaces: 2, // default number of decimal places in rules strings
  },
  refreshTimer: 60000, // default refresh timer for the process tab & tree
};

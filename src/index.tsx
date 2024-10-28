import logger from './loggerSingleton';
import { NetworkRequestInfoRow, StartNetworkLoggingOptions } from './types';
import NetworkRequestInfoClass from './NetworkRequestInfo';

export { default } from './components/NetworkLogger';

export const startNetworkLogging = (options?: StartNetworkLoggingOptions) => {
  logger.enableXHRInterception(options);
};

export const stopNetworkLogging = () => {
  logger.disableXHRInterception();
};

export const getRequests = () => logger.getRequests();

export const clearRequests = () => logger.clearRequests();

export { getBackHandler } from './backHandler';

export type { ThemeName, Theme } from './theme';

export { NetworkRequestInfoClass as NetworkRequestInfo };

export type { NetworkRequestInfoRow };

export {
  getWebviewNetworkInterceptor,
  getWebviewRequest,
} from './utils/webview';

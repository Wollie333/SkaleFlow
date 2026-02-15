export type { EmailSendParams, EmailSendResult, SyncedEmail, EmailSyncResult } from './types';
export {
  getGmailOAuth2Client,
  getGmailAuthUrl,
  exchangeGmailCode,
  refreshGmailToken,
  getAuthenticatedGmailToken,
  getGmailProfile,
  sendGmailMessage,
  getGmailMessage,
  getGmailHistory,
} from './gmail';

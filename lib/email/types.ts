export interface EmailSendParams {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
}

export interface EmailSendResult {
  messageId: string;
  threadId: string;
}

export interface SyncedEmail {
  messageId: string;
  threadId: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  date: string;
  inReplyTo?: string;
}

export interface EmailSyncResult {
  messages: SyncedEmail[];
  newHistoryId: string;
}

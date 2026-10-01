export type NoticeVariant = 'wiki' | 'banner' | 'callout' | 'quote' | 'minimal';
export type NoticeSeverity = 'info' | 'tip' | 'warning' | 'caution' | 'neutral';

export interface NoticeAction {
  label: string;
  url?: string;
  icon?: string;
  onClick?: string;
}

export interface NoticeItem {
  icon?: string;
  text: string;
  highlight?: boolean;
}

export interface NoticeTemplate {
  id: string;
  variant?: NoticeVariant;
  severity?: NoticeSeverity;
  icon?: string;
  title?: string;
  message?: string;
  tags?: string[];
  tagPosition?: 'header' | 'footer' | 'inline';
  items?: NoticeItem[];
  actions?: NoticeAction[];
  collapsible?: boolean;
  dismissible?: boolean;
  defaults?: Record<string, any>;
}

export interface NoticeConfig extends Partial<NoticeTemplate> {
  template?: string;
  preset?: string;
  disabled?: boolean;
  [key: string]: any;
}

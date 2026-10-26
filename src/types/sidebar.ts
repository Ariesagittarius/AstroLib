export interface SidebarItem {
  label: string;
  link?: string;
  slug?: string;
  collapsed?: boolean;
  badge?: {
    text: string;
    variant?: 'note' | 'tip' | 'danger' | 'caution' | 'success';
  };
  items?: SidebarItem[];
  attrs?: Record<string, any>;
}

export interface SidebarGroup {
  label: string;
  collapsed?: boolean;
  items: (SidebarItem | SidebarGroup)[];
}

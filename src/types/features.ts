export type FeatureCategory = 'reader' | 'extra' | 'dev';

export interface FeatureConfig {
  refs?: 'interactive' | 'static';
  [key: string]: any;
}

export interface FeatureDefInput<TConfig extends FeatureConfig = FeatureConfig> {
  id: string;
  cat: FeatureCategory;
  label?: string;
  desc?: string;
  enabled: boolean;
  devOnly: boolean;
  ui: boolean;
  requires?: string[];
  config?: TConfig;
}

export interface FeatureManifest<TConfig extends FeatureConfig = FeatureConfig> {
  id: string;
  cat: FeatureCategory;
  label: string;
  desc: string;
  enabled: boolean;
  devOnly: boolean;
  ui: boolean;
  requires?: string[];
  config?: TConfig;
}

export type FeatureRegistry = Record<string, FeatureManifest>;

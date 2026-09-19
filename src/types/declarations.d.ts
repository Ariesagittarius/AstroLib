declare module 'katex/dist/contrib/auto-render.mjs' {
  interface RenderMathInElementOptions {
    delimiters?: Array<{ left: string; right: string; display: boolean }>;
    ignoredTags?: string[];
    ignoredClasses?: string[];
    errorCallback?: (msg: string, err: any) => void;
    throwOnError?: boolean;
    strict?: boolean;
    macros?: Record<string, string>;
    [key: string]: any;
  }
  export default function renderMathInElement(
    element: HTMLElement,
    options?: RenderMathInElementOptions
  ): void;
}

declare module 'github-slugger' {
  export function slug(value: string, maintainCase?: boolean): string;
  export default class GithubSlugger {
    slug(value: string, maintainCase?: boolean): string;
    reset(): void;
  }
}

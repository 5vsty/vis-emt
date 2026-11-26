declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $translate: (key: string, fallback?: string) => string;
  }
}

export {};

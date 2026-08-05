// Shared types across packages
export interface User {
  id: string;
  email: string;
  username: string;
}

export interface PlatformConfig {
  name: string;
  version: string;
  markets: string[];
}

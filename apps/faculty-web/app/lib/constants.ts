export const ROLES = {
  INSTITUTION_ADMIN: "INSTITUTION_ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

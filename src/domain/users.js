import { ROLES, USERS } from '../constants/roles.js';

export const userName = (id) => (USERS.find((u) => u.id === id) || {}).name || "System";
export const userRoleShort = (id) => {
  const u = USERS.find((x) => x.id === id);
  return u ? ROLES[u.role].short : "Team";
};

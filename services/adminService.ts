import { api } from "./api";
import type { ResetCooldownResponse } from "../types/api";

export const adminService = {
  resetCooldown: async (): Promise<ResetCooldownResponse> => {
    const response = await api.post<ResetCooldownResponse>("/api/admin/reset-cooldown");
    return response.data;
  },
};

import api from "./api";
import type { AuthResponse, User } from "../types";

export const authApi = {
    login: async (credentials: any) => {
        const response = await api.post<AuthResponse>("/auth/login", credentials);
        return response.data;
    },
    register: async (data: any) => {
        const response = await api.post<AuthResponse>("/auth/register", data);
        return response.data;
    },
    logout: async () => {
        await api.post("/auth/logout");
    },
    me: async () => {
        const response = await api.get<User>("/auth/me");
        return response.data;
    },
};

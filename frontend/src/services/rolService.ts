import api from './api';
import type { RolResponse } from '../types/rol';

export async function getRoles(): Promise<RolResponse[]> {
    const response = await api.get<RolResponse[]>('/api/roles');
    return response.data;
}

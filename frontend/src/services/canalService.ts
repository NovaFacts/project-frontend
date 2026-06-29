import api from './api';
import type { Canal } from '../types/canal';

export async function getCanales(): Promise<Canal[]> {
    const response = await api.get<Canal[]>('/api/canales');
    return response.data;
}

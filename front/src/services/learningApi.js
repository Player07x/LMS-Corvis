import api from './api';

// Progresso
export const getProgresso = (usuarioId, trilhaId) => api.get(`/progresso/${usuarioId}/${trilhaId}`);
export const createProgresso = (data) => api.post('/progresso', data);
export const concluirTrilha = (id) => api.put(`/progresso/${id}/concluir-trilha`);
export const concluirModulo = (id) => api.put(`/progresso/${id}/concluir-modulo`);
export const deleteProgresso = (id) => api.delete(`/progresso/${id}`);

// Usuário-Conquista
export const getUserConquistas = (usuarioId, params = []) => api.get(`/progresso/conquista/${usuarioId}`, {params});
export const createUserConquista = (data) => api.post('/progresso/conquista', data);
export const updateUserConquista = (id, data) => api.put(`/progresso/conquista/${id}`, data);
export const deleteUserConquista = (id) => api.delete(`/progresso/conquista/${id}`);

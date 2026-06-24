import React, { createContext, useCallback, useEffect, useState } from 'react';
import { login as loginApi } from '../services/authApi';
import { getUserConquistas } from '../services/learningApi';
import { getUsuarioById } from '../services/userApi';

const AuthContext = createContext();
export { AuthContext };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (accessToken && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Erro ao restaurar dados do usuário:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
    setLoading(false);
  }, []);

  const calculateLevelFromXP = (xpTotal = 0) => Math.floor(Number(xpTotal || 0) / 100) + 1;

  const updateStoredUserProgress = useCallback((progressData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...progressData
    }));

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({
      ...userData,
      ...progressData
    }));
  }, []);

  const updateUserTotalXP = useCallback(async (userId) => {
    try {
      const alunoRes = await getUsuarioById(userId);
      const aluno = alunoRes.data || {};
      const xpTotal = Number(aluno.xpTotal || 0);
      const nivel = Number(aluno.nivel || calculateLevelFromXP(xpTotal));

      updateStoredUserProgress({
        xpTotal,
        xpCalculado: xpTotal,
        nivel
      });

      return xpTotal;
    } catch (alunoError) {
      console.warn('Erro ao buscar XP total do aluno, calculando pelas conquistas:', alunoError);
    }

    try {
      const conquistasRes = await getUserConquistas(userId);
      const conquistas = conquistasRes.data?.content || [];
      
      const totalXP = conquistas.reduce((total, conquista) => {
        return total + Number(conquista.conquistaXpGanho || conquista.xpGanho || conquista.xp || 0);
      }, 0);
      const nivel = calculateLevelFromXP(totalXP);
      
      updateStoredUserProgress({
        xpTotal: totalXP,
        xpCalculado: totalXP,
        nivel
      });
      
      return totalXP;
    } catch (error) {
      console.warn('Erro ao calcular XP total:', error);
      return 0;
    }
  }, [updateStoredUserProgress]);

  const login = async (credentials) => {
    const res = await loginApi(credentials);
    const tokenData = res.data;
    
    // Armazenar token
    localStorage.setItem('accessToken', tokenData.token);
    if (tokenData.refreshToken) {
      localStorage.setItem('refreshToken', tokenData.refreshToken);
    }
    
    try {
      let fullUserData;
      if (tokenData.role === 'ADMIN') {
        const adminsRes = await fetch('http://localhost:8080/usuario/admin', {
          headers: { 'Authorization': `Bearer ${tokenData.token}` }
        });
        if (adminsRes.ok) {
          const adminsData = await adminsRes.json();
          fullUserData = adminsData.content?.find(admin => admin.email === tokenData.user);
        }
      } else if (tokenData.role === 'ALUNO') {
        const alunosRes = await fetch('http://localhost:8080/usuario/aluno', {
          headers: { 'Authorization': `Bearer ${tokenData.token}` }
        });
        if (alunosRes.ok) {
          const alunosData = await alunosRes.json();
          fullUserData = alunosData.content?.find(aluno => aluno.email === tokenData.user);
        }
      }
      
      if (fullUserData) {
        localStorage.setItem('user', JSON.stringify(fullUserData));
        setUser(fullUserData);
        
        updateUserTotalXP(fullUserData.id);
        
        return fullUserData;
      }
    } catch (e) {
      console.warn('Não foi possível buscar dados completos do usuário, usando dados básicos:', e);
    }
    
    const userData = {
      email: tokenData.user || credentials.email,
      role: tokenData.role,
      nome: tokenData.user?.split('@')[0] || credentials.email.split('@')[0]
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const value = { user, login, logout, loading, updateUserTotalXP };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}



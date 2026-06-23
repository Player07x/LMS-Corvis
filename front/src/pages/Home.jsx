import React, { useEffect, useState, useRef } from 'react'
import TrackCard from '../components/TrackCard'
import ActionsBar from '../components/ActionsBar'
import { useNavigate } from 'react-router-dom'
import { getTrilhas } from '../services/trilhaApi'
import { getProgresso } from '../services/learningApi'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const navigate = useNavigate()
  const { user, updateUserTotalXP } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [trilhasWithProgress, setTrilhasWithProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const progressoCache = useRef(new Map())
  const checkedTrilhas = useRef(new Set())
  const lastUserId = useRef(null)

  useEffect(() => {
    if (user?.id && user.id !== lastUserId.current) {
      progressoCache.current.clear()
      checkedTrilhas.current.clear()
      lastUserId.current = user.id
    }

    getTrilhas()
      .then(res => {
        const trilhasData = Array.isArray(res.data.content) ? res.data.content : []
        
        if (user?.id && trilhasData.length > 0) {
          return Promise.allSettled(
            trilhasData.map(async (trilha) => {
              const cacheKey = `${user.id}-${trilha.id}`
              
              if (progressoCache.current.has(cacheKey)) {
                const cachedData = progressoCache.current.get(cacheKey)
                return {
                  ...trilha,
                  ...cachedData
                }
              }
              
              if (checkedTrilhas.current.has(cacheKey)) {
                return {
                  ...trilha,
                  progresso: 0,
                  xpGanho: 0,
                  status: 'Não Iniciado'
                }
              }
              
              try {
                const progressoRes = await getProgresso(user.id, trilha.id)
                const progressoData = {
                  progresso: progressoRes.data.percentual || 0,
                  xpGanho: progressoRes.data.xpGanho || 0,
                  status: progressoRes.data.percentual >= 100 ? 'Completo' : 
                          progressoRes.data.percentual >= 0 ? 'Em andamento' : 'Não Iniciado'
                }
                
                progressoCache.current.set(cacheKey, progressoData)
                
                return {
                  ...trilha,
                  ...progressoData
                }
              } catch (error) {
                checkedTrilhas.current.add(cacheKey)
                
                if (error.response?.status !== 404) {
                  console.warn(`Erro ao buscar progresso para trilha ${trilha.id}:`, error.message);
                }
                return {
                  ...trilha,
                  progresso: 0,
                  xpGanho: 0,
                  status: 'Não Iniciado'
                }
              }
            })
          )
        } else {
          return trilhasData.map(trilha => ({
            ...trilha,
            progresso: 0,
            xpGanho: 0,
            status: 'Não Iniciado'
          }))
        }
      })
      .then(results => {
        if (Array.isArray(results) && results.length > 0 && results[0]?.status) {
          const trilhasComProgresso = results.map(result => 
            result.status === 'fulfilled' ? result.value : result.reason
          )
          setTrilhasWithProgress(trilhasComProgresso)
        } else {
          setTrilhasWithProgress(results || [])
        }
        
      })
      .catch(error => {
        console.error('Erro ao carregar trilhas:', error)
        setError('Erro ao carregar trilhas. Use a página /populate para criar dados.')
        setTrilhasWithProgress([])
      })
      .finally(() => setLoading(false))
  }, [user?.id])
  
  useEffect(() => {
    if (updateUserTotalXP && user?.id && trilhasWithProgress.length > 0) {
      updateUserTotalXP(user.id)
    }
  }, [trilhasWithProgress, updateUserTotalXP, user?.id])

  if (loading) return <div className="text-white p-8">Carregando trilhas...</div>
  if (error) return <div className="text-red-500 p-8">{error}</div>

  return (
    <div className=" min-w-screen bg-[#0e0e0e] text-white">
      <div className="text-center mb-10 mt-16">
        <h1 className="text-3xl md:text-7xl font-bold text-[#E4E4E4] font-fancy mt-4 tracking-tight">
          Bem-vindo ao <span className="text-green-600">Corvis</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base max-w-md mx-auto">
          Aprenda como quem joga: complete trilhas, ganhe XP, evolua, siga o corvo.
        </p>
        <hr className="border-t border-green-600/50 w-[97%] mx-auto mt-6" />
      </div>
      <ActionsBar 
        showAdminActions={isAdmin}
        onAdmin={() => window.location.assign('/admin/lista-trilhas.html')}
        onAdd={() => window.location.assign('/admin/forms/form-trilha.html')}
        onFilter={() => {}} 
        onSort={() => {}} 
      />
      <div className="grid gap-6 p-6 transition-all duration-300 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {trilhasWithProgress.map((trilha) => (
          <TrackCard
            key={trilha.id}
            language={trilha.linguagem || trilha.nome}
            level={trilha.nivel || trilha.level || ''}
            status={trilha.status || 'Iniciado'}
            xp={trilha.xpGanho || 0}
            xpGain={trilha.xpGanho || 0}
            progress={trilha.progresso || 0}
            onAction={() => navigate(`/trilha?id=${trilha.id}`)}
          />
        ))}
      </div>
    </div>
  )
}

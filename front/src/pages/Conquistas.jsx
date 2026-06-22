import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrophyIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import { getUserConquistas } from '../services/learningApi'

const tipoIconMap = {
  TRILHA: <TrophyIcon className="w-7 h-7 text-yellow-500" />,
  MODULO: <AcademicCapIcon className="w-7 h-7 text-green-500" />,
}

const tipoLabelMap = {
  TRILHA: 'Trilha Concluída',
  MODULO: 'Módulo Concluído',
}

export default function Conquistas() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [conquistas, setConquistas] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    getUserConquistas(user.id, { page, size: 9 })
      .then(res => {
        const data = res.data
        const content = Array.isArray(data?.content) ? data.content : []
        setConquistas(content)
        setTotalPages(data?.totalPages ?? 0)
        setTotalElements(data?.totalElements ?? content.length)
      })
      .catch(() => {
        setError('Não foi possível carregar suas conquistas. Tente novamente mais tarde.')
        setConquistas([])
      })
      .finally(() => setLoading(false))
  }, [user?.id, page])

  const xpTotalConquistas = conquistas.reduce((acc, c) => acc + (c.conquistaXpGanho || 0), 0)

  return (
    <div className="min-w-screen min-h-screen bg-[#0e0e0e] text-white">
      <div className="text-center mb-10 mt-16 px-6">
        <button
          onClick={() => navigate('/')}
          className="absolute left-6 top-6 flex items-center gap-2 px-3 py-2 bg-[#E4E4E4] text-gray-700 font-semibold rounded-full hover:bg-gray-100 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Voltar
        </button>

        <h1 className="text-3xl md:text-6xl font-bold text-[#E4E4E4] font-fancy mt-4 tracking-tight">
          Suas <span className="text-green-600">Conquistas</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base max-w-md mx-auto">
          Acompanhe todas as trilhas e módulos que você já concluiu no Corvis.
        </p>
        <hr className="border-t border-green-600/50 w-[97%] mx-auto mt-6" />
      </div>

      <div className="px-6 md:px-16 pb-16">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
            <p>Carregando conquistas...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-red-400 py-10">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm md:text-base">
              <span className="text-gray-300">
                Total de conquistas: <span className="text-white font-semibold">{totalElements}</span>
              </span>
              <span className="text-gray-300">
                XP nesta página: <span className="text-green-500 font-semibold">{xpTotalConquistas} XP</span>
              </span>
            </div>

            {conquistas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                <div className="bg-white p-4 rounded-full mb-4">
                  <TrophyIcon className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-lg font-semibold">Nenhuma conquista ainda</p>
                <p className="text-sm mt-1">Complete trilhas e módulos para desbloquear conquistas!</p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {conquistas.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-green-600/50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="bg-white p-3 rounded-full">
                        {tipoIconMap[item.conquistaTipo] || tipoIconMap['TRILHA']}
                      </div>
                      <span className="text-green-500 font-fancy text-sm font-semibold">
                        +{item.conquistaXpGanho || 0} XP
                      </span>
                    </div>

                    <div>
                      <h3 className="text-white font-fancy text-lg font-semibold">
                        {item.conquistaNome}
                      </h3>
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        {tipoLabelMap[item.conquistaTipo] || item.conquistaTipo}
                      </span>
                    </div>

                    {item.conquistaDescricao && (
                      <p className="text-gray-400 text-sm">{item.conquistaDescricao}</p>
                    )}

                    {(item.conquistaTrilha || item.conquistaModulo) && (
                      <p className="text-gray-500 text-xs">
                        {item.conquistaTrilha && <>Trilha: {item.conquistaTrilha}</>}
                        {item.conquistaTrilha && item.conquistaModulo && ' • '}
                        {item.conquistaModulo && <>Módulo: {item.conquistaModulo}</>}
                      </p>
                    )}

                    <div className="text-gray-500 text-xs mt-auto pt-2 border-t border-gray-800">
                      {item.dataConquista
                        ? `Conquistado em ${new Date(item.dataConquista).toLocaleDateString('pt-BR')}`
                        : 'Sem data'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-4 py-2 bg-[#E4E4E4] text-gray-700 font-semibold rounded-full hover:bg-gray-100 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Anterior
                </button>
                <span className="text-gray-400 text-sm">
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-4 py-2 bg-[#E4E4E4] text-gray-700 font-semibold rounded-full hover:bg-gray-100 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próxima
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrophyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { getUserConquistas } from '../services/learningApi'
import { useAuth } from '../hooks/useAuth'

export default function Conquistas() {
  const { user, updateUserTotalXP } = useAuth()
  const [conquistas, setConquistas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id) return

    setLoading(true)
    getUserConquistas(user.id)
      .then(res => {
        setConquistas(res.data?.content || [])
        updateUserTotalXP?.(user.id)
      })
      .catch(() => setError('Erro ao carregar conquistas.'))
      .finally(() => setLoading(false))
  }, [user?.id, updateUserTotalXP])

  const conquistasOrdenadas = [...conquistas].sort((a, b) => {
    const dateA = new Date(a.dataConquista || a.data || 0)
    const dateB = new Date(b.dataConquista || b.data || 0)
    return dateB - dateA
  })

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e7eb] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#e5e7eb] text-[#0e0e0e] font-semibold rounded-full hover:bg-white transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          voltar
        </Link>

        <header className="mt-10 border-b border-green-700/60 pb-8">
          <p className="text-green-600 font-bold uppercase tracking-wide text-sm">Progresso do estudante</p>
          <h1 className="mt-2 text-4xl md:text-6xl font-bold">Conquistas</h1>
        </header>

        {loading && <p className="mt-8 text-gray-400">Carregando conquistas...</p>}
        {error && <p className="mt-8 text-red-400">{error}</p>}

        {!loading && !error && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {conquistasOrdenadas.map(conquista => (
              <article
                key={conquista.id}
                className="rounded-xl border border-green-700/40 bg-[#171717] p-5 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-white p-3">
                    <TrophyIcon className="w-7 h-7 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-white">
                      {conquista.conquistaNome || conquista.nome || 'Conquista'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      {conquista.conquistaDescricao || conquista.descricao || 'Sem descricao.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-green-900/60 px-3 py-1 text-green-300">
                        {conquista.conquistaXpGanho || conquista.xpGanho || 0} XP
                      </span>
                      <span className="rounded-full bg-gray-800 px-3 py-1 text-gray-300">
                        {conquista.conquistaTipo || conquista.tipo || 'Conquista'}
                      </span>
                      <span className="rounded-full bg-gray-800 px-3 py-1 text-gray-300">
                        {conquista.dataConquista
                          ? new Date(conquista.dataConquista).toLocaleDateString('pt-BR')
                          : 'Sem data'}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {conquistasOrdenadas.length === 0 && (
              <div className="md:col-span-2 rounded-xl border border-dashed border-gray-700 p-10 text-center text-gray-400">
                Complete modulos e trilhas para liberar conquistas.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

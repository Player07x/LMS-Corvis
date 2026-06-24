import React from 'react'
import {
  TrophyIcon,
  CheckCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

const iconMap = {
  trophy: <TrophyIcon className="w-6 h-6 text-yellow-500" />,
  check: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
  user: <UserCircleIcon className="w-6 h-6 text-blue-500" />,
}

export default function AchievementsBox({ conquistas = [] }) {
  const conquistasArray = Array.isArray(conquistas) ? conquistas : []
  const conquistasOrdenadas = [...conquistasArray].sort((a, b) => {
    const dateA = new Date(a.dataConquista || a.data || 0)
    const dateB = new Date(b.dataConquista || b.data || 0)
    return dateB - dateA
  })
  
  const conquistasExibidas = conquistasOrdenadas.slice(0, 3)
  const temMaisConquistas = conquistasOrdenadas.length > 3
  
  return (
    <div className="mt-4 py-4 max-w-sm flex flex-col justify-center items-center bg-black/80 border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 mb-3">
        <h2 className="text-white text-lg font-semibold">
          Conquistas ({conquistasOrdenadas.length})
        </h2>
      </div>

      <div className="w-full max-h-48 overflow-hidden">
        <ul className="px-2">
          {conquistasExibidas.map((item) => (
            <li
              key={item.id}
              className="flex items-center bg-gray-100 rounded-full justify-between px-14 pl-0 mb-2 mx-2"
            >
              <div className="flex items-center space-x-2">
                <div className="bg-white p-3 rounded-full">
                  {iconMap[item.icon] || iconMap['trophy']}
                </div>
                <span className="font-fancy text-black/80 text-sm">
                  {item.conquistaNome || item.nome || item.title || 'Conquista'}
                </span>
              </div>
              <div className="text-right text-[0.8rem] ml-3 -mr-8">
                <div className="text-green-600 font-fancy text-[0.9rem]">
                  {item.conquistaXpGanho || item.xp || 0} XP
                </div>
                <div className="text-gray-500 text-xs">
                  {item.dataConquista ? new Date(item.dataConquista).toLocaleDateString('pt-BR') : 
                   (item.data ? new Date(item.data).toLocaleDateString('pt-BR') : 'Sem data')}
                </div>
              </div>
            </li>
          ))}
          
          {conquistasExibidas.length === 0 && (
            <li className="text-center text-gray-400 py-4">
              <div className="bg-white p-3 rounded-full inline-block mb-2">
                <TrophyIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm">Nenhuma conquista ainda</p>
              <p className="text-xs">Complete trilhas para ganhar conquistas!</p>
            </li>
          )}
        </ul>
      </div>
      
      {temMaisConquistas && (
        <Link
          to="/conquistas"
          className="mt-3 px-5 py-2 rounded-full border border-green-500 bg-green-900/80 text-green-100 shadow-md font-semibold text-sm hover:bg-green-800 hover:text-white transition-colors"
        >
          Ver Mais
        </Link>
      )}
    </div>
  )
}

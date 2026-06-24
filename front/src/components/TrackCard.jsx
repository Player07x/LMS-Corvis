import React from 'react'

const normalizePercent = (value) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 0
  return Math.min(Math.max(numericValue, 0), 100)
}

const formatPercent = (value) => {
  return normalizePercent(value)
    .toFixed(1)
    .replace(/\.0$/, '')
    .replace('.', ',')
}

const statusColors = {
  'Em andamento': 'bg-yellow-300',
  'Não Iniciado': 'bg-gray-400',
  'Carregando...': 'bg-gray-300',
  Iniciado:     'bg-blue-400',
  Completo:     'bg-green-500',
}

export default function TrackCard({
  language,
  level,
  status,
  xp,
  xpGain,
  progress,
  onAction,
}) {
  const color = statusColors[status] || 'bg-red-400'
  const normalizedProgress = normalizePercent(progress)

  return (
    <div className="bg-[#E4E4E4] rounded-lg shadow-md overflow-hidden flex flex-col  h-full">
      <div className={`h-6 ${color} flex justify-center items-center px-3 text-black/70 font-semibold text-xs`}>
        {status}
      </div>
      <div className="p-4 flex flex-col justify-between items-start">
        <div className='flex justify-between w-full px-4'>
          <div className=''>
            <h3 className="text-3xl font-semibold text-black/50">{language}: {level}</h3>
          </div>
          <div className=''>
            <p className="text-3xl font-semibold text-black/50">{xp} xp</p>
          </div>
        </div>
        <div className='flex justify-between w-full px-4 mt-2'>
          <div className=''>
            <p className="text-sm text-gray-600">Progresso: {formatPercent(normalizedProgress)}%</p>
          </div>
          <div className=''>
            <p className="text-sm text-green-600">XP Ganho: {xpGain}</p>
          </div>
        </div>
        <div className='w-full px-4'>
            <div className="w-full bg-black h-1 rounded-full mt-2">
                <div
                className="h-1 rounded-full bg-green-500"
                style={{ width: `${normalizedProgress}%` }}
                />
            </div>
        </div>
        <div className='w-full px-4 mt-4 '>
                <button
                onClick={onAction}
                className="w-full py-1 rounded-md bg-black/70 font-semibold text-white text-md"
                >
                Acessar Trilha
                </button>
        </div>
      </div>


      
    </div>
  )
}


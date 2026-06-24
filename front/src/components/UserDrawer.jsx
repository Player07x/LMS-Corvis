import { useEffect, useState } from "react"
import { getUserConquistas } from "../services/learningApi"
import { useAuth } from '../hooks/useAuth.js'
import UserAvatar from "./UserAvatar"
import AchievementsBox from "./AchievementsBox"

export default function UserDrawer({ setOpen, usuarioId: propUsuarioId }) {
  const { user, logout, updateUserTotalXP } = useAuth()
  const [conquistas, setConquistas] = useState([])

  const activeUser = user
  const usuarioId = propUsuarioId || activeUser?.id

  useEffect(() => {
    if (usuarioId) {
      getUserConquistas(usuarioId)
        .then(res => {
          const conquistasData = res.data?.content || []
          setConquistas(conquistasData)
          updateUserTotalXP?.(usuarioId)
        })
        .catch(error => {
          console.error('Error fetching conquistas:', error)
          setConquistas([])
        })
    } else {
      console.log('UserDrawer - No usuarioId, setting empty conquistas')
      setConquistas([])
    }
  }, [usuarioId, updateUserTotalXP])

  return (
    <div className="h-screen w-full bg-[#E4E4E4] shadow-lg flex flex-col items-center p-7 space-y-12 relative">
      <button 
        onClick={() => setOpen(false)} 
        className="absolute top-5 left-3 bg-white text-black px-1.5 py-2 rounded-2xl shadow-lg hover:bg-gray-100 transition-colors duration-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="size-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {activeUser && (
        <button
          onClick={logout}
          className="absolute top-5 right-5 h-9 px-5 border-2 border-red-500/70 text-red-600 rounded-full bg-white/60 font-semibold hover:bg-red-500 hover:text-white transition-colors duration-300"
        >
          Sair
        </button>
      )}
      
      <UserAvatar 
        level={activeUser?.nivel || 1} 
        xp={activeUser?.xpTotal || 0} 
      />
      
      <div className="text-green-700 font-fancy">XP: {activeUser?.xpTotal || 0}</div>
      <div className="text-black/80 text-2xl font-semibold font-fancy">{activeUser?.nome || 'Usuário'}</div>
      
      <div className="w-full px-5">
        <AchievementsBox conquistas={conquistas} />
      </div>
    </div>
  )
}

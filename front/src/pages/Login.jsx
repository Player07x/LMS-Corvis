import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'
import logomarca from '../assets/logomarca.jpg'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (credentials) => {
    await login(credentials)
    
    if (JSON.parse(localStorage.getItem('user')).role === 'ADMIN') {
      window.location.href = '/admin/lista-trilhas.html'
      return
    }
    
    navigate('/')
  }

  return (
    <div className="flex min-h-screen font-inria text-lg">
      {/* painel esquerdo */}
      <div className="flex-1 bg-[#0e0e0e] text-white flex flex-col justify-center px-16">
        <h1 className="text-5xl font-bold mb-4 text-green-500">Bem Vindo ao Corvis!</h1>
        <p className="max-w-xl leading-relaxed">
          Prepare-se para explorar trilhas repletas de descobertas, colecionar
          conquistas e desvendar novas habilidades em um universo gamificado
          criado especialmente para você.
        </p>
      </div>

      <div className="w-[30%] bg-gray-200 p-8 lg:p-10 rounded-l-2xl shadow-lg flex flex-col items-center space-y-6">
        <img
          src={logomarca}
          alt="Corvis"
          className="h-32 w-32 rounded-full object-cover"
        />

        <LoginForm onLogin={handleLogin} />

        <div className="w-full flex flex-col items-start space-y-2 text-sm">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-300 peer-checked:bg-green-500 rounded-full peer-focus:ring-2 peer-focus:ring-green-300 transition-colors"></div>
              <div className="absolute top-0.5 left-0.5 peer-checked:left-4 w-5 h-5 bg-white rounded-full shadow transform transition-transform"></div>
            </div>
            <span className="ml-3 text-black font-medium">Manter-me conectado</span>
          </label>

          <button className="text-gray-600 hover:text-gray-800 font-medium">
            Esqueci minha senha?
          </button>
        </div>

        {/* Link centralizado para cadastro, com espaçamento em relação ao "Esqueci minha senha" */}
        <div className="w-full mt-6 flex justify-center">
          <Link to="/cadastro" className="text-sm text-gray-700 hover:text-green-600 font-medium">
            Não tem conta? <span className="font-semibold">Registre</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

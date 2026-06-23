import React, { useCallback, useEffect, useState } from 'react'
import TrackDrawer from '../components/TrackDrawer'
import ReactFlow, {
  Handle,
  Position,
  Controls,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { ArrowLeftIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/solid'
import { useSearchParams } from 'react-router-dom'
import { getTrilhaById } from '../services/trilhaApi'
import { getProgresso, createProgresso, concluirModulo } from '../services/learningApi'
import { useAuth } from '../hooks/useAuth.js'

// Configurações do círculo de progresso
const size = 64
const strokeWidth = 6
const radius = (size - strokeWidth) / 2
const circumference = 2 * Math.PI * radius

// Estilos dos nós inspirados no código antigo
const mainStyle = {
  width: 200,
  padding: 10,
  background: '#111',
  color: '#fff',
  borderRadius: 8,
  textAlign: 'center',
}

const lateralStyle = {
  width: 200,
  padding: 8,
  background: '#fff',
  color: '#0e0e0ee5',
  borderRadius: 6,
  textAlign: 'center',
}

// Componente de nó customizado
const CustomNode = React.memo(function CustomNode({ data }) {
  const style = data.isMain ? mainStyle : lateralStyle
  const isLocked = !data.done && !data.isCurrent
  
  return (
    <div style={{ position: 'relative', ...style }}>
      {data.handles.map(h => (
        <Handle
          key={h.id}
          id={h.id}
          type={h.type}
          position={h.position}
          style={h.style}
        />
      ))}
      <div style={{ whiteSpace: 'pre-wrap' }} className="flex items-center justify-between">
        <span
          className={`h-8 w-8 min-w-8 rounded-full mr-2 flex items-center justify-center ${
            data.done ? 'bg-green-500' : 
            data.isCurrent ? 'bg-blue-500' : 
            'bg-gray-500'
          }`}
        >
          {isLocked ? (
            <LockClosedIcon className="w-4 h-4 text-white" />
          ) : data.done ? (
            <CheckCircleIcon className="w-4 h-4 text-white" />
          ) : data.isCurrent ? (
            <div className="w-3 h-3 rounded-full bg-white"></div>
          ) : null}
        </span>
        <div className="flex-1 flex justify-center font-semibold">
          <div className="whitespace-pre-wrap text-center">
            {data.label}
            <br />
            {data.xp} XP
          </div>
        </div>
      </div>
    </div>
  )
})

// Define nodeTypes fora do componente para evitar re-criação
const nodeTypes = { custom: CustomNode }

export default function Trilha({ activeUser }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [started, setStarted] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [searchParams] = useSearchParams()
  const [trilhaData, setTrilhaData] = useState(null)
  const [progresso, setProgresso] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const trilhaId = searchParams.get('id')
  const { user, updateUserTotalXP } = useAuth()

  // Usar o usuário ativo passado como prop ou o usuário logado
  const usuarioId = activeUser?.id || user?.id

  // Função para tratar o clique no nó
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  useEffect(() => {
    if (!trilhaId) return
    
    console.log('Debug: usuarioId =', usuarioId, 'trilhaId =', trilhaId, 'user =', user, 'activeUser =', activeUser);
    
    // Buscar dados da trilha e progresso
    setIsLoading(true)
    // Primeiro buscar a trilha
    getTrilhaById(trilhaId)
      .then(trilhaRes => {
        setTrilhaData(trilhaRes.data);
        
        if (!usuarioId) {
          // Se não há usuário, mostrar a trilha sem progresso e permitir iniciar
          setStarted(false)
          setProgresso(null)
          
          const modulosSorted = [...trilhaRes.data.modulos].sort((a, b) => a.ordem - b.ordem)
          const nodesArray = []
          const edgesArray = []
          
          const verticalSpacing = 150
          const startY = 150
          const centerX = 400
          
          modulosSorted.forEach((modulo, index) => {
            const nodeId = `module-${modulo.id}`
            const isFirst = index === 0
            
            nodesArray.push({
              id: nodeId,
              type: 'custom',
              position: { 
                x: centerX, 
                y: startY + (index * verticalSpacing) 
              },
              data: {
                label: modulo.titulo,
                xp: modulo.conquista?.xpGanho || 0,
                description: modulo.conteudo,
                isMain: true,
                done: false,
                isCurrent: isFirst,
                isLocked: !isFirst,
                moduleId: modulo.id,
                order: modulo.ordem,
                handles: [
                  { 
                    id: `${nodeId}-top`, 
                    type: 'target', 
                    position: Position.Top,
                    style: { opacity: index === 0 ? 0 : 1 }
                  },
                  { 
                    id: `${nodeId}-bottom`, 
                    type: 'source', 
                    position: Position.Bottom,
                    style: { opacity: index === modulosSorted.length - 1 ? 0 : 1 }
                  }
                ]
              }
            })
            
            if (index > 0) {
              const prevNodeId = `module-${modulosSorted[index - 1].id}`
              edgesArray.push({
                id: `edge-${index}`,
                source: prevNodeId,
                sourceHandle: `${prevNodeId}-bottom`,
                target: nodeId,
                targetHandle: `${nodeId}-top`,
                style: { 
                  stroke: '#6b7280',
                  strokeWidth: 2
                },
                animated: false
              })
            }
          })
          
          setNodes(nodesArray)
          setEdges(edgesArray)
          setIsLoading(false)
          return
        }
        
        return getProgresso(usuarioId, trilhaId)
          .then(progressoRes => {
            setStarted(true)
            setProgresso(progressoRes.data)
            
            // Gerar nós e arestas para estrutura linear
            const modulosSorted = [...trilhaRes.data.modulos].sort((a, b) => a.ordem - b.ordem)
            const nodesArray = []
            const edgesArray = []
            
            // Configuração do layout
            const verticalSpacing = 150
            const startY = 150
            const centerX = 400 // Posição X fixa para alinhamento central
            
            // Determinar status dos módulos baseado no progresso
            const moduloAtualIndex = progressoRes.data.trilha_modulos.findIndex(
              modId => modId === progressoRes.data.moduloAtual_id
            )
            
            // Verificar se a trilha está concluída
            const trilhaConcluida = progressoRes.data.percentual >= 100
            
            // Criar nós para cada módulo em ordem linear
            modulosSorted.forEach((modulo, index) => {
              const nodeId = `module-${modulo.id}`
              
              // Determinar status do módulo
              const moduloIndexInProgress = progressoRes.data.trilha_modulos.findIndex(
                modId => modId === modulo.id
              )
              
              let isDone, isCurrent, isLocked
              
              if (trilhaConcluida) {
                isDone = true
                isCurrent = false
                isLocked = false
              } else {
                isDone = moduloIndexInProgress !== -1 && moduloIndexInProgress < moduloAtualIndex
                isCurrent = modulo.id === progressoRes.data.moduloAtual_id
                isLocked = !isDone && !isCurrent
              }
              
              // Criar nó do módulo
              nodesArray.push({
                id: nodeId,
                type: 'custom',
                position: { 
                  x: centerX, 
                  y: startY + (index * verticalSpacing) 
                },
                data: {
                  label: modulo.titulo,
                  xp: modulo.conquista?.xpGanho || 0,
                  description: modulo.conteudo,
                  isMain: true,
                  done: isDone,
                  isCurrent: isCurrent,
                  isLocked: isLocked,
                  moduleId: modulo.id,
                  order: modulo.ordem,
                  handles: [
                    { 
                      id: `${nodeId}-top`, 
                      type: 'target', 
                      position: Position.Top,
                      style: { opacity: index === 0 ? 0 : 1 }
                    },
                    { 
                      id: `${nodeId}-bottom`, 
                      type: 'source', 
                      position: Position.Bottom,
                      style: { opacity: index === modulosSorted.length - 1 ? 0 : 1 }
                    }
                  ]
                }
              })
              
              // Criar conexão com o módulo anterior
              if (index > 0) {
                const prevNodeId = `module-${modulosSorted[index - 1].id}`
                
                let edgeColor
                if (trilhaConcluida) {
                  edgeColor = '#10b981'
                } else {
                  edgeColor = isDone || isCurrent ? '#10b981' : '#6b7280'
                }
                
                edgesArray.push({
                  id: `edge-${index}`,
                  source: prevNodeId,
                  sourceHandle: `${prevNodeId}-bottom`,
                  target: nodeId,
                  targetHandle: `${nodeId}-top`,
                  style: { 
                    stroke: edgeColor,
                    strokeWidth: 2
                  },
                  animated: !trilhaConcluida && isCurrent
                })
              }
            })
            
            // Atualizar estado do grafo
            setNodes(nodesArray)
            setEdges(edgesArray)
            setIsLoading(false)
          })
          .catch(error => {
            console.log('No existing progress found (expected for new trilhas):', error.response?.status);
            if (error.response?.status === 404) {
              setStarted(false)
              setProgresso(null)
              
              const modulosSorted = [...trilhaRes.data.modulos].sort((a, b) => a.ordem - b.ordem)
              const nodesArray = []
              const edgesArray = []
              
              const verticalSpacing = 150
              const startY = 150
              const centerX = 400
              
              modulosSorted.forEach((modulo, index) => {
                const nodeId = `module-${modulo.id}`
                const isFirst = index === 0
                
                nodesArray.push({
                  id: nodeId,
                  type: 'custom',
                  position: { 
                    x: centerX, 
                    y: startY + (index * verticalSpacing) 
                  },
                  data: {
                    label: modulo.titulo,
                    xp: modulo.conquista?.xpGanho || 0,
                    description: modulo.conteudo,
                    isMain: true,
                    done: false,
                    isCurrent: isFirst,
                    isLocked: !isFirst,
                    moduleId: modulo.id,
                    order: modulo.ordem,
                    handles: [
                      { 
                        id: `${nodeId}-top`, 
                        type: 'target', 
                        position: Position.Top,
                        style: { opacity: index === 0 ? 0 : 1 }
                      },
                      { 
                        id: `${nodeId}-bottom`, 
                        type: 'source', 
                        position: Position.Bottom,
                        style: { opacity: index === modulosSorted.length - 1 ? 0 : 1 }
                      }
                    ]
                  }
                })
                
                if (index > 0) {
                  const prevNodeId = `module-${modulosSorted[index - 1].id}`
                  edgesArray.push({
                    id: `edge-${index}`,
                    source: prevNodeId,
                    sourceHandle: `${prevNodeId}-bottom`,
                    target: nodeId,
                    targetHandle: `${nodeId}-top`,
                    style: { 
                      stroke: '#6b7280',
                      strokeWidth: 2
                    },
                    animated: false
                  })
                }
              })
              
              setNodes(nodesArray)
              setEdges(edgesArray)
              setIsLoading(false)
            } else {
              throw error;
            }
          });
      })
      .catch(error => {
        console.error('Erro ao carregar dados:', error)
        setIsLoading(false)
      })
  }, [trilhaId, usuarioId, user, activeUser, setNodes, setEdges])

  const handleIniciarTrilha = async () => {
    try {
      const currentUsuarioId = activeUser?.id || user?.id
      
      if (!currentUsuarioId) {
        alert('Você precisa estar logado para iniciar uma trilha.');
        return;
      }
      
      console.log('Creating new progresso for usuarioId:', currentUsuarioId, 'trilhaId:', trilhaId);
      const result = await createProgresso({
        usuarioId: currentUsuarioId,
        trilhaId: Number(trilhaId)
      });
      
      console.log('createProgresso success:', result);
      setProgresso(result.data);
      setStarted(true);
      
      window.location.reload();
      
    } catch (createError) {
      console.error('createProgresso failed:', createError);
      alert('Erro ao iniciar trilha. Tente novamente.');
    }
  }

  // Função para concluir um módulo
  const handleCompleteModule = useCallback(async () => {
    if (!progresso?.id) return
    
    try {
      // Chama a API para concluir o módulo
      const response = await concluirModulo(progresso.id)
      
      // Atualiza o progresso local
      setProgresso(response.data)
      
      if (updateUserTotalXP && usuarioId) {
        await updateUserTotalXP(usuarioId)
      }
      
      // Atualizar o status dos nós baseado no novo progresso
      const moduloAtualIndex = response.data.trilha_modulos.findIndex(
        modId => modId === response.data.moduloAtual_id
      )
      
      const trilhaConcluida = response.data.percentual >= 100
      
      setNodes(currentNodes =>
        currentNodes.map(node => {
          if (!node.data.isMain) return node
          
          const moduloIndexInProgress = response.data.trilha_modulos.findIndex(
            modId => modId === node.data.moduleId
          )
          
          let isDone, isCurrent, isLocked
          
          if (trilhaConcluida) {
            isDone = true
            isCurrent = false
            isLocked = false
          } else {
            isDone = moduloIndexInProgress !== -1 && moduloIndexInProgress < moduloAtualIndex
            isCurrent = node.data.moduleId === response.data.moduloAtual_id
            isLocked = !isDone && !isCurrent
          }
          
          return {
            ...node,
            data: { 
              ...node.data, 
              done: isDone,
              isCurrent: isCurrent,
              isLocked: isLocked
            }
          }
        })
      )
      
      // Atualizar as bordas também
      setEdges(currentEdges =>
        currentEdges.map(edge => {
          const targetNode = nodes.find(n => n.id === edge.target)
          const targetModuleIndex = response.data.trilha_modulos.findIndex(
            modId => modId === targetNode?.data.moduleId
          )
          
          let edgeColor
          if (trilhaConcluida) {
            edgeColor = '#10b981'
          } else {
            const targetIsDone = targetModuleIndex !== -1 && targetModuleIndex < moduloAtualIndex
            const targetIsCurrent = targetNode?.data.moduleId === response.data.moduloAtual_id
            edgeColor = targetIsDone || targetIsCurrent ? '#10b981' : '#6b7280'
          }
          
          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: edgeColor
            },
            animated: !trilhaConcluida && targetNode?.data.moduleId === response.data.moduloAtual_id
          }
        })
      )
      
      // Fechar o drawer se estiver aberto
      setSelectedNode(null)
      
    } catch (error) {
      console.error('Erro ao concluir módulo:', error)
      // Mostrar mensagem de erro para o usuário
      alert('Erro ao concluir módulo. Verifique se os dados da trilha estão corretos.')
    }
  }, [progresso?.id, setNodes, setEdges, nodes, updateUserTotalXP, usuarioId])

  // Atualizar a função toggleDone para usar handleCompleteModule
  const toggleDone = useCallback((id) => {
    const node = nodes.find(n => n.id === id)
    if (!node?.data.isMain || !node?.data.isCurrent) return
    handleCompleteModule()
  }, [nodes, handleCompleteModule])

  const onInit = useCallback((flowInstance) => {
    if (!nodes.length) return

    // Ajustar viewport para centralizar na trilha
    const zoom = 0.8
    const firstNode = nodes[0]
    const lastNode = nodes[nodes.length - 1]
    
    // Calcular centro da trilha
    const centerY = (firstNode.position.y + lastNode.position.y) / 2
    const centerX = firstNode.position.x
    
    // Posicionar viewport
    const vw = window.innerWidth
    const vh = window.innerHeight
    const panX = vw / 2 - centerX * zoom
    const panY = vh / 2 - centerY * zoom
    
    flowInstance.setViewport({ x: panX, y: panY, zoom })
  }, [nodes])

  return (
    <div className="relative w-full h-screen bg-[#0e0e0e]">
      <div className="px-28 z-50 absolute top-0 left-0 w-full flex items-center justify-between p-4 bg-[#0e0e0e] bg-opacity-80">
        <button
          onClick={() => history.back()}
          className="flex items-center gap-2 px-4 py-2 bg-[#e4e4e4] text-gray-700 font-semibold rounded-full hover:bg-gray-100 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          voltar
        </button>
        <div className="text-center text-white">
          <h1 className="text-4xl font-semibold text-white/90">{trilhaData?.nome || '...'}</h1>
          <p className="text-lg font-semibold">
            <span className="text-[#e4e4e4]">{progresso?.xpGanho || 0}/</span>
            <span className="text-green-600">{trilhaData?.modulos?.reduce((total, mod) => total + (mod.conquista?.xpGanho || 0), 0) + (trilhaData?.conquista?.xpGanho || 0) || 0} xp</span>
          </p>
        </div>
        <div className="w-30 h-30 flex flex-col items-center mt-6">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size/2}
              cy={size/2}
              r={radius}
              stroke="#333"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={size/2}
              cy={size/2}
              r={radius}
              stroke="#4ade80"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - (progresso?.percentual || 0) / 100)}
              transform={`rotate(-90 ${size/2} ${size/2})`}
            />
          </svg>
          <div className="text-green-600 font-semibold text-lg">{progresso?.percentual || 0}%</div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onInit={onInit}
        fitView={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
      >
        <Controls showInteractive={false} />
      </ReactFlow>

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-lg">Carregando...</div>
        </div>
      ) : (
        <>
          {!started && (
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-black to-transparent flex items-center justify-center">
              <button
                onClick={handleIniciarTrilha}
                className="px-40 absolute bottom-20 py-3 bg-[#e4e4e4] text-[#0e0e0e] font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors duration-200"
              >
                iniciar trilha
              </button>
            </div>
          )}

          {selectedNode && (
            <TrackDrawer
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onToggleDone={toggleDone}
            />
          )}
        </>
      )}
    </div>
  )
}

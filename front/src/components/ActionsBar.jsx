import {
  AdjustmentsVerticalIcon,
  ArrowRightStartOnRectangleIcon,
  FunnelIcon,
  PlusIcon,
} from '@heroicons/react/24/solid'

const ActionsBar = ({ onFilter, onSort, onAdd, onAdmin, showAdminActions = false }) => (
  <div className="flex flex-col w-full px-4 sm:px-8 lg:px-16 mb-4 gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onFilter}
        className="flex items-center gap-2 px-4 py-2 bg-[#E4E4E4] rounded-full text-gray-700 hover:bg-gray-100 font-semibold whitespace-nowrap transition-colors duration-200"
      >
        <FunnelIcon className="w-4 h-4" />
        Filtrar
      </button>

      <button
        onClick={onSort}
        className="flex items-center gap-2 px-4 py-2 bg-[#E4E4E4] text-gray-700 font-semibold rounded-full hover:bg-gray-100 whitespace-nowrap transition-colors duration-200"
      >
        <AdjustmentsVerticalIcon className="w-5 h-5" />
        Ordenar
      </button>
    </div>

    {showAdminActions && (
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onAdmin}
          className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-500 font-semibold rounded-full hover:bg-green-600 hover:text-white whitespace-nowrap transition-colors duration-200"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
          Área administrativa
        </button>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#E4E4E4] text-gray-700 font-semibold rounded-full hover:bg-green-600/90 hover:text-white whitespace-nowrap transition-colors duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          Adicionar Trilha
        </button>
      </div>
    )}
  </div>
)

export default ActionsBar

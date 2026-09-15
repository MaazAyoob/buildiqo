import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Layers, 
  Maximize2, 
  PlusCircle, 
  Check, 
  Copy, 
  Info,
  ShieldAlert,
  Building,
  BedDouble,
  Bed,
  Sofa,
  UtensilsCrossed,
  ChefHat,
  WashingMachine,
  Bath,
  Sun,
  Flame,
  Tv,
  Briefcase,
  Car,
  Footprints,
  Sparkles,
  Edit2
} from 'lucide-react';
import { DEFAULT_ROOM_TYPES } from '../../data/defaults';
import { formatNumber } from '../../store/useEstimateStore';

const ICON_MAP = {
  BedDouble,
  Bed,
  Sofa,
  UtensilsCrossed,
  ChefHat,
  WashingMachine,
  Bath,
  Sun,
  Flame,
  Tv,
  Briefcase,
  Car,
  Footprints,
  Sparkles
};

export function StepSpaces({ state, updateState, estimation }) {
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');
  const [customWidth, setCustomWidth] = useState(12);
  const [customLength, setCustomLength] = useState(14);

  const activeFloor = state.floors[activeFloorIndex] || state.floors[0];

  const handleUpdateRoom = (roomId, field, value) => {
    const updatedFloors = state.floors.map((floor, fIdx) => {
      if (fIdx !== activeFloorIndex) return floor;
      return {
        ...floor,
        rooms: floor.rooms.map((r) => {
          if (r.id !== roomId) return r;
          return { ...r, [field]: Number(value) || 0 };
        })
      };
    });
    updateState({ floors: updatedFloors });
  };

  const handleUpdateRoomName = (roomId, name) => {
    const updatedFloors = state.floors.map((floor, fIdx) => {
      if (fIdx !== activeFloorIndex) return floor;
      return {
        ...floor,
        rooms: floor.rooms.map((r) => {
          if (r.id !== roomId) return r;
          return { ...r, name };
        })
      };
    });
    updateState({ floors: updatedFloors });
  };

  const handleDeleteRoom = (roomId) => {
    const updatedFloors = state.floors.map((floor, fIdx) => {
      if (fIdx !== activeFloorIndex) return floor;
      return {
        ...floor,
        rooms: floor.rooms.filter(r => r.id !== roomId)
      };
    });
    updateState({ floors: updatedFloors });
  };

  const handleAddRoom = (roomPreset) => {
    const newRoom = {
      id: `r-${activeFloorIndex}-${Date.now()}`,
      type: roomPreset.id,
      name: roomPreset.name,
      width: roomPreset.defaultW,
      length: roomPreset.defaultL,
      count: 1
    };

    const updatedFloors = state.floors.map((floor, fIdx) => {
      if (fIdx !== activeFloorIndex) return floor;
      return {
        ...floor,
        rooms: [...floor.rooms, newRoom]
      };
    });
    updateState({ floors: updatedFloors });
    setIsAddRoomModalOpen(false);
  };

  const handleAddCustomRoom = (e) => {
    e.preventDefault();
    if (!customRoomName.trim()) return;

    const newRoom = {
      id: `r-custom-${Date.now()}`,
      type: 'living',
      name: customRoomName.trim(),
      width: Number(customWidth) || 12,
      length: Number(customLength) || 14,
      count: 1
    };

    const updatedFloors = state.floors.map((floor, fIdx) => {
      if (fIdx !== activeFloorIndex) return floor;
      return {
        ...floor,
        rooms: [...floor.rooms, newRoom]
      };
    });
    updateState({ floors: updatedFloors });
    setCustomRoomName('');
    setIsAddRoomModalOpen(false);
  };

  const getFloorName = (floorNumber) => {
    if (floorNumber === 0) return 'Ground Floor';
    if (floorNumber === 1) return '1st Floor';
    if (floorNumber === 2) return '2nd Floor';
    if (floorNumber === 3) return '3rd Floor';
    return `${floorNumber}th Floor`;
  };

  // Add & Remove Floor Actions
  const handleAddNewFloor = () => {
    const newFloorNum = state.floors.length;
    const newFloor = {
      id: `floor-${newFloorNum}`,
      name: getFloorName(newFloorNum),
      floorNumber: newFloorNum,
      targetBua: 950,
      rooms: [
        { id: `r-${newFloorNum}-1`, type: 'master_bed', name: 'Master Suite', width: 14, length: 15, count: 1 },
        { id: `r-${newFloorNum}-2`, type: 'attached_bath', name: 'Bathroom', width: 8, length: 5, count: 1 },
        { id: `r-${newFloorNum}-3`, type: 'balcony', name: 'Open Balcony', width: 10, length: 5, count: 1 },
        { id: `r-${newFloorNum}-4`, type: 'staircase', name: 'Staircase Area', width: 8, length: 12, count: 1 }
      ]
    };
    updateState({
      numFloors: state.floors.length + 1,
      floors: [...state.floors, newFloor]
    });
    setActiveFloorIndex(newFloorNum);
  };

  const handleRemoveActiveFloor = (idxToRemove) => {
    if (state.floors.length <= 1) return;
    const updated = state.floors.filter((_, i) => i !== idxToRemove);
    updateState({
      numFloors: updated.length,
      floors: updated
    });
    setActiveFloorIndex(Math.max(0, idxToRemove - 1));
  };

  const currentFloorDetail = estimation.floorDetails[activeFloorIndex] || { carpetArea: 0, builtupArea: 0, roomCount: 0 };
  const plotArea = (state.plotWidth || 30) * (state.plotLength || 40);
  const groundBua = estimation.groundFloorBua;
  const coveragePercent = plotArea > 0 ? Math.round((groundBua / plotArea) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                Space planning
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">Step 2: Floor Spaces & Room Configuration</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Add, edit, or remove spaces per floor. Live Carpet Area and Built-up Area compute automatically.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-100/60 px-3.5 py-2 rounded-xl border border-slate-200 text-right">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">Total Usable Carpet</span>
              <span className="text-sm font-extrabold text-slate-900">{formatNumber(estimation.totalCarpetArea)} sq.ft</span>
            </div>
            <div className="bg-blue-600 text-white px-3.5 py-2 rounded-xl text-right shadow-sm">
              <span className="text-[10px] text-amber-200 uppercase tracking-wider font-bold block">Total Built-Up Area</span>
              <span className="text-sm font-extrabold">{formatNumber(estimation.totalBuiltupArea)} sq.ft</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Selector Tabs with Add Floor / Remove Floor Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {state.floors.map((floor, idx) => {
            const isSelected = idx === activeFloorIndex;
            const floorStats = estimation.floorDetails[idx] || { carpetArea: 0, builtupArea: 0 };
            return (
              <button
                key={floor.id}
                onClick={() => setActiveFloorIndex(idx)}
                className={`px-4 py-3 rounded-2xl border text-left transition-all shrink-0 flex items-center space-x-3 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-stone-900 shadow-md ring-2 ring-stone-900/20'
                    : 'bg-white border-slate-200 text-gray-700 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isSelected ? 'bg-slate-900 text-amber-200' : 'bg-slate-100 text-gray-800'
                }`}>
                  {idx === 0 ? 'G' : `${idx}F`}
                </div>
                <div>
                  <span className="text-xs font-extrabold block">{floor.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-gray-400'}`}>
                    {formatNumber(floorStats.carpetArea)} sq.ft Carpet
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          {state.floors.length > 1 && (
            <button
              onClick={() => handleRemoveActiveFloor(activeFloorIndex)}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-100 flex items-center space-x-1"
              title="Delete active floor"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove {activeFloor?.name?.split(' ')[0]}</span>
            </button>
          )}

          <button
            onClick={handleAddNewFloor}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-slate-900 flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-200" />
            <span>Add Floor</span>
          </button>
        </div>
      </div>

      {/* Active Floor Workspace Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        
        {/* Active Floor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-800" />
              <span>{activeFloor?.name} Spaces (Add / Edit / Remove)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeFloor?.rooms?.length || 0} Rooms configured • {formatNumber(currentFloorDetail.carpetArea)} sq.ft usable carpet area
            </p>
          </div>

          <button
            onClick={() => setIsAddRoomModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-slate-900 flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-amber-200" />
            <span>Add Space / Room</span>
          </button>
        </div>

        {/* Room Grid / Cards List with Edit & Remove */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeFloor?.rooms?.map((room) => {
            const roomArea = (room.width || 0) * (room.length || 0) * (room.count || 1);
            const presetDef = DEFAULT_ROOM_TYPES.find(p => p.id === room.type) || DEFAULT_ROOM_TYPES[0];
            const IconComponent = ICON_MAP[presetDef.icon] || Sofa;

            return (
              <div 
                key={room.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/50 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50/60 text-blue-700 flex items-center justify-center shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={room.name}
                      onChange={(e) => handleUpdateRoomName(room.id, e.target.value)}
                      className="text-xs font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-stone-900 focus:outline-none px-1"
                    />
                  </div>

                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove space"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Dimension Inputs */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 font-semibold block mb-1">Width (ft)</span>
                    <input
                      type="number"
                      min="4"
                      max="60"
                      value={room.width || ''}
                      onChange={(e) => handleUpdateRoom(room.id, 'width', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-semibold block mb-1">Length (ft)</span>
                    <input
                      type="number"
                      min="4"
                      max="60"
                      value={room.length || ''}
                      onChange={(e) => handleUpdateRoom(room.id, 'length', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-semibold block mb-1">Qty / Count</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={room.count || 1}
                      onChange={(e) => handleUpdateRoom(room.id, 'count', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-500">Calculated Area:</span>
                  <span className="font-extrabold text-blue-700">{formatNumber(roomArea)} sq.ft</span>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Ground Coverage & FAR Compliance Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Building className="w-4 h-4 text-blue-800" />
          <span>NBC Ground Coverage & Floor Area Ratio (FAR) Benchmark</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Ground Footprint BUA</span>
            <span className="text-base font-extrabold text-slate-900 mt-1 block">
              {formatNumber(groundBua)} sq.ft
            </span>
            <span className="text-[11px] text-gray-500">Ground floor slab footprint</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Ground Coverage %</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-base font-extrabold text-slate-900">{coveragePercent}%</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                coveragePercent <= 75 ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800'
              }`}>
                {coveragePercent <= 75 ? 'Within Permissible 75%' : 'High Coverage (Check Setbacks)'}
              </span>
            </div>
            <span className="text-[11px] text-gray-500">Benchmark max 75% for residential</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Effective FAR Achieved</span>
            <span className="text-base font-extrabold text-slate-900 mt-1 block">
              {plotArea > 0 ? (estimation.totalBuiltupArea / plotArea).toFixed(2) : '0.00'}
            </span>
            <span className="text-[11px] text-gray-500">Standard permissible FAR ~1.75 - 2.25</span>
          </div>
        </div>
      </div>

      {/* Add Room Modal */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">Add Room to {activeFloor?.name}</h3>
              <button 
                onClick={() => setIsAddRoomModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Custom Room Creator Form */}
            <form onSubmit={handleAddCustomRoom} className="mt-4 p-3 bg-blue-50/60/70 rounded-xl border border-blue-200 space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Or Create Custom Named Room:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                  placeholder="Custom Room Name (e.g. Gym / Sound Studio)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white font-semibold"
                />
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  placeholder="W (ft)"
                  className="w-16 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold"
                />
                <input
                  type="number"
                  value={customLength}
                  onChange={(e) => setCustomLength(e.target.value)}
                  placeholder="L (ft)"
                  className="w-16 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-slate-900 shrink-0"
                >
                  + Add Custom
                </button>
              </div>
            </form>

            <div className="mt-4 max-h-80 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
              {DEFAULT_ROOM_TYPES.map((preset) => {
                const IconComp = ICON_MAP[preset.icon] || Sofa;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleAddRoom(preset)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-stone-900 hover:bg-blue-50/60/50 text-left transition-all flex items-start space-x-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{preset.name}</span>
                      <span className="text-[10px] text-gray-500 block">Default: {preset.defaultW} × {preset.defaultL} ft ({preset.defaultW * preset.defaultL} sq.ft)</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
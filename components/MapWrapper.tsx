'use client'

import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Chargement de la carte...</p>
    </div>
  )
})

interface MapWrapperProps {
  fullScreen?: boolean
  initialCenter?: [number, number]
  initialZoom?: number
  focusRecordId?: string
  hospitals?: any[]
  onSelectHospital?: (hospital: any) => void
}

export default function MapWrapper({
  fullScreen = false,
  initialCenter,
  initialZoom,
  focusRecordId,
  hospitals = [],
  onSelectHospital
}: MapWrapperProps) {
  return (
    <MapComponent
      fullScreen={fullScreen}
      initialCenter={initialCenter}
      initialZoom={initialZoom}
      focusRecordId={focusRecordId}
      hospitals={hospitals}
      onSelectHospital={onSelectHospital}
    />
  )
}
'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'

interface Hospital {
  code: string
  name: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  address: string | null
  attendance?: any
}

interface MapContentProps {
  fullScreen?: boolean
  initialCenter?: [number, number]
  initialZoom?: number
  focusRecordId?: string
  hospitals?: Hospital[]
  onSelectHospital?: (hospital: Hospital) => void
}

const PARIS_COORDS: [number, number] = [48.8566, 2.3522]
const DEFAULT_ZOOM = 13
const PARIS_FALLBACK_ZOOM = 12

function MapContent({
  fullScreen = false,
  initialCenter,
  initialZoom,
  focusRecordId,
  hospitals = [],
  onSelectHospital
}: MapContentProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<LeafletMarker[]>([])
  const userMarkerRef = useRef<LeafletMarker | null>(null)
  const userPositionRef = useRef<[number, number] | null>(null)
  const markerClusterGroupRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const redIconRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    const container = mapRef.current

    const initMap = async () => {
      if (mapInstanceRef.current) return

      const L = (await import('leaflet')).default
      await import('leaflet.markercluster')

      if (!L.markerClusterGroup) {
        const MarkerClusterModule = await import('leaflet.markercluster')
        const MarkerClusterGroup = (MarkerClusterModule as any).default?.MarkerClusterGroup || 
                                   (MarkerClusterModule as any).MarkerClusterGroup ||
                                   ((MarkerClusterModule as any).default && typeof (MarkerClusterModule as any).default === 'function' ? (MarkerClusterModule as any).default : null)
        
        if (MarkerClusterGroup) {
          L.markerClusterGroup = (options: any) => new MarkerClusterGroup(options)
        }
      }

      leafletRef.current = L

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      redIconRef.current = L.divIcon({
        className: 'red-hospital-marker',
        html: `
          <svg width="30" height="41" viewBox="0 0 30 41" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 26 15 26s15-14.75 15-26C30 6.716 23.284 0 15 0z" fill="#DC2626" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="15" cy="15" r="6" fill="#FFFFFF"/>
          </svg>
        `,
        iconSize: [30, 41],
        iconAnchor: [15, 41],
        popupAnchor: [0, -41],
      })

      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#2563EB" stroke="#FFFFFF" stroke-width="3" opacity="0.9"/>
            <circle cx="20" cy="20" r="10" fill="#FFFFFF"/>
            <circle cx="20" cy="20" r="5" fill="#2563EB"/>
          </svg>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      ;(container as any)._leaflet_id = null

      const map = L.map(container, { keyboard: false }).setView(PARIS_COORDS, PARIS_FALLBACK_ZOOM)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      mapInstanceRef.current = map

      const markerClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        animate: true,
        maxClusterRadius: 80,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount()
          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: 'marker-cluster',
            iconSize: L.point(40, 40),
          })
        }
      })

      map.addLayer(markerClusterGroup)
      markerClusterGroupRef.current = markerClusterGroup

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            userPositionRef.current = [latitude, longitude]

            if (userMarkerRef.current) {
              userMarkerRef.current.remove()
            }
            userMarkerRef.current = L.marker([latitude, longitude], { 
              icon: userIcon,
              zIndexOffset: 1000,
              keyboard: false
            })
              .addTo(map)
              .bindPopup('Votre position', { closeButton: false })

            map.setView([latitude, longitude], DEFAULT_ZOOM)
          },
          () => {
            userPositionRef.current = PARIS_COORDS
            if (userMarkerRef.current) {
              userMarkerRef.current.remove()
            }
            userMarkerRef.current = L.marker(PARIS_COORDS, { 
              icon: userIcon,
              zIndexOffset: 1000,
              keyboard: false
            })
              .addTo(map)
              .bindPopup('Votre position (Paris)', { closeButton: false })

            map.setView(PARIS_COORDS, PARIS_FALLBACK_ZOOM)
          }
        )
      }
    }

    initMap()
  }, [])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    const clusterGroup = markerClusterGroupRef.current
    const redIcon = redIconRef.current

    if (!L || !map || !clusterGroup || !redIcon) return

    clusterGroup.clearLayers()
    markersRef.current = []

    const formatDistance = (lat: number, lng: number): string | null => {
      const userPos = userPositionRef.current
      if (!userPos) return null

      const R = 6371e3
      const toRad = (deg: number) => (deg * Math.PI) / 180
      const p1 = toRad(userPos[0])
      const p2 = toRad(lat)
      const dp = toRad(lat - userPos[0])
      const dl = toRad(lng - userPos[1])

      const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
                Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const fromUser = R * c

      if (Number.isNaN(fromUser)) return null
      if (fromUser >= 1000) return `${(fromUser / 1000).toFixed(1)} km`
      return `${Math.round(fromUser / 50) * 50} m`
    }

    const createPopupHTML = (hospital: Hospital, lat: number, lng: number): string => {
      const userPos = userPositionRef.current
      let itineraryUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      if (userPos) itineraryUrl += `&origin=${userPos[0]},${userPos[1]}`

      const distanceLabel = formatDistance(lat, lng)
      const phone = hospital.phone ?? ''
      const phoneHref = phone ? `tel:${phone.replace(/\s+/g, '')}` : '#'

      return `
        <div style="
          padding: 12px 14px;
          min-width: 220px;
          max-width: 260px;
          background-color: #2563EB;
          color: #FFFFFF;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.35);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          <div style="font-weight: 700; margin-bottom: 6px; font-size: 15px; line-height: 1.3;">
            ${hospital.name}
          </div>
          ${distanceLabel ? `<div style="font-size: 13px; margin-bottom: 8px; opacity: 0.9;">${distanceLabel}</div>` : ''}
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px;">
            ${phone ? `<a href="${phoneHref}" style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #FFFFFF; text-decoration: none; white-space: nowrap;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 999px; background-color: rgba(255, 255, 255, 0.16);">📞</span>
              <span>${phone}</span>
            </a>` : ''}
            <a href="${itineraryUrl}" target="_blank" rel="noopener noreferrer" style="
              display: inline-flex; align-items: center; justify-content: center; flex: 1;
              background-color: #EF4444; color: #FFFFFF; padding: 6px 10px; border-radius: 999px;
              text-decoration: none; font-weight: 600; font-size: 13px; text-align: center;
              margin-left: auto;
            " onmouseover="this.style.backgroundColor='#B91C1C'" onmouseout="this.style.backgroundColor='#EF4444'">
              Itinéraire
            </a>
          </div>
        </div>
      `
    }

    let focusMarker: LeafletMarker | null = null
    let focusCoords: [number, number] | null = null

    hospitals.forEach((hospital) => {
      if (hospital.latitude == null || hospital.longitude == null) return

      const lat = hospital.latitude
      const lng = hospital.longitude
      const popupContent = createPopupHTML(hospital, lat, lng)

      const marker = L.marker([lat, lng], { icon: redIcon, keyboard: false })
        .bindPopup(popupContent, {
          className: 'hospital-popup',
          closeButton: true,
          autoClose: false,
          closeOnClick: false,
        })
        .on('click', () => {
          onSelectHospital?.(hospital)
        })

      clusterGroup.addLayer(marker)
      markersRef.current.push(marker)

      if (focusRecordId && hospital.code === focusRecordId) {
        focusMarker = marker
        focusCoords = [lat, lng]
      }
    })

    if (focusMarker && focusCoords && map) {
      const zoomToUse = initialZoom ?? 16
      map.setView(focusCoords, zoomToUse)
      ;(focusMarker as LeafletMarker).openPopup()
    }
  }, [hospitals, focusRecordId, initialZoom, onSelectHospital])

  const mapClasses = fullScreen
    ? "w-full h-full"
    : "w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-lg border-2 border-gray-300 shadow-md"

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" crossOrigin="" />
      <style jsx global>{`
        .marker-cluster {
          background-color: rgba(37, 99, 235, 0.6);
        }
        .marker-cluster div {
          width: 30px;
          height: 30px;
          margin-left: 5px;
          margin-top: 5px;
          text-align: center;
          border-radius: 15px;
          font-weight: bold;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(37, 99, 235, 0.8);
        }
        .hospital-popup .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: none;
          padding: 0;
          border-radius: 12px;
        }
        .hospital-popup .leaflet-popup-content {
          margin: 0;
        }
        .hospital-popup .leaflet-popup-tip {
          background: #2563EB;
        }
      `}</style>
      <div
        ref={mapRef}
        className={mapClasses}
        role="application"
        aria-label="Carte interactive des hôpitaux"
        aria-live="polite"
      />
    </>
  )
}

export default MapContent
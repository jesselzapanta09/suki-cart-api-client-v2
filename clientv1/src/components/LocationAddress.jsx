import React, { useState, useEffect } from "react"
import addressService from "../services/addressService"

/**
 * Resolves PSGC codes (or location names) to human-readable names and renders the address.
 * Props:
 *   location – { region, province, city_municipality, barangay } (PSGC codes or names)
 *   className – optional extra class for the wrapper <span>
 */
export default function LocationAddress({ location, className = "" }) {
    const [names, setNames] = useState(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!location) return
        let cancelled = false

        const resolve = async () => {
            try {
                const [region, province, city, barangay] = await Promise.all([
                    location.region ? addressService.getRegion(location.region).then(d => d?.name || location.region) : Promise.resolve(""),
                    location.province ? addressService.getProvince(location.province).then(d => d?.name || location.province) : Promise.resolve(""),
                    location.city_municipality ? addressService.getCity(location.city_municipality).then(d => d?.name || location.city_municipality) : Promise.resolve(""),
                    location.barangay ? addressService.getBarangay(location.barangay).then(d => d?.name || location.barangay) : Promise.resolve(""),
                ])
                if (!cancelled) {
                    setNames({ region, province, city, barangay })
                    setError(false)
                }
            } catch (err) {
                console.error("Error resolving address:", err)
                if (!cancelled) {
                    setError(true)
                    // Fallback to raw values if everything fails
                    setNames({
                        region: location.region || "",
                        province: location.province || "",
                        city: location.city_municipality || "",
                        barangay: location.barangay || "",
                    })
                }
            }
        }

        resolve()
        return () => { cancelled = true }
    }, [location?.region, location?.province, location?.city_municipality, location?.barangay])

    if (!location) return null

    if (!names) {
        return <span className={className}>Loading address…</span>
    }

    const parts = [
        names.barangay && { label: "Barangay", value: names.barangay },
        names.city     && { label: "City / Municipality", value: names.city },
        names.province && { label: "Province", value: names.province },
        names.region   && { label: "Region", value: names.region },
    ].filter(Boolean)

    return (
        <div className={className}>
            {parts.map(p => (
                <div key={p.label} className="flex items-baseline gap-1.5">
                    <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide w-28 shrink-0">{p.label}</span>
                    <span className="text-gray-700 text-xs">{p.value}</span>
                </div>
            ))}
        </div>
    )
}

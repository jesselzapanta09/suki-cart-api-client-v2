import React from "react"

/**
 * Displays location information that's already stored in the database.
 * No API calls - just renders the stored location data.
 * Props:
 *   location – { region, province, city_municipality, barangay }
 *   className – optional extra class for the wrapper
 */
export default function LocationAddress({ location, className = "" }) {
    if (!location) return null

    const parts = [
        location.barangay && { label: "Barangay", value: location.barangay },
        location.city_municipality && { label: "City / Municipality", value: location.city_municipality },
        location.province && { label: "Province", value: location.province },
        location.region && { label: "Region", value: location.region },
    ].filter(Boolean)

    if (parts.length === 0) return null

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

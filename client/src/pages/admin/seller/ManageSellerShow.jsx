import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Tag, Spin, App } from "antd"
import { ArrowLeft, Store } from "lucide-react"
import * as storeVerificationService from "../../../services/storeVerificationService"
import Avatar from "../../../components/Avatar"
import LocationAddress from "../../../components/LocationAddress"

export default function ManageSellerShow() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { message } = App.useApp()

    const [store, setStore] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStore = async () => {
            setLoading(true)
            try {
                const data = await storeVerificationService.getStoreVerification(id)
                setStore(data.store)
            } catch (err) {
                message.error(err.message)
                navigate("/admin/sellers")
            } finally {
                setLoading(false)
            }
        }
        fetchStore()
    }, [id])

    if (loading) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Spin size="large" /></div>
    }

    if (!store) return null

    return (
        <div className="p-6 lg:p-8 max-w-275 mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4 rounded-xl px-6 py-5 bg-white ring-1 ring-gray-200 shadow-sm">
                <Button onClick={() => navigate("/admin/sellers")} icon={<ArrowLeft size={16} />} type="text" />
                <div className="w-11 h-11 rounded-lg bg-linear-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-sm">
                    <Store size={22} className="text-white" />
                </div>
                <div>
                    <h1 className="font-sora font-bold text-xl text-gray-900">Seller Details</h1>
                    <p className="text-xs text-gray-400 mt-1">Approved seller store information</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Main info */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Store banner */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {store.banner ? (
                            <img src={`/${store.banner}`} alt="Store banner" className="w-full h-48 object-cover" />
                        ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center">
                                <Store size={48} className="text-white/60" />
                            </div>
                        )}
                    </div>

                    {/* Store info card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="font-sora font-bold text-lg text-gray-900">{store.store_name}</h2>
                                <div className="text-gray-400 text-sm mt-1">{store.category?.name || "No category"}</div>
                            </div>
                            <Tag color="success">APPROVED</Tag>
                        </div>

                        {store.description && (
                            <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Description</div>
                                <div className="text-sm text-gray-500">{store.description}</div>
                            </div>
                        )}

                        <div className="text-sm text-gray-500">
                            Registered: {new Date(store.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                    </div>

                    {/* Reviewed by */}
                    {store.verification?.reviewer && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Approved By</div>
                            <div className="flex items-center gap-3">
                                <Avatar user={store.verification.reviewer} size={34} fontSize="0.85rem" />
                                <div>
                                    <div className="text-sm font-medium text-gray-800">
                                        {store.verification.reviewer.firstname} {store.verification.reviewer.lastname}
                                    </div>
                                    {store.verification.reviewed_at && (
                                        <div className="text-gray-400 text-xs">
                                            {new Date(store.verification.reviewed_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar — owner info only */}
                <div className="space-y-5">
                    {store.user && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                            <div className="text-xs font-semibold text-gray-700">Store Owner</div>
                            <div className="flex items-center gap-3">
                                <Avatar user={store.user} size={44} fontSize="1rem" />
                                <div>
                                    <div className="font-semibold text-gray-800">{store.user.firstname} {store.user.lastname}</div>
                                    <div className="text-gray-400 text-sm">{store.user.email}</div>
                                </div>
                            </div>
                            {store.user.contact_number && (
                                <div>
                                    <div className="text-xs font-semibold text-gray-700 mb-1">Contact</div>
                                    <div className="text-sm text-gray-500">{store.user.contact_number}</div>
                                </div>
                            )}
                            {store.user.locations?.length > 0 && (
                                <div>
                                    <div className="text-xs font-semibold text-gray-700 mb-1">Address</div>
                                    {store.user.locations.map((loc, i) => (
                                        <LocationAddress key={i} location={loc} className="text-xs" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

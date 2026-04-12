import { useState } from "react";
import { Button, Spin } from "antd";
import { Link, useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { resubmitStore } from "../../services/sellerService";
import { ClockCircleOutlined, CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { App } from "antd";

export default function SellerDashboard() {
    const { user } = useAuth();
    const { message } = App.useApp();
    const {
        storeVerification,
        storeStatusLoaded,
        setStoreVerification,
    } = useOutletContext();
    const [resubmitting, setResubmitting] = useState(false);

    const storeStatus = storeVerification?.store_status ?? null;
    const rejectionReason = storeVerification?.rejection_reason ?? null;
    const loading = !storeStatusLoaded && !storeVerification;

    const handleResubmit = async () => {
        try {
            setResubmitting(true);
            await resubmitStore();
            message.success("Store resubmitted for review!");
            setStoreVerification({
                store_status: "pending",
                rejection_reason: null,
            });
        } catch (err) {
            message.error(err.message || "Failed to resubmit.");
        } finally {
            setResubmitting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            {/* Header Card */}
            <div className="mb-6 from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-100">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-green-600 mb-1">
                            {new Date().getHours() < 12 ? "☀️ Good Morning" : new Date().getHours() < 18 ? "🌤️ Good Afternoon" : "🌙 Good Evening"}
                        </p>
                        <h1 className="text-3xl font-bold text-green-900 mb-2">Welcome back, {user?.firstname}</h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                {user?.role || "Seller"}
                            </span>
                            <span className="text-sm text-gray-500">
                                • {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </span>
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-green-900">
                            {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Current Time</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                    {storeStatus === "approved" ? (
                        <span className="flex items-center gap-2 text-green-700 text-sm">
                            <CheckCircleOutlined className="text-green-600" />
                            You are now a verified seller.
                        </span>
                    ) : (
                        <p className="text-sm text-gray-600">Status: <span className="capitalize">{storeStatus || "Checking..."}</span></p>
                    )}
                </div>
            </div>

            {/* Store Verification Status */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Spin size="large" />
                </div>
            ) : storeStatus === "pending" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <ClockCircleOutlined className="text-2xl text-amber-500" />
                        <h2 className="text-lg font-semibold text-amber-800 m-0">Store Under Review</h2>
                    </div>
                    <p className="text-amber-700 text-sm m-0">
                        Your store is currently being reviewed by an admin. You will be notified once your store is approved.
                    </p>
                    <p className="text-amber-600 text-xs mt-2 m-0">
                        While under review, only the <strong>Dashboard</strong> and <Link to="/seller/edit-profile" className="font-semibold text-amber-700 underline hover:text-amber-900">Edit Profile</Link> are accessible.
                    </p>
                </div>
            ) : storeStatus === "rejected" ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CloseCircleOutlined className="text-2xl text-red-500" />
                        <h2 className="text-lg font-semibold text-red-800 m-0">Store Verification Rejected</h2>
                    </div>
                    <p className="text-red-700 text-sm mb-3">
                        Your store verification was rejected by the admin.
                    </p>
                    {rejectionReason && (
                        <div className="rounded-xl bg-red-100 border border-red-200 p-4 mb-4">
                            <p className="text-xs font-semibold text-red-500 uppercase mb-1">Rejection Reason</p>
                            <p className="text-red-800 text-sm m-0">{rejectionReason}</p>
                        </div>
                    )}
                    <p className="text-red-600 text-xs mb-4">
                        Please update your store information via <Link to="/seller/edit-profile" className="font-semibold text-red-700 underline hover:text-red-900">Edit Profile</Link>, then resubmit for review.
                    </p>
                    <Button
                        type="primary"
                        danger
                        loading={resubmitting}
                        onClick={handleResubmit}
                    >
                        Resubmit for Review
                    </Button>
                </div>
            ) :(
                <></>
            )}
        </div>
    );
}

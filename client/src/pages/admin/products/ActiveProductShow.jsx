import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { App, Button, Carousel, Spin, Table, Tag } from "antd";
import { ArrowLeft, Package, Store, UserRound } from "lucide-react";
import * as adminProductService from "../../../services/adminProductService";
import { getStorageUrl } from "../../../utils/storage";

function formatCurrency(value) {
    return `PHP ${Number(value || 0).toFixed(2)}`;
}

function getTotalStock(variants = []) {
    return variants.reduce((sum, variant) => sum + Number(variant?.stock || 0), 0);
}

function resolveMediaUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (String(path).startsWith("storage/")) return getStorageUrl(path);
    return `/${String(path).replace(/^\/+/, "")}`;
}

export default function ActiveProductShow() {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const { message } = App.useApp();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const data = await adminProductService.getAdminProduct(uuid);
                setProduct(data.product);
            } catch (err) {
                message.error(err.message || "Failed to load product details");
                navigate("/admin/products", { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [uuid, message, navigate]);

    const images = useMemo(() => (
        Array.isArray(product?.images) ? product.images.map((image) => ({
            ...image,
            src: getStorageUrl(image.image_path),
        })) : []
    ), [product?.images]);

    const variantColumns = [
        {
            title: "Variant",
            dataIndex: "name",
            key: "name",
            render: (name) => <span className="font-medium text-gray-800">{name}</span>,
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            width: 140,
            render: (price) => <span className="font-mono text-sm">{formatCurrency(price)}</span>,
        },
        {
            title: "Stock",
            dataIndex: "stock",
            key: "stock",
            width: 110,
            render: (stock) => <span className="font-mono text-sm font-semibold">{Number(stock || 0)}</span>,
        },
    ];

    if (loading) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Spin size="large" /></div>;
    }

    if (!product) return null;

    const ownerName = product.store?.user
        ? `${product.store.user.firstname || ""} ${product.store.user.lastname || ""}`.trim()
        : "";
    const specsEntries = product.specs ? Object.entries(product.specs) : [];
    const totalStock = getTotalStock(product.variants || []);
    const lowestPrice = product.variants?.length
        ? Math.min(...product.variants.map((variant) => Number(variant.price || 0)))
        : 0;
    const storeBanner = resolveMediaUrl(product.store?.banner);
    const sellerProfilePicture = resolveMediaUrl(product.store?.user?.profile_picture);

    return (
        <div className="p-6 lg:p-8 max-w-275 mx-auto space-y-5 font-body">
            <div className="flex items-center justify-between rounded-xl px-6 py-5 bg-white ring-1 ring-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button onClick={() => navigate("/admin/products")} icon={<ArrowLeft size={16} />} type="text" />
                    <div className="w-11 h-11 rounded-lg bg-linear-to-br from-emerald-600 to-green-500 flex items-center justify-center shadow-sm">
                        <Package size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl text-gray-900">Product Details</h1>
                        <p className="text-xs text-gray-400 mt-1">Read-only admin product overview</p>
                    </div>
                </div>
                <Tag color="green">ACTIVE</Tag>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {images.length > 0 ? (
                            <Carousel dots={images.length > 1} className="bg-gray-100">
                                {images.map((image) => (
                                    <div key={image.id}>
                                        <div className="h-72 md:h-96 bg-gray-100 flex items-center justify-center">
                                            <img src={image.src} alt={product.name} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                ))}
                            </Carousel>
                        ) : (
                            <div className="h-72 md:h-96 bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                                <Package size={64} className="text-green-300" />
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-2">
                                    {product.category?.name || "Uncategorized"}
                                </div>
                                <h2 className="font-bold text-2xl text-gray-900">{product.name}</h2>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-400">Lowest variant price</div>
                                <div className="text-xl font-bold text-green-700">{formatCurrency(lowestPrice)}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                                <div className="text-xs font-semibold text-gray-500 mb-1">Total Stock</div>
                                <div className="font-bold text-lg text-gray-900">{totalStock}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                                <div className="text-xs font-semibold text-gray-500 mb-1">Variants</div>
                                <div className="font-bold text-lg text-gray-900">{product.variants?.length || 0}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                                <div className="text-xs font-semibold text-gray-500 mb-1">Created</div>
                                <div className="font-medium text-gray-800">
                                    {new Date(product.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-gray-700 mb-2">Description</div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                                {product.description || "No product description provided."}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Weight</div>
                                <div className="text-sm text-gray-600">{product.weight || "N/A"} kg</div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Dimension</div>
                                <div className="text-sm text-gray-600">{product.dimension || "N/A"}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center">
                                <Package size={18} className="text-purple-700" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Variants</h3>
                                <p className="text-sm text-gray-400">Current sellable options for this product</p>
                            </div>
                        </div>

                        <Table
                            columns={variantColumns}
                            dataSource={product.variants || []}
                            rowKey="id"
                            pagination={false}
                            locale={{
                                emptyText: "No variants found.",
                            }}
                        />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="text-xs font-semibold text-gray-700 mb-4">Specifications</div>
                        {specsEntries.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {specsEntries.map(([key, value]) => (
                                    <div key={key} className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                                        <div className="text-xs uppercase tracking-wide text-gray-500">{key}</div>
                                        <div className="text-sm font-medium text-gray-800 mt-1">{value}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400">No specifications provided.</div>
                        )}
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="h-36 bg-gray-100">
                            {storeBanner ? (
                                <img src={storeBanner} alt={product.store?.store_name || "Store banner"} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-emerald-50 to-green-100 flex items-center justify-center">
                                    <Store size={36} className="text-emerald-400" />
                                </div>
                            )}
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-xs font-semibold text-gray-700">Store</div>
                            <div>
                                <div className="font-semibold text-gray-900">{product.store?.store_name || "No store name"}</div>
                                <div className="text-sm text-gray-400">{product.store?.category?.name || "No store category"}</div>
                            </div>
                            <div className="text-sm text-gray-600">
                                {product.store?.description || "No store description provided."}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <div className="text-xs font-semibold text-gray-700">Seller</div>
                        <div className="flex items-center gap-3">
                            {sellerProfilePicture ? (
                                <img
                                    src={sellerProfilePicture}
                                    alt={ownerName || product.store?.user?.email || "Seller"}
                                    className="w-14 h-14 rounded-full object-cover border border-green-200"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-linear-to-br from-emerald-50 to-green-100 flex items-center justify-center border border-green-200">
                                    <UserRound size={24} className="text-emerald-500" />
                                </div>
                            )}
                            <div>
                                <div className="font-semibold text-gray-900">{ownerName || "No owner name"}</div>
                                <div className="text-sm text-gray-400">{product.store?.user?.email || "No email"}</div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {product.store?.user?.contact_number || "No contact number provided."}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
                        <div className="text-xs font-semibold text-gray-700">Quick Info</div>
                        <div className="text-sm text-gray-500">
                            Product UUID: <span className="font-mono text-gray-700 break-all">{product.uuid}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            Store UUID: <span className="font-mono text-gray-700 break-all">{product.store?.uuid || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

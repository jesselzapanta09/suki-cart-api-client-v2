import { ShoppingCart, Package } from "lucide-react";

export default function ProductCard({ product, onAdd }) {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const images = Array.isArray(product.images) ? product.images : [];
    const specs = product.specs && typeof product.specs === "object" ? product.specs : {};

    const primaryVariant = variants[0] || null;
    const primaryImage = images[0] || null;

    const categoryLabel =
        typeof product.category === "string"
            ? product.category
            : product.category?.name || "Product";

    const ratingValue = Number(product.rating ?? 0);
    const soldCount = Number(product.sold ?? 0);
    const stockCount = variants.length > 0
        ? variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
        : Number(product.stock || 0);

    const imageUrl = primaryImage?.full_url || primaryImage?.image_path || null;

    const rawPrice = primaryVariant?.price;
    const priceValue =
        typeof rawPrice === "number"
            ? rawPrice
            : rawPrice !== undefined && rawPrice !== null && rawPrice !== ""
                ? Number(rawPrice)
                : null;
    const hasPrice = typeof priceValue === "number" && !Number.isNaN(priceValue);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all group overflow-hidden">
            <div className="h-40 bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        onError={(event) => {
                            event.target.style.display = "none";
                            if (event.target.nextElementSibling) {
                                event.target.nextElementSibling.style.display = "flex";
                            }
                        }}
                    />
                ) : null}
                <Package
                    size={40}
                    className="text-green-400 group-hover:scale-110 transition-transform"
                    style={{ display: imageUrl ? "none" : "flex" }}
                />
                <div className="absolute top-3 right-3 bg-white rounded-lg px-2 py-0.5 text-xs font-semibold text-yellow-600 shadow-sm">
                    ⭐ {ratingValue.toFixed(1)}
                </div>
            </div>

            <div className="p-4">
                <p className="text-xs text-green-600 font-semibold mb-1 uppercase tracking-wide">
                    {categoryLabel}
                </p>
                <h3
                    className="font-bold text-gray-800 text-sm mb-2 leading-snug"
                    style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                    {product.name}
                </h3>

                {Object.keys(specs).length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                        {Object.entries(specs).slice(0, 2).map(([key, value]) => (
                            <span key={key} className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                                {value}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        {hasPrice ? (
                            <>
                                <span className="font-bold text-green-700 text-base">₱{priceValue.toFixed(2)}</span>
                                <p className="text-xs text-gray-400 mt-0.5">{soldCount} sold • {stockCount} in stock</p>
                            </>
                        ) : (
                            <span className="text-sm text-gray-500">No variants</span>
                        )}
                    </div>

                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            onAdd(product);
                        }}
                        disabled={!hasPrice}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition-colors cursor-pointer border-none shadow-sm ${
                            hasPrice ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
                        }`}
                    >
                        <ShoppingCart size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}

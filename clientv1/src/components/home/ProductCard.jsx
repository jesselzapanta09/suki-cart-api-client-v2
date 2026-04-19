import { ShoppingCart, Package } from "lucide-react";

export default function ProductCard({ product, onAdd }) {
    // Handle category - could be a string or object
    const categoryName = typeof product.category === 'string' 
        ? product.category 
        : product.category?.name || 'Product';
    
    // Provide defaults for fields that might not exist in real data
    const rating = product.rating || 4.5;
    const sold = product.sold || 0;

    // Get the first image from the product images array
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0].full_url 
        : null;

    // Get price from first variant (products no longer have direct price)
    let price = null;
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        const variantPrice = product.variants[0].price;
        price = typeof variantPrice === 'number' ? variantPrice : (variantPrice ? Number(variantPrice) : null);
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all group overflow-hidden">
            <div className="h-40 bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center relative overflow-hidden">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex';
                            }
                        }}
                    />
                ) : null}
                <Package size={40} className="text-green-400 group-hover:scale-110 transition-transform" style={{ display: imageUrl ? 'none' : 'flex' }} />
                <div className="absolute top-3 right-3 bg-white rounded-lg px-2 py-0.5 text-xs font-semibold text-yellow-600 shadow-sm">⭐ {rating.toFixed(1)}</div>
            </div>
            <div className="p-4">
                <p className="text-xs text-green-600 font-semibold mb-1 uppercase tracking-wide">{categoryName}</p>
                <h3 className="font-bold text-gray-800 text-sm mb-2 leading-snug" style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{product.name}</h3>
                
                {/* Specs Display */}
                {product.specs && Object.keys(product.specs).length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                        {Object.entries(product.specs).slice(0, 2).map(([key, value]) => (
                            <span key={key} className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                                {value}
                            </span>
                        ))}
                    </div>
                )}
                
                <div className="flex items-center justify-between">
                    <div>
                        {price && typeof price === 'number' ? (
                            <>
                                <span className="font-bold text-green-700 text-base">₱{price.toFixed(2)}</span>
                                <p className="text-xs text-gray-400 mt-0.5">{sold} sold</p>
                            </>
                        ) : (
                            <span className="text-sm text-gray-500">No variants</span>
                        )}
                    </div>
                    <button 
                        onClick={() => onAdd(product)} 
                        disabled={!price}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition-colors cursor-pointer border-none shadow-sm ${
                            price 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <ShoppingCart size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}

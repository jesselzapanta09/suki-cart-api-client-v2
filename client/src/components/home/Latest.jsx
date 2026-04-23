import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

export default function Latest({ products, onAdd, isAuthenticated }) {
    return (
        <section className="py-16 px-4 sm:px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <div className="inline-block px-4 py-1 rounded-full mb-2 bg-green-100 text-green-700 text-xs font-mono font-semibold tracking-wider uppercase">New Arrivals</div>
                        <h2 className="font-bold text-3xl text-green-900">Latest Products</h2>
                    </div>
                    <Link to={isAuthenticated ? "/customer/dashboard" : "/register/customer"} className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                        View all <ChevronRight size={16} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {products.map(p => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}
                </div>
            </div>
        </section>
    );
}

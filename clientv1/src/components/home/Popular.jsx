import SectionHeading from "./SectionHeading";
import ProductCard from "./ProductCard";

export default function Popular({ products, onAdd }) {
    return (
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <SectionHeading tag="Trending" title="Popular Products" subtitle="Best-selling items loved by your community" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {products.map(p => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}
                </div>
            </div>
        </section>
    );
}

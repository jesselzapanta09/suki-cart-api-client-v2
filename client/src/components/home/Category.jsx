import SectionHeading from "./SectionHeading";
import { MOCK_CATEGORIES } from "../../services/mockData";

export default function Category() {
    return (
        <section className="py-16 px-4 sm:px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <SectionHeading tag="Categories" title="Shop by Category" subtitle="Find exactly what you need from fresh local stores" />
                <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {MOCK_CATEGORIES.map(cat => (
                        <button key={cat.key} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-all group cursor-pointer border-none">
                            <div className="text-2xl sm:text-3xl">{cat.icon}</div>
                            <span className="text-xs font-semibold text-gray-700 text-center leading-tight group-hover:text-green-700">{cat.label}</span>
                            <span className="text-[10px] text-gray-400 hidden sm:block">{cat.count} items</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

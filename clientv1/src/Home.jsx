import React from "react";
import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import { App } from "antd";
import { MOCK_PRODUCTS } from "./services/mockData";
import Category from "./components/home/Category";
import Popular from "./components/home/Popular";
import Latest from "./components/home/Latest";
import Featured from "./components/home/Featured";

export default function Home() {
    const { isAuthenticated } = useAuth();
    const { addItem } = useCart();
    const { message } = App.useApp();

    const popular = [...MOCK_PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 6);
    const latest = [...MOCK_PRODUCTS].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4);
    const featured = MOCK_PRODUCTS.slice(0, 9);

    const handleAdd = (product) => {
        addItem(product);
        message.success(`${product.name} added to cart!`);
    };

    return (
        <div className="font-body bg-gray-50">
            <Category />
            <Popular products={popular} onAdd={handleAdd} />
            <Latest products={latest} onAdd={handleAdd} isAuthenticated={isAuthenticated} />
            <Featured products={featured} onAdd={handleAdd} />
        </div>
    );
}

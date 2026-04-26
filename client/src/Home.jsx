import React, { useEffect, useState } from "react";
import { App } from "antd";
import { useCart } from "./context/CartContext";
import { MOCK_PRODUCTS } from "./services/mockData";
import { getLatestHomeProducts, getPopularHomeProducts } from "./services/productService";
import Category from "./components/home/Category";
import Popular from "./components/home/Popular";
import Latest from "./components/home/Latest";
import Featured from "./components/home/Featured";
import Slider from "./components/home/Slider";

export default function Home() {
    const { addItem } = useCart();
    const { message } = App.useApp();
    const [popular, setPopular] = useState(null);
    const [latest, setLatest] = useState(null);
    const featured = MOCK_PRODUCTS.slice(0, 9);

    useEffect(() => {
        let active = true;

        getPopularHomeProducts()
            .then((data) => {
                if (active) {
                    setPopular(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {
                if (active) {
                    setPopular([]);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        getLatestHomeProducts()
            .then((data) => {
                if (active) {
                    setLatest(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {
                if (active) {
                    setLatest([]);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const handleAdd = (product) => {
        addItem(product);
        message.success(`${product.name} added to cart!`);
    };

    return (
        <div className="font-body bg-gray-50">
            <Slider />
            <Category />
            <Popular products={popular} onAdd={handleAdd} />
            <Latest products={latest} onAdd={handleAdd} />
            {/* not yet implemented */}
            <Featured products={featured} onAdd={handleAdd} />
        </div>
    );
}

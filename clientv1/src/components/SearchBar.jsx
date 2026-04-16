import React from "react";
import { Input, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";

export default function SearchBar({
    search,
    handleSearch,
    handleSearchSubmit,
    searching = false,
    children = null,
    navMode = false,
}) {
    if (navMode) {
        return (
            <div className="relative w-full">
                <Input
                    placeholder="Search products, categories..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    suffix={searching ? <Spin size="small" /> : null}
                    value={search}
                    onChange={handleSearch}
                    onKeyDown={handleSearchSubmit}
                    allowClear
                    size="large"
                    className="rounded-lg"
                    style={{
                        fontSize: "14px",
                        borderColor: "#e5e7eb",
                    }}
                />
                {children}
            </div>
        );
    }

    return (
        <div className="py-4 px-4 bg-white border-b border-gray-200">
            <div className="max-w-2xl mx-auto relative">
                <Input
                    placeholder="Search products, categories..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    suffix={searching ? <Spin size="small" /> : null}
                    value={search}
                    onChange={handleSearch}
                    onKeyDown={handleSearchSubmit}
                    allowClear
                    size="large"
                    className="rounded-lg"
                    style={{
                        fontSize: "14px",
                    }}
                />
                {children}
            </div>
        </div>
    );
}

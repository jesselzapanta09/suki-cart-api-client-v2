import React from "react";
import { Radio, InputNumber, Button, Divider } from "antd";

export default function ProductFiltersCard({
    sortBy,
    minPrice,
    maxPrice,
    onSortChange,
    onMinPriceChange,
    onMaxPriceChange,
    onClear,
    mobile = false,
}) {
    const wrapperClass = mobile
        ? "mb-6 rounded-lg border border-gray-200 bg-white p-4 md:hidden"
        : "hidden w-72 shrink-0 md:block";

    const cardClass = mobile
        ? "space-y-4"
        : "rounded-lg border border-gray-200 bg-white p-6 shadow-sm";

    const headingClass = mobile
        ? "mb-2 block text-xs font-bold text-gray-700"
        : "mb-4 text-sm font-bold uppercase text-gray-900";

    const labelClass = mobile
        ? "mb-2 block text-xs font-bold text-gray-700"
        : "mb-2 block text-xs font-semibold text-gray-700";

    return (
        <div className={wrapperClass}>
            <div className={cardClass}>
                <div className={mobile ? "" : "mb-6"}>
                    <h3 className={headingClass}>Sort By</h3>
                    <Radio.Group
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: mobile ? "8px" : "12px",
                        }}
                    >
                        <Radio value="popular">Most Popular</Radio>
                        <Radio value="created_at">Newest</Radio>
                        <Radio value="price_asc">Price: Low to High</Radio>
                        <Radio value="price_desc">Price: High to Low</Radio>
                    </Radio.Group>
                </div>

                <Divider style={{ margin: mobile ? "8px 0" : "24px 0" }} />

                <div className={mobile ? "" : "mb-6"}>
                    <h3 className={mobile ? headingClass : "mb-4 text-sm font-bold uppercase text-gray-900"}>
                        Price Range
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Minimum Price</label>
                            <InputNumber
                                placeholder="P 0"
                                value={minPrice ? Number(minPrice) : null}
                                onChange={(value) => onMinPriceChange(value ? String(value) : "")}
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(value) => `P ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value.replace(/P\s?|,/g, "")}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Maximum Price</label>
                            <InputNumber
                                placeholder="P Any"
                                value={maxPrice ? Number(maxPrice) : null}
                                onChange={(value) => onMaxPriceChange(value ? String(value) : "")}
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(value) => `P ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value.replace(/P\s?|,/g, "")}
                            />
                        </div>
                    </div>

                    {(minPrice || maxPrice || sortBy !== "created_at") && (
                        <Button onClick={onClear} style={{ width: "100%", marginTop: "16px" }}>
                            {mobile ? "Clear Filters" : "Clear All Filters"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

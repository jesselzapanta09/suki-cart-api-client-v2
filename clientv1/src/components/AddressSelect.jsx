import React, { useState, useEffect } from "react";
import { Form, Select, Row, Col } from "antd";
import addressService from "../services/addressService";

/**
 * Reusable cascading PH address select (Region → Province → City → Barangay).
 * Props:
 *   form          – antd form instance
 *   fieldPrefix   – optional string prefix for field names
 *   initialValues – optional { region, province, city, barangay } codes to pre-load cascading options
 */
export default function AddressSelect({ form, fieldPrefix = "", initialValues }) {
    const f = (name) => fieldPrefix ? `${fieldPrefix}_${name}` : name;

    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);

    const [loadingR, setLoadingR] = useState(false);
    const [loadingP, setLoadingP] = useState(false);
    const [loadingC, setLoadingC] = useState(false);
    const [loadingB, setLoadingB] = useState(false);

    // Load regions on mount, then cascade from initialValues if provided
    useEffect(() => {
        setLoadingR(true);
        addressService.getRegions()
            .then(async (data) => {
                setRegions(data.map(r => ({ label: r.name, value: r.code })));

                if (initialValues?.region) {
                    // Load provinces for saved region
                    setLoadingP(true);
                    const provData = await addressService.getProvinces(initialValues.region).catch(() => []);
                    setProvinces(provData.map(p => ({ label: p.name, value: p.code })));
                    setLoadingP(false);

                    if (initialValues?.province) {
                        // Load cities for saved province
                        setLoadingC(true);
                        const cityData = await addressService.getCities(initialValues.province).catch(() => []);
                        setCities(cityData.map(c => ({ label: c.name, value: c.code })));
                        setLoadingC(false);

                        if (initialValues?.city) {
                            // Load barangays for saved city
                            setLoadingB(true);
                            const brgyData = await addressService.getBarangays(initialValues.city).catch(() => []);
                            setBarangays(brgyData.map(b => ({ label: b.name, value: b.code })));
                            setLoadingB(false);
                        }
                    }
                }
            })
            .catch(() => setRegions([]))
            .finally(() => setLoadingR(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRegionChange = async (code) => {
        form.setFieldsValue({ [f("province")]: undefined, [f("city")]: undefined, [f("barangay")]: undefined });
        setProvinces([]); setCities([]); setBarangays([]);
        if (!code) return;
        setLoadingP(true);
        const data = await addressService.getProvinces(code).catch(() => []);
        setProvinces(data.map(p => ({ label: p.name, value: p.code })));
        setLoadingP(false);
    };

    const handleProvinceChange = async (code) => {
        form.setFieldsValue({ [f("city")]: undefined, [f("barangay")]: undefined });
        setCities([]); setBarangays([]);
        if (!code) return;
        setLoadingC(true);
        const data = await addressService.getCities(code).catch(() => []);
        setCities(data.map(c => ({ label: c.name, value: c.code })));
        setLoadingC(false);
    };

    const handleCityChange = async (code) => {
        form.setFieldsValue({ [f("barangay")]: undefined });
        setBarangays([]);
        if (!code) return;
        setLoadingB(true);
        const data = await addressService.getBarangays(code).catch(() => []);
        setBarangays(data.map(b => ({ label: b.name, value: b.code })));
        setLoadingB(false);
    };

    const selectProps = { size: "large", className: "w-full", showSearch: true, filterOption: (input, option) => option.label.toLowerCase().includes(input.toLowerCase()) };

    return (
        <>
            <Row gutter={16} className="mb-4">
                <Col xs={24} sm={12}>
                    <Form.Item label="Region" name={f("region")} rules={[{ required: true, message: "Region is required" }]} className="mb-0">
                        <Select {...selectProps} placeholder="Select region" onChange={handleRegionChange} loading={loadingR} options={regions} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item label="Province" name={f("province")} rules={[{ required: true, message: "Province is required" }]} className="mb-0">
                        <Select {...selectProps} placeholder="Select province" onChange={handleProvinceChange} loading={loadingP} options={provinces} disabled={!provinces.length} />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <Form.Item label="City / Municipality" name={f("city")} rules={[{ required: true, message: "City is required" }]} className="mb-0">
                        <Select {...selectProps} placeholder="Select city" onChange={handleCityChange} loading={loadingC} options={cities} disabled={!cities.length} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item label="Barangay" name={f("barangay")} rules={[{ required: true, message: "Barangay is required" }]} className="mb-0">
                        <Select {...selectProps} placeholder="Select barangay" loading={loadingB} options={barangays} disabled={!barangays.length} />
                    </Form.Item>
                </Col>
            </Row>
        </>
    );
}

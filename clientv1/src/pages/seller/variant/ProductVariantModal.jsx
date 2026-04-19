import React, { useEffect } from "react"
import { Modal, Form, Input, InputNumber, Button, Row, Col } from "antd"
import { Package, Plus } from "lucide-react"

export default function ProductVariantModal({ open, onClose, onSubmit, initialValues, loading, mode }) {
    const [form] = Form.useForm()

    const labelClass = "font-medium text-gray-700"
    const inputClass = "rounded-xl border border-gray-300 w-full"

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue({
                    name: initialValues.name ?? "",
                    price: initialValues.price ?? 0,
                    stock: initialValues.stock ?? 0,
                })
            } else {
                form.resetFields()
                form.setFieldsValue({
                    price: 0,
                    stock: 0,
                })
            }
        }
    }, [open, initialValues, form])

    const handleFinish = (values) => {
        onSubmit(values)
    }

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnClose
            width={480}
        >
            {/* Header */}
            <div className="absolute top-0 left-0 w-full rounded-t-xl z-10 overflow-hidden">
                <div className="flex border-b border-gray-200 bg-linear-to-r from-green-50/80 to-white">
                    <div className="w-1.5 bg-linear-to-b from-green-600 to-emerald-400 rounded-tl-xl" />
                    <div className="px-5 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center ring-1 ring-green-200">
                            <Package className="w-4 h-4 text-green-700" />
                        </div>
                        <div>
                            <h3 className="font-sora font-bold text-base text-gray-900 leading-tight">
                                {mode === "add" ? "Add Variant" : "Edit Variant"}
                            </h3>
                            <p className="text-[11px] text-gray-400">{mode === "add" ? "Fill in the details below" : "Modify variant info"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="p-6 mt-10">
                <Form layout="vertical" form={form} requiredMark={false} size="large" onFinish={handleFinish}>
                    <Form.Item
                        name="name"
                        label={<span className={labelClass}>Variant Name</span>}
                        rules={[{ required: true, message: "Please enter variant name" }]}
                    >
                        <Input placeholder="e.g., Red, Large, Small" className={inputClass} />
                    </Form.Item>

                    <Form.Item
                        name="price"
                        label={<span className={labelClass}>Price</span>}
                        rules={[{ required: true, message: "Please enter price" }]}
                    >
                        <InputNumber
                            placeholder="0.00"
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            className="rounded-xl"
                            prefix="PHP "
                        />
                    </Form.Item>

                    <Form.Item
                        name="stock"
                        label={<span className={labelClass}>Stock</span>}
                        rules={[{ required: true, message: "Please enter stock" }]}
                    >
                        <InputNumber
                            placeholder="0"
                            min={0}
                            style={{ width: '100%' }}
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button size="large" onClick={onClose}>Cancel</Button>
                        <Button size="large" type="primary" htmlType="submit" loading={loading}>
                            {mode === "add" ? "Create" : "Update"}
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    )
}

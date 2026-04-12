import React, { useEffect } from "react"
import { Modal, Form, Input, Select, Button, App } from "antd"
import { LayoutGrid, Tag } from "lucide-react"

export default function CategoryModal({ open, onClose, onSubmit, initialValues, loading, mode }) {
    const [form] = Form.useForm()

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue({
                    name: initialValues.name ?? "",
                    description: initialValues.description ?? "",
                    status: initialValues.status ?? 1,
                })
            } else {
                form.resetFields()
                form.setFieldsValue({ status: 1 })
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
            {/* Modal header — Option B: left accent stripe */}
            <div className="absolute top-0 left-0 w-full rounded-t-xl z-10 overflow-hidden">
                <div className="flex border-b border-gray-200 bg-linear-to-r from-green-50/80 to-white">
                    <div className="w-1.5 bg-linear-to-b from-green-600 to-emerald-400 rounded-tl-xl" />
                    <div className="px-5 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center ring-1 ring-green-200">
                            <LayoutGrid className="w-4 h-4 text-green-700" />
                        </div>
                        <div>
                            <h3 className="font-sora font-bold text-base text-gray-900 leading-tight">{mode === "add" ? "Add Category" : "Edit Category"}</h3>
                            <p className="text-[11px] text-gray-400">{mode === "add" ? "Fill in the details below" : "Modify category info"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-20">
                <Form form={form} layout="vertical" onFinish={handleFinish} className="space-y-1">
                    <Form.Item
                        name="name"
                        label={<span className="font-medium text-gray-700">Category Name</span>}
                        rules={[{ required: true, message: "Please enter category name" }]}
                    >
                        <Input placeholder="e.g. Convenience Store" className="rounded-xl" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label={<span className="font-medium text-gray-700">Description</span>}
                    >
                        <Input.TextArea rows={3} placeholder="Optional description" className="rounded-xl" />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label={<span className="font-medium text-gray-700">Status</span>}
                        rules={[{ required: true, message: "Please select status" }]}
                    >
                        <Select
                            options={[
                                { label: "Active", value: 1 },
                                { label: "Inactive", value: 0 },
                            ]}
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button onClick={onClose}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {mode === "add" ? "Create" : "Update"}
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    )
}

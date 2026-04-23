import React, { useEffect, useState } from "react"
import { Modal, Form, Input, InputNumber, Button, Upload, App } from "antd"
import { ShoppingBag, UploadCloud } from "lucide-react"

// Renamed to ProductModal logic — keeping filename for minimal diff
export default function TrainModal({ open, onClose, onSubmit, initialValues, loading, mode }) {
    const { message } = App.useApp()
    const [form] = Form.useForm()
    const [imageFile, setImageFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [removeImage, setRemoveImage] = useState(false)

    const labelClass = "font-medium text-gray-700"
    const inputClass = "rounded-xl border border-gray-300 w-full"
    const btnBase = "h-11 rounded-xl font-medium"
    const btnCancel = `${btnBase} text-gray-600 border border-gray-300`
    const btnPrimary = `${btnBase} font-semibold text-white bg-gradient-to-tr from-green-800 to-green-600 shadow-md`

    useEffect(() => {
        if (open) {
            setImageFile(null)
            setRemoveImage(false)
            if (initialValues) {
                form.setFieldsValue({
                    name: initialValues.name,
                    price: parseFloat(initialValues.price),
                    category: initialValues.category,
                })
                setPreview(null) // No real image URL without API
            } else {
                form.resetFields()
                setPreview(null)
            }
        }
    }, [open, initialValues, form])

    const handleOk = async () => {
        try {
            const values = await form.validateFields()
            if (imageFile) values.image = imageFile
            if (removeImage) values.remove_image = "true"
            onSubmit(values)
        } catch (err) {
            console.log(err)
        }
    }

    const handleImageChange = (file) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"]
        if (!allowed.includes(file.type)) {
            message.error("Only JPG, PNG, WebP allowed.")
            return false
        }
        if (file.size > 5 * 1024 * 1024) {
            message.error("Max 5MB.")
            return false
        }
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target.result)
        reader.readAsDataURL(file)
        setImageFile(file)
        setRemoveImage(false)
        return false
    }

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={500}
            centered
            className="rounded-xl overflow-hidden"
        >
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 bg-linear-to-tr from-green-900 to-green-700 flex items-center gap-3 rounded-t-xl z-10">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">
                        {mode === "add" ? "Add New Product" : "Edit Product"}
                    </h3>
                    <p className="text-green-200 text-sm mt-1">
                        {mode === "add"
                            ? "Fill in the details to register a new product."
                            : "Update the product information below."}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="p-6 mt-6">
                <Form layout="vertical" form={form} requiredMark={false} size="large">
                    {/* Product Name */}
                    <Form.Item
                        name="name"
                        label={<span className={labelClass}>Product Name</span>}
                        rules={[{ required: true, message: "Product name is required" }]}
                    >
                        <Input placeholder="e.g. Fresh Jasmine Rice" className={inputClass} />
                    </Form.Item>

                    {/* Price */}
                    <Form.Item
                        name="price"
                        label={<span className={labelClass}>Price (₱)</span>}
                        rules={[
                            { required: true, message: "Price is required" },
                            { type: "number", min: 0.01, message: "Must be greater than 0" },
                        ]}
                    >
                        <InputNumber
                            min={0.01}
                            step={0.5}
                            precision={2}
                            prefix="₱"
                            placeholder="e.g. 95.00"
                            style={{ width: "100%" }}
                            className={inputClass}
                        />
                    </Form.Item>

                    {/* Category */}
                    <Form.Item
                        name="category"
                        label={<span className={labelClass}>Category</span>}
                        rules={[{ required: true, message: "Category is required" }]}
                    >
                        <Input placeholder="e.g. Vegetables" className={inputClass} />
                    </Form.Item>

                    {/* Image Upload */}
                    <Form.Item
                        label={
                            <span className={labelClass}>
                                Product Image <span className="text-gray-400 font-normal">(optional)</span>
                            </span>
                        }
                    >
                        <Upload.Dragger
                            name="image"
                            accept=".jpg,.jpeg,.png,.webp"
                            showUploadList={false}
                            beforeUpload={handleImageChange}
                            className="rounded-lg"
                        >
                            {preview && !removeImage ? (
                                <div className="relative">
                                    <img
                                        src={preview}
                                        alt="preview"
                                        className="w-full max-h-40 object-cover rounded-lg block"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                                        <span className="text-white font-medium text-sm">Click to change</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-gray-500 flex flex-col items-center">
                                    <UploadCloud className="text-green-600 mb-2" size={20} />
                                    <p className="font-medium text-sm m-0">Click or drag image here</p>
                                    <p className="text-gray-400 text-xs mt-1">JPG, PNG, WebP · max 5MB</p>
                                </div>
                            )}
                        </Upload.Dragger>
                        {preview && !removeImage && (
                            <button
                                type="button"
                                onClick={() => { setPreview(null); setImageFile(null); setRemoveImage(mode === "edit") }}
                                className="mt-2 text-red-600 text-xs font-medium underline hover:no-underline"
                            >
                                Remove image
                            </button>
                        )}
                    </Form.Item>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-2">
                        <Button onClick={onClose} block className={btnCancel}>Cancel</Button>
                        <Button onClick={handleOk} loading={loading} type="primary" block className={btnPrimary}>
                            {loading ? "Saving…" : mode === "add" ? "Add Product" : "Save Changes"}
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    )
}

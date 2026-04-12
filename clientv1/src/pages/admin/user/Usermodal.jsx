import React, { useEffect, useState } from "react"
import { Modal, Form, Input, Select, Button, Upload, Steps, Row, Col, App } from "antd"
import { User2, UserPlus, ArrowLeft } from "lucide-react"
import { ArrowRightOutlined, UploadOutlined } from "@ant-design/icons"
import Avatar from "../../../components/Avatar"
import AddressSelect from "../../../components/AddressSelect"

const STORE_CATEGORIES = [
    { label: "Convenience Store / Sari-Sari", value: "convenience" },
    { label: "Grocery", value: "grocery" },
    { label: "Bakery / Panaderya", value: "bakery" },
    { label: "Butcher / Palengke", value: "butcher" },
    { label: "Pharmacy / Botika", value: "pharmacy" },
    { label: "Restaurant / Carinderia", value: "restaurant" },
    { label: "Clothing & Apparel", value: "clothing" },
    { label: "Electronics & Gadgets", value: "electronics" },
    { label: "Hardware", value: "hardware" },
    { label: "Beauty & Wellness", value: "beauty" },
    { label: "Fruits & Vegetables", value: "produce" },
    { label: "Other", value: "other" },
]

export default function UserModal({ open, onClose, onSubmit, initialValues, loading, mode }) {
    const { message } = App.useApp()
    const [form] = Form.useForm()
    const [step, setStep] = useState(0)
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [removeAvatar, setRemoveAvatar] = useState(false)
    const [previewUser, setPreviewUser] = useState(null)
    const [addressInitial, setAddressInitial] = useState(null)

    const labelClass = "font-medium text-gray-700"
    const inputClass = "rounded-xl border border-gray-300 w-full"

    const currentFirstname = Form.useWatch("firstname", form)
    const selectedRole = Form.useWatch("role", form)
    const isSeller = selectedRole === "seller"

    const getSteps = (seller) => seller
        ? [{ title: "About" }, { title: "Store" }, { title: "Address" }, { title: "Credentials" }]
        : [{ title: "About" }, { title: "Address" }, { title: "Credentials" }]

    const stepTitles = isSeller
        ? ["Tell us about the user", "Store information", "Address", "Secure the account"]
        : ["Tell us about the user", "Address", "Secure the account"]

    // Render-time state adjustment when modal opens (avoids setState in effect)
    const [prevOpen, setPrevOpen] = useState(false)
    if (open && !prevOpen) {
        setPrevOpen(true)
        setStep(0)
        setAvatarFile(null)
        setRemoveAvatar(false)
        setAddressInitial(null)
        if (initialValues) {
            setAvatarPreview(initialValues.profile_picture ? `/${initialValues.profile_picture}` : null)
            setPreviewUser(initialValues)
            const loc = initialValues.locations?.[0]
            if (loc) {
                setAddressInitial({
                    region: loc.region,
                    province: loc.province,
                    city: loc.city_municipality,
                    barangay: loc.barangay,
                })
            }
        } else {
            setAvatarPreview(null)
            setPreviewUser(null)
        }
    } else if (!open && prevOpen) {
        setPrevOpen(false)
    }

    // Effect for external system interactions (Ant Design form)
    useEffect(() => {
        if (open) {
            if (initialValues) {
                const loc = initialValues.locations?.[0]
                form.setFieldsValue({
                    firstname: initialValues.firstname,
                    lastname: initialValues.lastname,
                    email: initialValues.email,
                    role: initialValues.role,
                    contact_number: initialValues.contact_number ?? "",
                    password: "",
                    store_name: initialValues.store?.store_name ?? "",
                    store_category: initialValues.store?.category?.name ?? "",
                    store_description: initialValues.store?.description ?? "",
                    region: loc?.region ?? undefined,
                    province: loc?.province ?? undefined,
                    city: loc?.city_municipality ?? undefined,
                    barangay: loc?.barangay ?? undefined,
                    store_banner: initialValues.store?.banner
                        ? [{ uid: '-1', name: 'banner', status: 'done', url: `/${initialValues.store.banner}` }]
                        : [],
                })
            } else {
                form.resetFields()
            }
        }
    }, [open, initialValues, form])

    const handleAvatarChange = (file) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"]
        if (!allowed.includes(file.type)) { message.error("Only JPG, PNG, WebP allowed."); return false }
        if (file.size > 5 * 1024 * 1024) { message.error("Max 5MB."); return false }
        const reader = new FileReader()
        reader.onload = (e) => setAvatarPreview(e.target.result)
        reader.readAsDataURL(file)
        setAvatarFile(file)
        setRemoveAvatar(false)
        return false
    }

    // Map logical step index to field groups for validation
    const getStepFields = (s) => {
        if (s === 0) return ["firstname", "lastname", "role", "contact_number"]
        if (isSeller) {
            if (s === 1) return ["store_name", "store_category", "store_description"]
            if (s === 2) return ["region", "province", "city", "barangay"]
            if (s === 3) return ["email", "password"]
        } else {
            if (s === 1) return ["region", "province", "city", "barangay"]
            if (s === 2) return ["email", "password"]
        }
        return []
    }

    const handleNext = async () => {
        try {
            await form.validateFields(getStepFields(step))
            setStep(step + 1)
        } catch { /* validation errors shown */ }
    }

    const handleOk = async () => {
        try {
            const values = await form.validateFields()
            if (mode === "edit" && !values.password) delete values.password
            if (avatarFile) values.profile_picture = avatarFile
            if (removeAvatar) values.remove_picture = "true"
            // Pass banner file if present
            const bannerList = form.getFieldValue("store_banner")
            if (bannerList?.[0]?.originFileObj) {
                values.store_banner = bannerList[0].originFileObj
            } else {
                delete values.store_banner
            }
            onSubmit(values)
        } catch { /* validation errors shown */ }
    }

    // Determine which logical step index maps to each step type
    const aboutStep = 0
    const storeStep = isSeller ? 1 : -1
    const addressStep = isSeller ? 2 : 1
    const credentialStep = isSeller ? 3 : 2

    return (
        <Modal open={open} onCancel={onClose} footer={null} width={540} centered className="rounded-xl overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full rounded-t-xl z-10 overflow-hidden">
                <div className="flex border-b border-gray-200 bg-linear-to-r from-green-50/80 to-white">
                    <div className="w-1.5 bg-linear-to-b from-green-600 to-emerald-400 rounded-tl-xl" />
                    <div className="px-5 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center ring-1 ring-green-200">
                            <User2 className="w-4 h-4 text-green-700" />
                        </div>
                        <div>
                            <h3 className="font-sora font-bold text-base text-gray-900 leading-tight">
                                {mode === "add" ? "Add New User" : "Edit User"}
                            </h3>
                            <p className="text-[11px] text-gray-400">{stepTitles[step]}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="p-6 mt-18">
                <Steps current={step} items={getSteps(isSeller).map(s => ({ title: s.title }))} size="small" className="mb-6" />

                <Form layout="vertical" form={form} requiredMark={false} size="large">
                    {/* Step 0: Personal Info + Role */}
                    <div style={{ display: step === aboutStep ? undefined : "none" }}>
                        {/* Avatar Upload */}
                        <Form.Item label={<span className={labelClass}>Profile Photo <span className="text-gray-400 font-normal">(optional)</span></span>}>
                            <div className="flex items-center gap-3">
                                {avatarPreview && !removeAvatar ? (
                                    <img src={avatarPreview} alt="preview" className="w-12 h-12 rounded-full object-cover border border-green-100" />
                                ) : (
                                    <Avatar user={{ firstname: currentFirstname || previewUser?.firstname }} size={48} fontSize="1.1rem" />
                                )}
                                <Upload beforeUpload={handleAvatarChange} showUploadList={false} accept=".jpg,.jpeg,.png,.webp">
                                    <Button className="rounded-lg border border-gray-300 font-sans text-sm">
                                        {avatarPreview && !removeAvatar ? "Change photo" : "Upload photo"}
                                    </Button>
                                </Upload>
                                {avatarPreview && !removeAvatar && (
                                    <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); setRemoveAvatar(mode === "edit") }} className="text-red-500 text-xs font-sans hover:underline">
                                        Remove
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-400 text-xs mt-1">JPG, PNG, WebP · max 5MB</p>
                        </Form.Item>

                        <Form.Item name="role" label={<span className={labelClass}>Role</span>} rules={[{ required: true, message: "Role is required" }]}>
                            <Select placeholder="Select role" className="rounded-xl">
                                <Select.Option value="admin">Admin</Select.Option>
                                <Select.Option value="seller">Seller</Select.Option>
                                <Select.Option value="customer">Customer</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="firstname" label={<span className={labelClass}>First Name</span>} rules={[{ required: true, message: "First name is required" }]}>
                            <Input placeholder="e.g. Juan" className={inputClass} />
                        </Form.Item>

                        <Form.Item name="lastname" label={<span className={labelClass}>Last Name</span>} rules={[{ required: true, message: "Last name is required" }]}>
                            <Input placeholder="e.g. Dela Cruz" className={inputClass} />
                        </Form.Item>

                        <Form.Item name="contact_number" label={<span className={labelClass}>Contact Number <span className="text-gray-400 font-normal">(optional)</span></span>}>
                            <Input placeholder="e.g. 09171234567" className={inputClass} />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col xs={12}><Button size="large" block className="h-12 rounded-xl font-semibold" onClick={onClose}>Cancel</Button></Col>
                            <Col xs={12}><Button type="primary" size="large" block className="h-12 rounded-xl font-semibold" onClick={handleNext} icon={<ArrowRightOutlined />} iconPosition="end">Continue</Button></Col>
                        </Row>
                    </div>

                    {/* Step: Store Info (seller only) */}
                    <div style={{ display: step === storeStep ? undefined : "none" }}>
                        <Form.Item name="store_name" label={<span className={labelClass}>Store Name</span>} rules={[{ required: isSeller, message: "Store name is required" }]}>
                            <Input placeholder="e.g., Maria's Sari-Sari Store" className={inputClass} />
                        </Form.Item>

                        <Form.Item name="store_category" label={<span className={labelClass}>Store Category</span>} rules={[{ required: isSeller, message: "Please select a category" }]}>
                            <Select placeholder="Select category" options={STORE_CATEGORIES} className="w-full" />
                        </Form.Item>

                        <Form.Item name="store_description" label={<span className={labelClass}>Store Description</span>} rules={[{ required: isSeller, message: "Description is required" }, { max: 500, message: "Max 500 characters" }]}>
                            <Input.TextArea placeholder="Tell customers about this store..." rows={3} className={inputClass} />
                        </Form.Item>

                        <Form.Item name="store_banner" label={<span className={labelClass}>Store Banner <span className="text-gray-400 font-normal">(optional)</span></span>} valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}>
                            <Upload maxCount={1} beforeUpload={() => false} accept="image/*" listType="picture-card" onPreview={(file) => { const src = file.url || file.thumbUrl || (file.originFileObj && URL.createObjectURL(file.originFileObj)); if (src) { const w = window.open(); w.document.write(`<img src="${src}" style="max-width:100%" />`); } }}>
                                <div className="flex flex-col items-center">
                                    <UploadOutlined className="text-xl text-green-600" />
                                    <div className="mt-1 text-xs text-gray-500">Upload Banner</div>
                                </div>
                            </Upload>
                        </Form.Item>

                        <Row gutter={16}>
                            <Col xs={12}><Button size="large" block className="h-12 rounded-xl font-semibold" onClick={() => setStep(0)} icon={<ArrowLeft size={16} />}>Back</Button></Col>
                            <Col xs={12}><Button type="primary" size="large" block className="h-12 rounded-xl font-semibold" onClick={handleNext} icon={<ArrowRightOutlined />} iconPosition="end">Continue</Button></Col>
                        </Row>
                    </div>

                    {/* Step: Address */}
                    <div style={{ display: step === addressStep ? undefined : "none" }}>
                        <AddressSelect form={form} initialValues={addressInitial} key={initialValues?.id || 'new'} />
                        <Row gutter={16} className="mt-6">
                            <Col xs={12}><Button size="large" block className="h-12 rounded-xl font-semibold" onClick={() => setStep(step - 1)} icon={<ArrowLeft size={16} />}>Back</Button></Col>
                            <Col xs={12}><Button type="primary" size="large" block className="h-12 rounded-xl font-semibold" onClick={handleNext} icon={<ArrowRightOutlined />} iconPosition="end">Continue</Button></Col>
                        </Row>
                    </div>

                    {/* Step: Credentials */}
                    <div style={{ display: step === credentialStep ? undefined : "none" }}>
                        <Form.Item name="email" label={<span className={labelClass}>Email address</span>} rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Enter a valid email" }]}>
                            <Input placeholder="user@example.com" className={inputClass} />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span className={labelClass}>Password{mode === "edit" && <span className="text-gray-400 font-normal"> (blank = keep current)</span>}</span>}
                            rules={mode === "add" ? [{ required: true, message: "Password is required" }, { min: 6, message: "At least 6 characters" }] : [{ min: 6, message: "At least 6 characters if changing" }]}
                        >
                            <Input.Password placeholder="••••••••" className={inputClass} />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col xs={12}><Button size="large" block className="h-12 rounded-xl font-semibold" onClick={() => setStep(step - 1)} icon={<ArrowLeft size={16} />}>Back</Button></Col>
                            <Col xs={12}>
                                <Button icon={<UserPlus size={16} />} onClick={handleOk} loading={loading} type="primary" size="large" block className="h-12 rounded-xl font-semibold">
                                    {loading ? "Saving…" : mode === "add" ? "Create User" : "Save Changes"}
                                </Button>
                            </Col>
                        </Row>
                    </div>
                </Form>
            </div>
        </Modal>
    )
}

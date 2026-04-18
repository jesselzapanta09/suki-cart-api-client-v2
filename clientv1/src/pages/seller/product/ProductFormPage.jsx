import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { App, Button, Form, Input, InputNumber, Select, Spin, Tag, Upload } from "antd"
import { ArrowLeft, ImagePlus, Layers, Package, Save, Trash2 } from "lucide-react"
import { UploadOutlined } from "@ant-design/icons"
import { getCategories as getPublicCategories } from "../../../services/authService"
import * as productService from "../../../services/productService"
import { getStorageUrl } from "../../../utils/storage"

function getStatusTag(status) {
  if (status === "active") return <Tag color="green">Active</Tag>
  if (status === "out_of_stock") return <Tag color="orange">Out of Stock</Tag>
  return <Tag>Draft</Tag>
}

function mapProductToForm(product) {
  // Convert specs object to array of {key, value} pairs for the form
  const specsArray = product.specs ? Object.entries(product.specs).map(([key, value]) => ({ key, value })) : [];
  
  return {
    name: product.name ?? "",
    category_id: product.category_id ?? undefined,
    description: product.description ?? "",
    price: product.price !== undefined && product.price !== null ? Number(product.price) : null,
    stock: product.stock ?? 0,
    specs: specsArray,
    status: product.status ?? "active",
    images: [],
  }
}

const DEFAULT_FORM_VALUES = {
  name: "",
  category_id: undefined,
  description: "",
  price: null,
  stock: 0,
  specs: [],
  status: "active",
  images: [],
}

export default function ProductFormPage({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const isEdit = mode === "edit"
  const [categories, setCategories] = useState([])
  const [pageLoading, setPageLoading] = useState(isEdit)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [imageList, setImageList] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [deletedImageIds, setDeletedImageIds] = useState([])
  const [product, setProduct] = useState(null)
  const totalImageCount = existingImages.length + imageList.length
  const hasUploadSlots = totalImageCount < 5

  const categoryOptions = useMemo(() => categories.map((category) => ({
    label: category.name,
    value: category.id,
  })), [categories])

  useEffect(() => {
    getPublicCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!isEdit) {
      setProduct(null)
      setExistingImages([])
      setDeletedImageIds([])
      setImageList([])
      return
    }

    setPageLoading(true)
    productService.getProduct(id)
      .then((data) => {
        const nextProduct = data.product
        setProduct(nextProduct)
        setExistingImages(nextProduct.images || [])
        setDeletedImageIds([])
        setImageList([])
      })
      .catch((err) => {
        console.error("Failed to load product:", err)
        message.error('Failed to load product details. It may have been removed.')
        navigate("/seller/products", { replace: true })
      })
      .finally(() => setPageLoading(false))
  }, [form, id, isEdit, message, navigate])

  useEffect(() => {
    if (isEdit) {
      if (pageLoading || !product) return
      form.setFieldsValue(mapProductToForm(product))
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_FORM_VALUES)
  }, [form, isEdit, pageLoading, product])

  const applyBackendErrors = (errors = {}) => {
    const fields = Object.entries(errors).map(([name, errorList]) => ({
      name,
      errors: Array.isArray(errorList) ? errorList : [String(errorList)],
    }))
    if (fields.length > 0) form.setFields(fields)
  }

  const handleUploadChange = ({ fileList }) => {
    const availableSlots = Math.max(0, 5 - existingImages.length)
    const nextFileList = fileList.slice(0, availableSlots)

    if (fileList.length > availableSlots) {
      message.warning("A product can only have up to 5 images")
    }

    setImageList(nextFileList)
    form.setFieldValue("images", nextFileList)
  }

  const handleRemoveExistingImage = (imageId) => {
    setExistingImages((prev) => prev.filter((image) => image.id !== imageId))
    setDeletedImageIds((prev) => (prev.includes(imageId) ? prev : [...prev, imageId]))
    message.success("Image removed. Save the product to apply this change.")
  }

  const handleSubmit = async (values) => {
    const formData = new FormData()

    Object.entries(values).forEach(([key, value]) => {
      if (key === "images") return
      if (key === "specs") {
        // Convert specs array to FormData object format (specs[key]=value)
        if (Array.isArray(value) && value.length > 0) {
          const specsObj = value.reduce((acc, spec) => {
            if (spec.key && spec.value) {
              acc[spec.key] = spec.value
            }
            return acc
          }, {})
          // Append each spec as a form array item
          Object.entries(specsObj).forEach(([specKey, specValue]) => {
            formData.append(`specs[${specKey}]`, specValue)
          })
        }
        return
      }
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value)
      }
    })

    imageList.forEach((file) => {
      if (file.originFileObj) formData.append("images[]", file.originFileObj)
    })

    deletedImageIds.forEach((imageId) => {
      formData.append("deleted_image_ids[]", imageId)
    })

    setSubmitLoading(true)
    try {
      if (isEdit) {
        await productService.updateProduct(id, formData)
        message.success("Product updated successfully!")
      } else {
        await productService.addProduct(formData)
        message.success("Product created successfully!")
      }
      navigate("/seller/products")
    } catch (err) {
      applyBackendErrors(err.errors)
      console.error("Failed to submit product form:", err)
      message.error('Failed to save product. Please check the form for errors and try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-275 mx-auto space-y-5">
      <div className="flex items-center justify-between rounded-xl px-6 py-5 bg-white ring-1 ring-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/seller/products")} icon={<ArrowLeft size={16} />} type="text" />
          <div className="w-11 h-11 rounded-lg bg-linear-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-sm">
            <Layers size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-sora font-bold text-xl text-gray-900">
              {isEdit ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {isEdit ? "Update your product details and images" : "Create a new product for your store"}
            </p>
          </div>
        </div>
        {isEdit && product ? getStatusTag(product.status) : <Tag color="green">New</Tag>}
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        size="large"
        onFinish={handleSubmit}
        initialValues={DEFAULT_FORM_VALUES}
      >
        {pageLoading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <Spin size="large" />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center">
                  <Package size={20} className="text-green-700" />
                </div>
                <div>
                  <h2 className="font-sora font-bold text-lg text-gray-900">Product Details</h2>
                  <p className="text-sm text-gray-400">Fill in the basic information customers will see.</p>
                </div>
              </div>

              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: "Product name is required" }]}
              >
                <Input placeholder="e.g. Lucky Me Noodles" />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="category_id"
                  label="Category"
                  rules={[{ required: true, message: "Category is required" }]}
                >
                  <Select
                    placeholder="Select category"
                    options={categoryOptions}
                    notFoundContent="No categories found"
                  />
                </Form.Item>

                <Form.Item
                  name="price"
                  label="Price"
                  rules={[{ required: true, message: "Price is required" }]}
                >
                  <InputNumber min={0} step={0.01} className="w-full" style={{ width: "100%" }} prefix="PHP" placeholder="0.00" />
                </Form.Item>

                <Form.Item
                  name="stock"
                  label="Stock"
                  rules={[{ required: true, message: "Stock is required" }]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    style={{ width: "100%" }}
                    placeholder="0"
                    onChange={(value) => {
                      if (value === 0) {
                        form.setFieldValue('status', 'out_of_stock')
                      } else if (value > 0) {
                        const currentStatus = form.getFieldValue('status')
                        if (currentStatus === 'out_of_stock') {
                          form.setFieldValue('status', 'active')
                        }
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="status"
                  label="Status"
                  rules={[
                    { required: true, message: "Status is required" },
                    {
                      validator: (_, value) => {
                        const currentStock = form.getFieldValue('stock')
                        if (currentStock === 0 && value !== 'out_of_stock') {
                          return Promise.reject(new Error('Status must be "Out of Stock" when stock is 0'))
                        }
                        if (currentStock > 0 && value === 'out_of_stock') {
                          return Promise.reject(new Error('Status cannot be "Out of Stock" when stock is greater than 0'))
                        }
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <Select
                    options={[
                      { label: "Active", value: "active" },
                      { label: "Draft", value: "draft" },
                      { label: "Out of Stock", value: "out_of_stock" },
                    ]}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: "Description is required" }]}
              >
                <Input.TextArea rows={6} placeholder="Describe the product..." />
              </Form.Item>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                  <Layers size={20} className="text-blue-700" />
                </div>
                <div>
                  <h2 className="font-sora font-bold text-lg text-gray-900">Product Specifications</h2>
                  <p className="text-sm text-gray-400">Add optional specifications like color, size, material, etc.</p>
                </div>
              </div>

              <Form.List name="specs">
                {(fields, { add, remove }) => (
                  <div className="space-y-3">
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="flex gap-2">
                        <Form.Item
                          {...restField}
                          name={[name, 'key']}
                          rules={[{ required: true, message: 'Spec name required' }]}
                          className="flex-1"
                        >
                          <Input placeholder="e.g. Color, Size, Material" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'value']}
                          rules={[{ required: true, message: 'Spec value required' }]}
                          className="flex-1"
                        >
                          <Input placeholder="e.g. Red, Large, Cotton" />
                        </Form.Item>
                        <Button
                          danger
                          onClick={() => remove(name)}
                          icon={<Trash2 size={16} />}
                          className="shrink-0"
                        />
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} className="w-full">
                      + Add Specification
                    </Button>
                  </div>
                )}
              </Form.List>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
                  <ImagePlus size={20} className="text-emerald-700" />
                </div>
                <div>
                  <h2 className="font-sora font-bold text-lg text-gray-900">Product Images</h2>
                  <p className="text-sm text-gray-400">
                    {isEdit ? "Keep current images, upload more, or remove the ones you no longer want." : "Add at least one product image."}
                  </p>
                </div>
              </div>

              {isEdit && existingImages.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-3">Current Images</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative rounded-xl overflow-hidden ring-1 ring-gray-200 bg-gray-50 aspect-square">
                        <img src={getStorageUrl(image.image_path)} alt="Product" className="w-full h-full object-cover" />
                        <Button
                          danger
                          size="small"
                          type="primary"
                          icon={<Trash2 size={14} />}
                          onClick={() => handleRemoveExistingImage(image.id)}
                          className="absolute! top-2 right-2 rounded-lg!"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Form.Item
                name="images"
                label={isEdit ? "Add More Images" : "Upload Images"}
                valuePropName="fileList"
                getValueFromEvent={(event) => (Array.isArray(event) ? event : event?.fileList)}
                rules={[
                  {
                    validator: (_, value) => {
                      const totalImages = existingImages.length + (value?.length || 0)
                      if (totalImages < 1) return Promise.reject(new Error("At least one image is required"))
                      if (totalImages > 5) return Promise.reject(new Error("A product can only have up to 5 images"))
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <Upload
                  listType="picture-card"
                  fileList={imageList}
                  onChange={handleUploadChange}
                  onRemove={() => {
                    message.success("Selected image removed.")
                  }}
                  beforeUpload={() => false}
                  multiple
                  accept="image/*"
                  disabled={!hasUploadSlots}
                >
                  <div className={!hasUploadSlots ? "opacity-60" : ""}>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>
                      {hasUploadSlots ? "Upload" : "Max 5 images"}
                    </div>
                  </div>
                </Upload>
              </Form.Item>

              {isEdit && (
                <div className="-mt-2 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-4 py-3 text-sm">
                  New uploads will be added to this product. Remove any current image above if you want it deleted.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="text-xs font-semibold text-gray-700">Product</div>
              <div className="text-sm text-gray-500">
                Products with <span className="font-semibold text-gray-700">Active</span> status are ready to appear in your store.
              </div>
              <div className="text-sm text-gray-500">
                Use <span className="font-semibold text-gray-700">Draft</span> if you want to save details first and finish later.
              </div>
              <div className="text-sm text-gray-500">
                Choose <span className="font-semibold text-gray-700">Out of Stock</span> when the product should stay listed but unavailable.
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
              <div className="text-xs font-semibold text-gray-700">Actions</div>
              <Button type="primary" htmlType="submit" loading={submitLoading} icon={<Save size={16} />} block size="large">
                {isEdit ? "Update Product" : "Save Product"}
              </Button>
              <Button block size="large" onClick={() => navigate("/seller/products")}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
        )}
      </Form>
    </div>
  )
}

import React, { useEffect, useState } from "react"
import { Button, Form, Input, InputNumber, Table, Popconfirm, App, Spin, Space, Modal } from "antd"
import { useParams, useNavigate } from "react-router-dom"
import { Plus, Trash2, ArrowLeft, Package, Layers } from "lucide-react"
import * as productService from "../../../services/productService"

export default function ProductVariantManagementPage() {
  const { id: productId } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState(null)

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProductAndVariants()
  }, [productId])

  const fetchProductAndVariants = async () => {
    try {
      setLoading(true)
      const [productRes, variantsRes] = await Promise.all([
        productService.getProduct(productId),
        productService.getProductVariants(productId),
      ])
      setProduct(productRes.product)
      setVariants(variantsRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      message.error("Failed to load product variants")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (variant = null) => {
    if (variant) {
      setIsEditMode(true)
      setEditingVariantId(variant.id)
      form.setFieldsValue({
        ...variant,
        attributes: Object.entries(variant.attributes || {}).map(([key, value]) => ({
          key,
          value,
        })),
      })
    } else {
      setIsEditMode(false)
      setEditingVariantId(null)
      form.resetFields()
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    form.resetFields()
  }

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)

      // Convert attributes array to object
      const attributes = {}
      ;(values.attributes || []).forEach((attr) => {
        if (attr.key && attr.value) {
          attributes[attr.key] = attr.value
        }
      })

      const payload = {
        ...values,
        attributes,
      }
      delete payload.id

      if (isEditMode && editingVariantId) {
        await productService.updateProductVariant(productId, editingVariantId, payload)
        message.success("Variant updated successfully")
      } else {
        await productService.addProductVariant(productId, payload)
        message.success("Variant created successfully")
      }

      handleCloseModal()
      fetchProductAndVariants()
    } catch (error) {
      console.error("Error saving variant:", error)
      message.error(error.message || "Failed to save variant")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (variantId) => {
    try {
      await productService.deleteProductVariant(productId, variantId)
      message.success("Variant deleted successfully")
      fetchProductAndVariants()
    } catch (error) {
      console.error("Error deleting variant:", error)
      message.error(error.message || "Failed to delete variant")
    }
  }

  const columns = [
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 110,
      render: (sku) => <span className="font-mono text-sm text-gray-600">{sku || "—"}</span>,
    },
    {
      title: "Attributes",
      dataIndex: "attributes",
      key: "attributes",
      render: (attributes) => (
        <div className="space-y-1">
          {Object.entries(attributes || {}).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-semibold text-gray-700">{key}:</span>
              <span className="text-gray-600 ml-2">{value}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (price) => <span className="text-green-700 font-semibold">PHP {Number(price).toLocaleString()}</span>,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 90,
      render: (stock) => <span className="font-mono text-sm">{stock}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            onClick={() => handleOpenModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Variant?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <Package size={48} className="text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or is no longer available.</p>
        <button
          onClick={() => navigate("/seller/products")}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/seller/products")}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-green-900">Manage Variants</h1>
          <p className="text-gray-500 text-sm">{product.name}</p>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end mb-6">
        <Button
          type="primary"
          icon={<Plus size={16} />}
          size="large"
          onClick={() => handleOpenModal()}
          className="rounded-xl font-semibold"
        >
          Add Variant
        </Button>
      </div>

      {/* Variants Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={variants}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (count) => <span className="text-gray-400 text-sm">{count} variants total</span>,
          }}
          locale={{
            emptyText: (
              <div className="py-8">
                <Layers size={32} className="text-gray-300 mx-auto mb-2" />
                <div className="font-semibold text-gray-700 mb-1">No variants yet</div>
                <div className="text-sm text-gray-400">Add a variant to get started</div>
              </div>
            ),
          }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={isEditMode ? "Edit Variant" : "Add New Variant"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          {/* Attributes */}
          <Form.List name="attributes" initialValue={[{ key: "", value: "" }]}>
            {(fields, { add, remove }) => (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Variant Attributes (e.g., Size, Color)
                </label>
                {fields.map((field, index) => (
                  <div key={field.key} className="flex gap-2 mb-2">
                    <Form.Item
                      {...field}
                      name={[field.name, "key"]}
                      className="flex-1 mb-0"
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!value && form.getFieldValue(["attributes", field.name, "value"])) {
                              return Promise.reject(new Error("Attribute name is required"))
                            }
                            return Promise.resolve()
                          },
                        },
                      ]}
                    >
                      <Input
                        placeholder="Attribute name (e.g., Size)"
                        className="rounded-lg"
                      />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, "value"]}
                      className="flex-1 mb-0"
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!value && form.getFieldValue(["attributes", field.name, "key"])) {
                              return Promise.reject(new Error("Attribute value is required"))
                            }
                            return Promise.resolve()
                          },
                        },
                      ]}
                    >
                      <Input
                        placeholder="Attribute value (e.g., M)"
                        className="rounded-lg"
                      />
                    </Form.Item>
                    <Button
                      danger
                      onClick={() => remove(field.name)}
                      icon={<Trash2 size={14} />}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  className="mb-4"
                  icon={<Plus size={14} />}
                >
                  Add Attribute
                </Button>
              </div>
            )}
          </Form.List>

          {/* SKU */}
          <Form.Item
            label="SKU (Optional)"
            name="sku"
            rules={[
              { type: "string", max: 100, message: "SKU must not exceed 100 characters" },
            ]}
          >
            <Input
              placeholder="e.g., SHIRT-XL-RED"
              className="rounded-lg"
            />
          </Form.Item>

          {/* Price */}
          <Form.Item
            label="Price"
            name="price"
            rules={[
              { required: true, message: "Price is required" },
              { type: "number", min: 0, message: "Price must be greater than or equal to 0" },
            ]}
          >
            <InputNumber
              placeholder="0.00"
              min={0}
              step={0.01}
              precision={2}
              className="w-full rounded-lg"
              prefix="PHP "
            />
          </Form.Item>

          {/* Stock */}
          <Form.Item
            label="Stock"
            name="stock"
            rules={[
              { required: true, message: "Stock is required" },
              { type: "integer", min: 0, message: "Stock must be greater than or equal to 0" },
            ]}
          >
            <InputNumber
              placeholder="0"
              min={0}
              className="w-full rounded-lg"
            />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              size="large"
              className="rounded-xl font-semibold"
            >
              {isEditMode ? "Update Variant" : "Create Variant"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

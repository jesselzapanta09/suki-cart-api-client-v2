import React, { useEffect, useState, useCallback, useRef } from "react"
import { Button, Table, Popconfirm, App, Spin, Tooltip, Input } from "antd"
import { useParams, useNavigate } from "react-router-dom"
import { Plus, Trash2, ArrowLeft, Package, Layers, Edit, Search } from "lucide-react"
import ProductVariantModal from "./ProductVariantModal"
import * as productService from "../../../services/productService"

export default function ProductVariantManagementIndex() {
  const { uuid: productUuid } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [filteredVariants, setFilteredVariants] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("add")
  const [editRecord, setEditRecord] = useState(null)

  const searchTimer = useRef(null)

  const fetchProductAndVariants = useCallback(async () => {
    try {
      setLoading(true)
      const [productRes, variantsRes] = await Promise.all([
        productService.getProduct(productUuid),
        productService.getProductVariants(productUuid),
      ])
      const productData = productRes.product || productRes.data
      if (!productData) {
        message.error("Product not found. Redirecting...")
        navigate("/seller/products", { replace: true })
        return
      }
      setProduct(productData)
      const allVariants = variantsRes.data || []
      setVariants(allVariants)
      filterVariants(allVariants, search)
    } catch (error) {
      console.error("Error fetching data:", error)
      message.error("Failed to load product. Redirecting...")
      navigate("/seller/products", { replace: true })
    } finally {
      setLoading(false)
    }
  }, [productUuid, message, search, navigate])

  useEffect(() => {
    fetchProductAndVariants()
  }, [fetchProductAndVariants])

  const filterVariants = (variantsList, searchValue) => {
    if (!searchValue.trim()) {
      setFilteredVariants(variantsList)
      return
    }
    const searchLower = searchValue.toLowerCase()
    const filtered = variantsList.filter((variant) => {
      const nameMatch = variant.name?.toLowerCase().includes(searchLower)
      return nameMatch
    })
    setFilteredVariants(filtered)
  }

  const handleSearch = (value) => {
    setSearch(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      filterVariants(variants, value)
    }, 300)
  }

  const openAdd = () => {
    setModalMode("add")
    setEditRecord(null)
    setModalOpen(true)
  }

  const openEdit = async (record) => {
    try {
      const data = await productService.getProductVariant(productUuid, record.id)
      setModalMode("edit")
      setEditRecord(data.variant || data.data)
      setModalOpen(true)
    } catch (err) {
      message.error(err.message || "Failed to load variant")
    }
  }

  const handleSubmit = async (values) => {
    try {
      setSubmitLoading(true)

      const payload = {
        name: values.name,
        price: values.price,
        stock: values.stock,
      }

      if (modalMode === "add") {
        const res = await productService.addProductVariant(productUuid, payload)
        const newVariant = res.data || res.variant || { id: Date.now(), ...payload }
        const updatedVariants = [...variants, newVariant]
        setVariants(updatedVariants)
        filterVariants(updatedVariants, search)
        message.success("Variant created successfully!")
      } else {
        await productService.updateProductVariant(productUuid, editRecord.id, payload)
        const updatedVariants = variants.map((v) =>
          v.id === editRecord.id ? { ...v, ...payload } : v
        )
        setVariants(updatedVariants)
        filterVariants(updatedVariants, search)
        message.success("Variant updated successfully!")
      }
      setModalOpen(false)
    } catch (err) {
      message.error(err.message || "Failed to save variant")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (variantId) => {
    try {
      await productService.deleteProductVariant(productUuid, variantId)
      message.success("Variant deleted successfully!")
      const updatedVariants = variants.filter((v) => v.id !== variantId)
      setVariants(updatedVariants)
      filterVariants(updatedVariants, search)
    } catch (error) {
      console.error("Error deleting variant:", error)
      message.error(error.message || "Failed to delete variant")
    }
  }

  const columns = [
    {
      title: "Variant Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span className="font-semibold text-gray-700">{name || "—"}</span>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 130,
      render: (price) => <span className="text-green-700 font-semibold">PHP {Number(price).toLocaleString()}</span>,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 100,
      render: (stock) => <span className="font-mono text-sm font-medium">{stock}</span>,
    },
    {
      title: "Actions",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Edit">
            <Button size="small" type="primary" onClick={() => openEdit(record)} icon={<Edit size={14} />} />
          </Tooltip>
          <Tooltip title="Delete">
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
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-275 mx-auto space-y-5">
      {/* Back Button */}
      <Button onClick={() => navigate("/seller/products")} icon={<ArrowLeft size={14} />} size="large">Back</Button>

      {/* Header */}
      <div className="flex items-center justify-between rounded-xl px-6 py-5 bg-white ring-1 ring-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-linear-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-sm">
            <Layers size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-sora font-bold text-xl text-gray-900">{product?.name || "Product variants"}</h1>
            <p className="text-xs text-gray-400 mt-1">Variant Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openAdd} type="primary" icon={<Plus size={14} />} size="large">Add Variant</Button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-sora font-semibold text-sm text-green-900">All Variants</span>
            <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{filteredVariants.length}</span>
          </div>
          <Input
            placeholder="Search variant name..."
            prefix={<Search size={14} className="text-gray-400" />}
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            allowClear
            className="w-64 rounded-lg"
          />
        </div>
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredVariants}
            loading={loading || submitLoading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (count) => <span className="text-gray-400 text-sm">{count} variants total</span>,
            }}
            locale={{
              emptyText: loading ? null : (
                <div className="py-8">
                  <div className="font-semibold text-gray-700 mb-1">
                    {filteredVariants.length === 0 && variants.length > 0 ? "No variants match your search" : "No variants yet"}
                  </div>
                  <div className="text-sm text-gray-400">
                    {filteredVariants.length === 0 && variants.length > 0 ? "Try a different search term" : "Add a variant to get started"}
                  </div>
                </div>
              ),
            }}
          />
        </div>
      </div>

      {/* Modal */}
      <ProductVariantModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editRecord}
        loading={submitLoading}
        mode={modalMode}
      />

    </div>
  )
}

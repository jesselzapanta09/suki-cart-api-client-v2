import React, { useEffect, useState, useCallback, useRef } from "react"
import { Table, Button, Popconfirm, Input, Tag, Tooltip, App } from "antd"
import { useNavigate } from "react-router-dom"
import { Plus, Edit, Trash2, Search, Package, Layers } from "lucide-react"
import { getCategories as getPublicCategories } from "../../../services/authService"
import * as productService from "../../../services/productService"
import { getStorageUrl } from "../../../utils/storage"

export default function ProductIndex() {
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [sorter, setSorter] = useState({ field: "created_at", order: "descend" })
  const [statusFilter, setStatusFilter] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)

  const searchTimer = useRef(null)

  const fetchProducts = useCallback(async (page, pageSize, sortField, sortOrder, searchValue, status, category) => {
    setLoading(true)
    try {
      const data = await productService.getProducts({
        page,
        per_page: pageSize,
        search: searchValue || undefined,
        sort_field: sortField || undefined,
        sort_order: sortOrder || undefined,
        status: status ?? undefined,
        category_id: category ?? undefined,
      })
      // Support both direct and nested paginated responses
      const paginated = data.data && Array.isArray(data.data)
        ? data
        : (data.products && data.products.data ? data.products : null)
      setProducts(paginated?.data || [])
      setTotal(paginated?.total || 0)
      setPagination((prev) => ({ ...prev, current: paginated?.current_page || 1, pageSize: paginated?.per_page || 10 }))
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    getPublicCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    fetchProducts(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, statusFilter, categoryFilter)
    return () => clearTimeout(searchTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTableChange = (nextPagination, filters, sort) => {
    const nextSorter = sort.order ? { field: sort.field, order: sort.order } : sorter
    const nextStatus = filters.status?.[0] ?? null
    const nextCategory = filters.category_id?.[0] ?? null
    const filtersOrSortChanged =
      nextSorter.field !== sorter.field ||
      nextSorter.order !== sorter.order ||
      nextStatus !== statusFilter ||
      nextCategory !== categoryFilter
    const page = filtersOrSortChanged ? 1 : nextPagination.current

    setSorter(nextSorter)
    setStatusFilter(nextStatus)
    setCategoryFilter(nextCategory)
    setPagination((prev) => ({ ...prev, current: page, pageSize: nextPagination.pageSize }))

    fetchProducts(
      page,
      nextPagination.pageSize,
      nextSorter.field,
      nextSorter.order,
      search,
      nextStatus,
      nextCategory,
    )
  }

  const handleSearch = (value) => {
    setSearch(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, current: 1 }))
      fetchProducts(1, pagination.pageSize, sorter.field, sorter.order, value, statusFilter, categoryFilter)
    }, 400)
  }

  const reload = () => {
    fetchProducts(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, statusFilter, categoryFilter)
  }

  const handleDelete = async (id) => {
    try {
      await productService.deleteProduct(id)
      message.success("Product deleted successfully!")
      reload()
    } catch (err) {
      message.error(err.message)
    }
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 72,
      sorter: true,
      render: (id) => <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">#{id}</span>,
    },
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-50 ring-1 ring-green-100 overflow-hidden flex items-center justify-center">
            {record.images?.[0]?.image_path ? (
              <img src={getStorageUrl(record.images[0].image_path)} alt={record.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={20} className="text-green-700" />
            )}
          </div>
          <div>
            <div className="font-semibold text-green-950 text-sm">{record.name}</div>
            <div className="text-gray-400 text-xs">{record.sku || "No SKU"}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: ["category", "name"],
      key: "category_id",
      width: 160,
      filters: categories.map((category) => ({ text: category.name, value: category.id })),
      filterMultiple: false,
      filteredValue: categoryFilter !== null && categoryFilter !== undefined ? [categoryFilter] : null,
      render: (_, record) => (record.category?.name ? <Tag color="blue">{record.category.name}</Tag> : <Tag>None</Tag>),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 120,
      sorter: true,
      render: (price) => <span className="text-green-700 font-semibold">PHP {Number(price).toLocaleString()}</span>,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 90,
      sorter: true,
      render: (stock) => <span className="font-mono text-sm">{stock}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      sorter: true,
      filters: [
        { text: "Active", value: "active" },
        { text: "Draft", value: "draft" },
        { text: "Out of Stock", value: "out_of_stock" },
      ],
      filterMultiple: false,
      filteredValue: statusFilter ? [statusFilter] : null,
      render: (status) => {
        if (status === "active") return <Tag color="green">Active</Tag>
        if (status === "out_of_stock") return <Tag color="orange">Out of Stock</Tag>
        return <Tag>Draft</Tag>
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Edit">
            <Button
              size="small"
              type="primary"
              onClick={() => navigate(`/seller/products/${record.id}/edit`)}
              icon={<Edit size={14} />}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title={`Delete ${record.name}?`}
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger className="rounded-md" icon={<Trash2 size={14} />} />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-275 mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl px-6 py-5 bg-white ring-1 ring-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-linear-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-sm">
            <Layers size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-sora font-bold text-xl text-gray-900">Product Management</h1>
            <p className="text-xs text-gray-400 mt-1">Manage your store&apos;s products</p>
          </div>
        </div>
        <Button onClick={() => navigate("/seller/products/create")} type="primary" icon={<Plus size={14} />} size="large">Add Product</Button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-sora font-semibold text-sm text-green-900">All Products</span>
            <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{total}</span>
          </div>
          <Input
            placeholder="Search name, description..."
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
            dataSource={products}
            loading={loading}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total,
              showSizeChanger: false,
              showTotal: (count) => <span className="text-gray-400 text-sm">{count} products total</span>,
            }}
            onChange={handleTableChange}
            locale={{
              emptyText: loading ? null : (
                <div className="py-8">
                  <div className="font-semibold text-gray-700 mb-1">No products found for your store</div>
                  <div className="text-sm text-gray-400">Only products linked to the currently logged-in seller account appear here.</div>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  )
}

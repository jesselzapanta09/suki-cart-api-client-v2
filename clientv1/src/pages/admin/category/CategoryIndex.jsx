import React, { useState, useEffect, useCallback, useRef } from "react"
import { Table, Button, Popconfirm, Input, Tag, Tooltip, App } from "antd"
import { Plus, Edit, Trash2, Search, LayoutGrid, CheckCircle, XCircle } from "lucide-react"
import CategoryModal from "./CategoryModal"
import * as categoryService from "../../../services/categoryService"

export default function CategoryIndex() {
    const { message } = App.useApp()

    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
    const [sorter, setSorter] = useState({ field: "id", order: "descend" })
    const [statusFilter, setStatusFilter] = useState(null)

    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState("add")
    const [editRecord, setEditRecord] = useState(null)
    const [submitLoading, setSubmitLoading] = useState(false)

    // Stats
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })

    const searchTimer = useRef(null)

    const fetchCategories = useCallback(async (page, pageSize, sortField, sortOrder, searchVal, status) => {
        setLoading(true)
        try {
            const data = await categoryService.getCategories({
                page,
                perPage: pageSize,
                search: searchVal || undefined,
                sortField: sortField || undefined,
                sortOrder: sortOrder || undefined,
                status: status !== null && status !== undefined ? status : undefined,
            })
            setCategories(data.data)
            setTotal(data.total)
            setPagination(prev => ({ ...prev, current: data.current_page, pageSize: data.per_page }))
        } catch (err) {
            message.error(err.message)
        } finally {
            setLoading(false)
        }
    }, [message])

    const fetchStats = useCallback(async () => {
        try {
            const all = await categoryService.getCategories({ perPage: 1 })
            const totalCount = all.total

            const [active, inactive] = await Promise.all([
                categoryService.getCategories({ perPage: 1, status: 1 }).then(d => d.total).catch(() => 0),
                categoryService.getCategories({ perPage: 1, status: 0 }).then(d => d.total).catch(() => 0),
            ])

            setStats({ total: totalCount, active, inactive })
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        fetchCategories(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, statusFilter)
        fetchStats()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleTableChange = (pag, filters, sort) => {
        const newSorter = sort.order ? { field: sort.field, order: sort.order } : sorter
        const newStatus = filters.status?.[0] ?? null
        const filtersOrSortChanged = newSorter.field !== sorter.field || newSorter.order !== sorter.order || newStatus !== statusFilter
        const page = filtersOrSortChanged ? 1 : pag.current
        setSorter(newSorter)
        setStatusFilter(newStatus)
        setPagination(prev => ({ ...prev, current: page, pageSize: pag.pageSize }))
        fetchCategories(page, pag.pageSize, newSorter.field, newSorter.order, search, newStatus)
    }

    const handleSearch = (val) => {
        setSearch(val)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            setPagination(prev => ({ ...prev, current: 1 }))
            fetchCategories(1, pagination.pageSize, sorter.field, sorter.order, val, statusFilter)
        }, 400)
    }

    const reload = () => {
        fetchCategories(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, statusFilter)
        fetchStats()
    }

    const openAdd = () => { setModalMode("add"); setEditRecord(null); setModalOpen(true) }
    const openEdit = async (record) => {
        try {
            const data = await categoryService.getCategory(record.id)
            setModalMode("edit")
            setEditRecord(data.category)
            setModalOpen(true)
        } catch (err) {
            message.error(err.message)
        }
    }

    const handleSubmit = async (values) => {
        setSubmitLoading(true)
        try {
            if (modalMode === "add") {
                await categoryService.createCategory(values)
                message.success("Category created successfully!")
            } else {
                await categoryService.updateCategory(editRecord.id, values)
                message.success("Category updated successfully!")
            }
            setModalOpen(false)
            reload()
        } catch (err) {
            message.error(err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleDelete = async (id) => {
        try {
            await categoryService.deleteCategory(id)
            message.success("Category deleted successfully!")
            reload()
        } catch (err) {
            message.error(err.message)
        }
    }

    const columns = [
        {
            title: "ID", dataIndex: "id", key: "id", width: 64,
            sorter: true,
            defaultSortOrder: "descend",
            render: id => <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">#{id}</span>
        },
        {
            title: "Name", dataIndex: "name", key: "name",
            sorter: true,
            render: name => <span className="font-semibold text-green-900 text-sm">{name}</span>
        },
        {
            title: "Description", dataIndex: "description", key: "description",
            render: desc => <span className="text-gray-500 text-xs">{desc || "—"}</span>
        },
        {
            title: "Stores", dataIndex: "stores_count", key: "stores_count", width: 90,
            render: count => <span className="text-gray-600 text-sm font-medium">{count ?? 0}</span>
        },
        {
            title: "Status", dataIndex: "status", key: "status", width: 110,
            sorter: true,
            filters: [
                { text: "Active", value: 1 },
                { text: "Inactive", value: 0 },
            ],
            filterMultiple: false,
            filteredValue: statusFilter !== null && statusFilter !== undefined ? [statusFilter] : null,
            render: status => (
                <Tag color={status ? "green" : "red"}>{status ? "Active" : "Inactive"}</Tag>
            )
        },
        {
            title: "Created", dataIndex: "created_at", key: "created_at", width: 130,
            sorter: true,
            render: d => <span className="text-gray-400 text-xs">{new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</span>
        },
        {
            title: "Actions", width: 100,
            render: (_, record) => (
                <div className="flex gap-2">
                    <Tooltip title="Edit">
                        <Button size="small" type="primary" onClick={() => openEdit(record)} icon={<Edit size={14} />} />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm title={`Delete "${record.name}"?`} description="This action cannot be undone." onConfirm={() => handleDelete(record.id)} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}>
                            <Button size="small" danger className="rounded-md" icon={<Trash2 size={14} />} />
                        </Popconfirm>
                    </Tooltip>
                </div>
            )
        }
    ]

    const statItems = [
        { label: "Total", value: stats.total, icon: <LayoutGrid size={16} />, color: "text-green-700", bg: "bg-green-50", ring: "ring-green-200" },
        { label: "Active", value: stats.active, icon: <CheckCircle size={16} />, color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
        { label: "Inactive", value: stats.inactive, icon: <XCircle size={16} />, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-200" },
    ]

    return (
        <div className="p-6 lg:p-8 max-w-275 mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between rounded-xl px-6 py-5 bg-white ring-1 ring-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg bg-linear-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-sm">
                        <LayoutGrid size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-sora font-bold text-xl text-gray-900">Category Management</h1>
                        <p className="text-xs text-gray-400 mt-1">Manage store categories</p>
                    </div>
                </div>
                <Button onClick={openAdd} type="primary" icon={<Plus size={14} />} size="large">Add Category</Button>
            </div>

            {/* Stats row */}
            <div>
                <h2 className="font-sora font-semibold text-sm text-gray-700 mb-2">Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {statItems.map(s => (
                        <div key={s.label} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${s.bg} ring-1 ${s.ring}`}>
                            <div className={`${s.color}`}>{s.icon}</div>
                            <div>
                                <div className={`font-sora font-bold text-lg leading-none ${s.color}`}>{s.value}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="font-sora font-semibold text-sm text-green-900">All Categories</span>
                        <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{total}</span>
                    </div>
                    <Input
                        placeholder="Search name, description…"
                        prefix={<Search size={14} className="text-gray-400" />}
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        allowClear
                        className="w-64 rounded-lg"
                    />
                </div>
                <div className="overflow-x-auto">
                    <Table
                        dataSource={categories}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        onChange={handleTableChange}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total,
                            showSizeChanger: false,
                            showTotal: t => <span className="text-gray-400 text-sm">{t} categories total</span>,
                        }}
                    />
                </div>
            </div>

            <CategoryModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} initialValues={editRecord} loading={submitLoading} mode={modalMode} />
        </div>
    )
}

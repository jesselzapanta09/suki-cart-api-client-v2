import React, { useState, useEffect, useCallback, useRef } from "react"
import { Table, Button, Popconfirm, Input, Tag, Tooltip, App, Modal, Spin } from "antd"
import { Plus, Edit, Trash2, Search, Users, User2 } from "lucide-react"
import UserModal from "./Usermodal"
import Avatar from "../../../components/Avatar"
import LocationAddress from "../../../components/LocationAddress"
import * as userService from "../../../services/userService"

export default function UserIndex() {
    const { message } = App.useApp()

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
    const [sorter, setSorter] = useState({ field: "id", order: "descend" })
    const [roleFilter, setRoleFilter] = useState(null)
    const [emailVerifiedFilter, setEmailVerifiedFilter] = useState(null)

    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState("add")
    const [editRecord, setEditRecord] = useState(null)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [viewUser, setViewUser] = useState(null)
    const [viewLoading, setViewLoading] = useState(false)

    const searchTimer = useRef(null)

    const fetchUsers = useCallback(async (page, pageSize, sortField, sortOrder, searchVal, role, verified) => {
        setLoading(true)
        try {
            const data = await userService.getUsers({
                page,
                perPage: pageSize,
                search: searchVal || undefined,
                sortField: sortField || undefined,
                sortOrder: sortOrder || undefined,
                role: role || undefined,
                verified: verified ? (verified === 'verified' ? '1' : '0') : undefined,
            })
            setUsers(data.data)
            setTotal(data.total)
            setPagination(prev => ({ ...prev, current: data.current_page, pageSize: data.per_page }))
        } catch (err) {
            message.error(err.message)
        } finally {
            setLoading(false)
        }
    }, [message])



    useEffect(() => {
        fetchUsers(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, roleFilter, emailVerifiedFilter)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleTableChange = (pag, filters, sort) => {
        const newSorter = sort.order ? { field: sort.field, order: sort.order } : sorter
        const newRole = filters.role?.[0] || null
        const newEmailVerified = filters.email_verified_at?.[0] || null
        const filtersOrSortChanged = newSorter.field !== sorter.field || newSorter.order !== sorter.order || newRole !== roleFilter || newEmailVerified !== emailVerifiedFilter
        const page = filtersOrSortChanged ? 1 : pag.current
        setSorter(newSorter)
        setRoleFilter(newRole)
        setEmailVerifiedFilter(newEmailVerified)
        setPagination(prev => ({ ...prev, current: page, pageSize: pag.pageSize }))
        fetchUsers(page, pag.pageSize, newSorter.field, newSorter.order, search, newRole, newEmailVerified)
    }

    const handleSearch = (val) => {
        setSearch(val)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            setPagination(prev => ({ ...prev, current: 1 }))
            fetchUsers(1, pagination.pageSize, sorter.field, sorter.order, val, roleFilter, emailVerifiedFilter)
        }, 400)
    }

    const reload = () => {
        fetchUsers(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, roleFilter, emailVerifiedFilter)
    }

    const openAdd = () => { setModalMode("add"); setEditRecord(null); setModalOpen(true) }
    const openEdit = async (r) => {
        try {
            const data = await userService.getUser(r.id)
            setModalMode("edit")
            setEditRecord(data.user)
            setModalOpen(true)
        } catch (err) {
            message.error(err.message)
        }
    }

    const openView = async (id) => {
        setViewModalOpen(true)
        setViewLoading(true)
        try {
            const data = await userService.getUser(id)
            setViewUser(data.user)
        } catch (err) {
            message.error(err.message)
            setViewModalOpen(false)
        } finally {
            setViewLoading(false)
        }
    }

    const handleSubmit = async values => {
        setSubmitLoading(true)
        try {
            if (modalMode === "add") {
                await userService.createUser(values)
                message.success("User created successfully!")
            } else {
                await userService.updateUser(editRecord.id, values)
                message.success("User updated successfully!")
            }
            setModalOpen(false)
            reload()
        } catch (err) {
            message.error(err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleDelete = async id => {
        try {
            await userService.deleteUser(id)
            message.success("User deleted successfully!")
            reload()
        } catch (err) {
            message.error(err.message)
        }
    }

    const columns = [
        {
            title: "ID", dataIndex: "id", key: "id", width: 64,
            sorter: true,
            render: id => <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">#{id}</span>
        },
        {
            title: "User", dataIndex: "firstname", key: "firstname",
            sorter: true,
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <Avatar user={record} size={34} fontSize="0.85rem" />
                    <div>
                        <div onClick={() => openView(record.id)} className="font-semibold text-green-900 text-sm cursor-pointer hover:underline">{record.firstname} {record.lastname}</div>
                        <div className="text-gray-400 text-xs">{record.email}</div>
                    </div>
                </div>
            )
        },
        {
            title: "Role", dataIndex: "role", key: "role", width: 110,
            sorter: true,
            filters: [
                { text: "Admin", value: "admin" },
                { text: "Seller", value: "seller" },
                { text: "Customer", value: "customer" },
            ],
            filterMultiple: false,
            filteredValue: roleFilter ? [roleFilter] : null,
            render: role => {
                const colors = { admin: "green", seller: "orange", customer: "cyan" }
                return <Tag variant="filled" color={colors[role] || "default"}>{role.toUpperCase()}</Tag>
            }
        },
        {
            title: "Email Verified", dataIndex: "email_verified_at", key: "email_verified_at", width: 150,
            sorter: false,
            filters: [
                { text: "Verified", value: "1" },
                { text: "Not Verified", value: "0" },
            ],
            filterMultiple: false,
            filteredValue: emailVerifiedFilter ? [emailVerifiedFilter] : null,
            render: val => (
                <span className={`flex items-center gap-1 text-xs ${val ? "text-green-600" : "text-red-600"}`}>
                    <span className={`w-2 h-2 rounded-full ${val ? "bg-green-600" : "bg-red-600"}`}></span>
                    {val ? "Verified" : "Not Verified"}
                </span>
            )
        },
        {
            title: "Joined", dataIndex: "created_at", key: "created_at", width: 130,
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
                        <Popconfirm title={`Delete ${record.firstname}?`} description="This action cannot be undone." onConfirm={() => handleDelete(record.id)} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}>
                            <Button size="small" danger className="rounded-md" icon={<Trash2 size={14} />} />
                        </Popconfirm>
                    </Tooltip>
                </div>
            )
        }
    ]



    return (
        <div className="p-6 lg:p-8 max-w-275 mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between rounded-xl px-6 py-5 bg-white ring-1 ring-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg bg-linear-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-sm">
                        <Users size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-sora font-bold text-xl text-gray-900">User Management</h1>
                        <p className="text-xs text-gray-400 mt-1">Manage all user accounts and roles</p>
                    </div>
                </div>
                <Button onClick={openAdd} type="primary" icon={<Plus size={14} />} size="large">Add User</Button>
            </div>



            {/* Table card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="font-sora font-semibold text-sm text-green-900">All Users</span>
                        <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{total}</span>
                    </div>
                    <Input
                        placeholder="Search name, email, role…"
                        prefix={<Search size={14} className="text-gray-400" />}
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        allowClear
                        className="w-64 rounded-lg"
                    />
                </div>
                <div className="overflow-x-auto">
                    <Table
                        dataSource={users}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        onChange={handleTableChange}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total,
                            showSizeChanger: false,
                            showTotal: t => <span className="text-gray-400 text-sm">{t} users total</span>,
                        }}
                    />
                </div>
            </div>

            {/* View Modal */}
            <Modal open={viewModalOpen} onCancel={() => setViewModalOpen(false)} footer={null}>
                {viewLoading ? (
                    <div className="flex justify-center py-10"><Spin /></div>
                ) : viewUser && (
                    <div className="space-y-4 pt-20">
                        <div className="absolute top-0 left-0 w-full rounded-t-xl z-10 overflow-hidden">
                            <div className="flex border-b border-gray-200 bg-linear-to-r from-green-50/80 to-white">
                                <div className="w-1.5 bg-linear-to-b from-green-600 to-emerald-400 rounded-tl-xl" />
                                <div className="px-5 py-4 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center ring-1 ring-green-200">
                                        <User2 className="w-4 h-4 text-green-700" />
                                    </div>
                                    <h3 className="font-sora font-bold text-base text-gray-900">User Details</h3>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Avatar user={viewUser} size={50} fontSize="1rem" />
                            <div>
                                <div className="font-semibold text-green-900">{viewUser.firstname} {viewUser.lastname}</div>
                                <div className="text-gray-400 text-sm">{viewUser.email}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Tag color={viewUser.role === "admin" ? "green" : viewUser.role === "seller" ? "orange" : "cyan"}>{viewUser.role.toUpperCase()}</Tag>
                            <Tag color={viewUser.email_verified_at ? "green" : "red"}>{viewUser.email_verified_at ? "Verified" : "Not Verified"}</Tag>
                        </div>
                        {viewUser.contact_number && (
                            <div className="text-sm text-gray-500">Contact: {viewUser.contact_number}</div>
                        )}
                        <div className="text-sm text-gray-500">
                            Joined: {new Date(viewUser.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                        {viewUser.locations?.length > 0 && (
                            <div className="text-sm text-gray-500">
                                <div className="font-medium text-gray-700 mb-1">Address:</div>
                                {viewUser.locations.map((loc, i) => (
                                    <LocationAddress key={i} location={loc} />
                                ))}
                            </div>
                        )}
                        {viewUser.store && (
                            <div className="text-sm text-gray-500">
                                <div className="font-medium text-gray-700 mb-1">Store:</div>
                                <div>{viewUser.store.store_name} — {viewUser.store.category?.name}</div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <UserModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} initialValues={editRecord} loading={submitLoading} mode={modalMode} />
        </div>
    )
}

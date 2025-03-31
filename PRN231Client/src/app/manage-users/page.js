// src/app/manage-users/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { ApiAuth } from '@/services/ApiAuth';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [emailSearchTerm, setEmailSearchTerm] = useState('');
    const [debouncedEmailSearchTerm, setDebouncedEmailSearchTerm] = useState('');

    // Filter state
    const [filter, setFilter] = useState({
        pageNumber: 1,
        pageSize: 10,
        fullName: '',
        email: '',
        role: 'all',
        sortOrder: 'desc'
    });

    // Pagination state
    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false
    });

    // Check if user is admin
    useEffect(() => {
        const userRole = localStorage.getItem('role');
        if (userRole !== 'Admin') {
            router.push('/home');
            return;
        }
        setIsAdmin(true);
    }, [router]);

    // Debounce search input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setFilter(prev => ({
                ...prev,
                fullName: searchTerm,
                pageNumber: 1
            }));
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedEmailSearchTerm(emailSearchTerm);
            setFilter(prev => ({
                ...prev,
                email: emailSearchTerm,
                pageNumber: 1 // Reset to first page when search changes
            }));
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [emailSearchTerm]);

    // Fetch users
    useEffect(() => {
        if (!isAdmin) return;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const response = await ApiAuth.getUsers({
                    pageNumber: filter.pageNumber,
                    pageSize: filter.pageSize,
                    fullName: filter.fullName,
                    email: filter.email,
                    role: filter.role !== 'all' ? filter.role : null,
                    sortOrder: filter.sortOrder
                });

                if (response.data && response.data.data) {
                    setUsers(response.data.data.items);
                    setPagination({
                        pageNumber: response.data.data.pageNumber,
                        pageSize: response.data.data.pageSize,
                        totalCount: response.data.data.totalCount,
                        totalPages: response.data.data.totalPages,
                        hasPreviousPage: response.data.data.hasPreviousPage,
                        hasNextPage: response.data.data.hasNextPage
                    });
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                toast.error('Failed to load users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [isAdmin, filter]);

    // Toggle sort order
    const toggleSortOrder = () => {
        setFilter({
            ...filter,
            sortOrder: filter.sortOrder === 'desc' ? 'asc' : 'desc',
            pageNumber: 1
        });
    };

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Generate pagination items
    const renderPaginationItems = () => {
        const items = [];
        const maxPagesToShow = 5;
        const totalPages = pagination.totalPages;

        let startPage = Math.max(1, filter.pageNumber - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            items.push(
                <PaginationItem key="first">
                    <PaginationLink onClick={() => setFilter({...filter, pageNumber: 1})}>1</PaginationLink>
                </PaginationItem>
            );
            if (startPage > 2) {
                items.push(
                    <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        isActive={i === filter.pageNumber}
                        onClick={() => setFilter({...filter, pageNumber: i})}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(
                    <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
            items.push(
                <PaginationItem key="last">
                    <PaginationLink onClick={() => setFilter({...filter, pageNumber: totalPages})}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    // Get role badge color
    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin':
                return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Admin</Badge>;
            case 'Customer':
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Customer</Badge>;
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    if (!isAdmin) {
        return null; // Don't render anything if not admin
    }

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Manage Users
                    </h1>

                    <div className="flex flex-wrap gap-4">
                        
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-full min-w-[200px]"
                            />
                        </div>

                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by email..."
                                value={emailSearchTerm}
                                onChange={(e) => setEmailSearchTerm(e.target.value)}
                                className="pl-8 w-full min-w-[200px]"
                            />
                        </div>

                        <Select
                            value={filter.role}
                            onValueChange={(value) => setFilter({...filter, role: value, pageNumber: 1})}
                        >
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Customer">Customer</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filter.pageSize.toString()}
                            onValueChange={(value) => setFilter({...filter, pageSize: Number(value), pageNumber: 1})}
                        >
                            <SelectTrigger className="w-[80px]">
                                <SelectValue placeholder="Show" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Full Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 cursor-pointer" onClick={toggleSortOrder}>
                                    <div className="flex items-center">
                                        Created At
                                        <ArrowUpDown className="ml-1 h-4 w-4" />
                                    </div>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                                            {user.id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-3">
                                            {user.fullName || 'N/A'}
                                        </td>
                                        <td className="px-6 py-3">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-3">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-3">
                                            {formatDate(user.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No users found
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {pagination.totalPages > 1 && (
                    <Pagination className="mt-8">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setFilter({...filter, pageNumber: Math.max(filter.pageNumber - 1, 1)})}
                                    className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>

                            {renderPaginationItems()}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setFilter({...filter, pageNumber: Math.min(filter.pageNumber + 1, pagination.totalPages)})}
                                    className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>
        </MainLayout>
    );
}
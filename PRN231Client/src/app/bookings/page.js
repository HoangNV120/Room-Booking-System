'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';
import { ApiBooking } from '@/services/ApiBooking';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowUpDown, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function BookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isLoadingBooking, setIsLoadingBooking] = useState(false);
    
    // Filter state
    const [filter, setFilter] = useState({
        pageNumber: 1,
        pageSize: 10,
        startDateOrder: true,
        endDateOrder: null,
        status: 'all',
        paymentStatus: 'all'
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

    // Check if user is authenticated
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        const role = localStorage.getItem('role');

        if (!accessToken) {
            router.push('/login');
            return;
        }

        setIsAuthenticated(true);
        setUserRole(role || '');

    }, [router]);

    // Fetch bookings
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchBookings = async () => {
            setLoading(true);
            try {
                let response;
                
                const params = {
                    pageNumber: filter.pageNumber,
                    pageSize: filter.pageSize
                };

                // Only add these parameters if they are not "all"
                if (filter.status !== 'all') params.status = filter.status;
                if (filter.paymentStatus !== 'all') params.paymentStatus = filter.paymentStatus;
                if (filter.startDateOrder !== null) params.startDateOrder = filter.startDateOrder;
                if (filter.endDateOrder !== null) params.endDateOrder = filter.endDateOrder;

                if (userRole === 'Admin') {
                    response = await ApiBooking.getBookings(params);
                } else {
                    response = await ApiBooking.getMyBookings(params);
                }

                if (response.data && response.data.data) {
                    if (response.data.data.items) {
                        setBookings(response.data.data.items);
                        setPagination({
                            pageNumber: response.data.data.pageNumber,
                            pageSize: response.data.data.pageSize,
                            totalCount: response.data.data.totalCount,
                            totalPages: response.data.data.totalPages,
                            hasPreviousPage: response.data.data.hasPreviousPage,
                            hasNextPage: response.data.data.hasNextPage
                        });
                    } else {
                        setBookings(response.data.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching bookings:', error);
                toast.error('Canceled to load bookings');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [isAuthenticated, userRole, filter]);

    // Handle payment
    const handlePayment = async (bookingId) => {
        try {
            // Show loading toast
            toast.loading('Preparing payment...', { id: 'payment-loading' });

            const response = await ApiBooking.getPaymentUrl(bookingId);

            toast.dismiss('payment-loading');

            if (response.data && response.data.data && response.data.data.paymentUrl) {
                toast.success('Redirecting to payment page...');
                window.location.href = response.data.data.paymentUrl;
            } else {
                toast.error('Payment URL not available');
            }
        } catch (error) {
            toast.dismiss('payment-loading');
            console.error('Error getting payment URL:', error);
            toast.error(error.response?.data?.message || 'Failed to process payment');
        }
    };

    // Handle booking cancellation
    const handleCancelBooking = async (id) => {
        if (confirm('Are you sure you want to cancel this booking?')) {
            try {
                await ApiBooking.cancelBooking(id);
                toast.success('Booking cancelled successfully');

                // Refresh bookings list
                setFilter({...filter});
            } catch (error) {
                console.error('Error cancelling booking:', error);
                toast.error('Canceled to cancel booking');
            }
        }
    };

    // Toggle sort order for dates
    const toggleStartDateOrder = () => {
        setFilter({
            ...filter,
            startDateOrder: !filter.startDateOrder,
            endDateOrder: null,
            pageNumber: 1
        });
    };

    const toggleEndDateOrder = () => {
        setFilter({
            ...filter,
            endDateOrder: filter.endDateOrder === null ? true : !filter.endDateOrder,
            startDateOrder: null,
            pageNumber: 1
        });
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

    // Format date function
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
            case 'Confirmed':
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Confirmed</Badge>;
            case 'Canceled':
                return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Canceled</Badge>;
            case 'Cancelled':
                return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Get payment status badge color
    const getPaymentBadge = (status) => {
        switch (status) {
            case 'Paid':
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Paid</Badge>;
            case 'Unpaid':
                return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Unpaid</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (!isAuthenticated) {
        return null; // Don't render anything while checking auth
    }

    const handleViewBooking = async (bookingId) => {
        setIsLoadingBooking(true);
        try {
            const response = await ApiBooking.getBooking(bookingId);
            if (response.data && response.data.data) {
                setSelectedBooking(response.data.data);
                setIsViewDialogOpen(true);
            }
        } catch (error) {
            console.error('Error fetching booking details:', error);
            toast.error('Failed to load booking details');
        } finally {
            setIsLoadingBooking(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {userRole === 'Admin' ? 'All Bookings' : 'My Bookings'}
                    </h1>

                    <div className="flex flex-wrap gap-4">
                        <Select
                            value={filter.status}
                            onValueChange={(value) => setFilter({...filter, status: value, pageNumber: 1})}
                        >
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Confirmed">Confirmed</SelectItem>
                                <SelectItem value="Canceled">Canceled</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filter.paymentStatus}
                            onValueChange={(value) => setFilter({...filter, paymentStatus: value, pageNumber: 1})}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Payment Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Payment Statuses</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Unpaid">Unpaid</SelectItem>
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
                                {userRole === 'Admin' && (
                                    <>
                                        <th className="px-6 py-3">Username</th>
                                        <th className="px-6 py-3">Email</th>
                                    </>
                                )}
                                <th className="px-6 py-3 min-w-[220px]">Hotel / Room</th>
                                <th className="px-6 py-3 cursor-pointer" onClick={toggleStartDateOrder}>
                                    <div className="flex items-center">
                                        Check-in
                                        <ArrowUpDown className="ml-1 h-4 w-4" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer" onClick={toggleEndDateOrder}>
                                    <div className="flex items-center">
                                        Check-out
                                        <ArrowUpDown className="ml-1 h-4 w-4" />
                                    </div>
                                </th>
                                <th className="px-6 py-3">Price</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Payment</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={userRole === 'Admin' ? 7 : 8} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                        </div>
                                    </td>
                                </tr>
                            ) : bookings.length > 0 ? (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                                            {booking.id.substring(0, 8)}...
                                        </td>
                                        {userRole === 'Admin' && (
                                            <>
                                                <td className="px-6 py-3">{booking.userName || 'N/A'}</td>
                                                <td className="px-6 py-3">{booking.email || 'N/A'}</td>
                                            </>
                                        )}
                                        <td className="px-6 py-3 min-w-[220px]">
                                            <div>
                                                <Link
                                                    href={`/hotels/${booking.hotelId}`}
                                                    className="font-medium text-blue-600 hover:underline"
                                                >
                                                    {booking.hotelName}
                                                </Link>
                                            </div>
                                            <div className="flex flex-col space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                <span>Type: {booking.roomType}</span>
                                                {booking.roomName && <span>Name: {booking.roomName}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">{formatDate(booking.checkInDate)}</td>
                                        <td className="px-6 py-3">{formatDate(booking.checkOutDate)}</td>
                                        <td className="px-6 py-3 font-semibold">
                                            {booking.totalPrice.toLocaleString('vi-VN')} ₫
                                        </td>
                                        <td className="px-6 py-3">{getStatusBadge(booking.status)}</td>
                                        <td className="px-6 py-3">{getPaymentBadge(booking.paymentStatus)}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleViewBooking(booking.id)}
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>
                                                {userRole !== 'Admin' && booking.paymentStatus === 'Unpaid' && booking.status === 'Pending' && (
                                                    <>
                                                        <Button
                                                            onClick={() => handlePayment(booking.id)}
                                                            variant="outline"
                                                        >
                                                            Pay Now
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleCancelBooking(booking.id)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={userRole === 'Admin' ? 7 : 8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No bookings found
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

            {/* Booking Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                    </DialogHeader>

                    {selectedBooking ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Booking ID</h3>
                                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.id}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                    <p className="mt-1">{getStatusBadge(selectedBooking.status)}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Hotel / Room</h3>
                                <p className="mt-1 text-sm text-gray-900">
                                    {selectedBooking.hotelName} - {selectedBooking.roomType}
                                    {selectedBooking.roomName && ` (${selectedBooking.roomName})`}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Check-in</h3>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedBooking.checkInDate)}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Check-out</h3>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedBooking.checkOutDate)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Total Price</h3>
                                    <p className="mt-1 text-sm text-gray-900 font-semibold">
                                        {selectedBooking.totalPrice.toLocaleString('vi-VN')} ₫
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
                                    <p className="mt-1">{getPaymentBadge(selectedBooking.paymentStatus)}</p>
                                </div>
                            </div>

                            {selectedBooking.paymentStatus === 'Paid' && (
                                <div className="border-t pt-4 mt-4">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Details</h3>

                                    <div className="space-y-2 text-sm">
                                        {selectedBooking.paymentMethod && (
                                            <div className="grid grid-cols-2">
                                                <span className="text-gray-500">Method:</span>
                                                <span>{selectedBooking.paymentMethod}</span>
                                            </div>
                                        )}

                                        {selectedBooking.paymentTransactionId && (
                                            <div className="grid grid-cols-2">
                                                <span className="text-gray-500">Transaction ID:</span>
                                                <span>{selectedBooking.paymentTransactionId}</span>
                                            </div>
                                        )}

                                        {selectedBooking.paymentBankCode && (
                                            <div className="grid grid-cols-2">
                                                <span className="text-gray-500">Bank Code:</span>
                                                <span>{selectedBooking.paymentBankCode}</span>
                                            </div>
                                        )}

                                        {selectedBooking.paymentBankTranNo && (
                                            <div className="grid grid-cols-2">
                                                <span className="text-gray-500">Bank Tran No:</span>
                                                <span>{selectedBooking.paymentBankTranNo}</span>
                                            </div>
                                        )}

                                        {selectedBooking.paymentCardType && (
                                            <div className="grid grid-cols-2">
                                                <span className="text-gray-500">Card Type:</span>
                                                <span>{selectedBooking.paymentCardType}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-8 flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
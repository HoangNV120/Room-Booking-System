'use client';

import {useState, useEffect, useRef} from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import MainLayout from '@/components/layouts/MainLayout';
import { ApiHotel } from '@/services/ApiHotel';
import { ApiRoom } from '@/services/ApiRoom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HotelDetailPage() {
    const { id } = useParams();
    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [hotelLoading, setHotelLoading] = useState(true);
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [roomIdToEdit, setRoomIdToEdit] = useState(null);

    // Add Room Dialog state
    const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newRoom, setNewRoom] = useState({
        roomName: '',
        roomType: '',
        price: '',
        status: 'Available',
        image: null
    });
    const fileInputRef = useRef(null);

    // Filter and sort state
    const [filterType, setFilterType] = useState("all"); // Use "all" instead of empty string
    const [sortDescending, setSortDescending] = useState(true);

    // Pagination state
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 6,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false
    });

    const hotelImage = "https://vanangroup.com.vn/wp-content/uploads/2024/10/29df21cd740c64fda44d8e567685970b-e1729733600172.jpg";
    const roomImage = "https://media.architecturaldigest.com/photos/659d9cb42446c7171718ecf0/master/w_1600%2Cc_limit/atr.royalmansion-bedroom2-mr.jpg";

    // Check if user is admin
    useEffect(() => {
        const userRole = localStorage.getItem('role');
        setIsAdmin(userRole === 'Admin');
    }, []);
    
    // Fetch hotel details
    useEffect(() => {
        const fetchHotel = async () => {
            setHotelLoading(true);
            try {
                const response = await ApiHotel.getHotelById(id);
                if (response.data && response.data.data) {
                    setHotel(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching hotel:', error);
                toast.error('Failed to load hotel details');
            } finally {
                setHotelLoading(false);
            }
        };

        if (id) {
            fetchHotel();
        }
    }, [id]);

    // Function to open dialog in edit mode
    const openEditRoomDialog = (room) => {
        setIsEditMode(true);
        setRoomIdToEdit(room.id);
        setNewRoom({
            roomName: room.roomName || '',
            roomType: room.roomType,
            price: room.price.toString(),
            status: room.status,
            image: null
        });

        // Set image preview if available
        if (room.imageUrl) {
            setImagePreview(room.imageUrl);
        }

        setIsAddRoomDialogOpen(true);
    };

    // Function to open dialog in add mode
    const openAddRoomDialog = () => {
        setIsEditMode(false);
        setRoomIdToEdit(null);
        setNewRoom({
            roomName: '',
            roomType: '',
            price: '',
            status: 'Available',
            image: null
        });
        setImagePreview(null);
        setIsAddRoomDialogOpen(true);
    };

    // Fetch rooms when params change
    useEffect(() => {
        const fetchRooms = async () => {
            setRoomsLoading(true);
            try {
                // Prepare params
                const params = {
                    pageNumber: pageNumber,
                    pageSize: pageSize,
                    sortDescending: sortDescending
                };

                // Add roomType param only if not "all"
                if (filterType !== "all") {
                    params.roomType = filterType;
                }

                const response = await ApiRoom.getRoomsByHotelId(id, params);

                if (response.data && response.data.data) {
                    setRooms(response.data.data.items);
                    setPagination({
                        pageNumber: response.data.data.pageNumber,
                        pageSize: response.data.data.pageSize,
                        totalCount: response.data.data.totalCount,
                        totalPages: response.data.data.totalPages,
                        hasPreviousPage: response.data.data.hasPreviousPage,
                        hasNextPage: response.data.data.hasNextPage
                    });

                    // Extract unique room types for filter dropdown
                    if (roomTypes.length === 0 && response.data.data.items.length > 0) {
                        const types = [...new Set(response.data.data.items.map(room => room.roomType))];
                        setRoomTypes(types);
                    }
                }
            } catch (error) {
                console.error('Error fetching rooms:', error);
                toast.error('Failed to load rooms');
            } finally {
                setRoomsLoading(false);
            }
        };

        if (id) {
            fetchRooms();
        }
    }, [id, pageNumber, pageSize, sortDescending, filterType, roomTypes.length]);


    // Handle new room form input changes
    const handleRoomInputChange = (e) => {
        const { name, value } = e.target;
        setNewRoom({
            ...newRoom,
            [name]: value
        });
    };

    // Handle file input change
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewRoom({
                ...newRoom,
                image: file
            });

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    // Add cleanup for image preview URLs
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    // Handle form submission
    const handleRoomSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const roomData = {
                hotelId: id,
                roomName: newRoom.roomName,
                roomType: newRoom.roomType,
                price: parseFloat(newRoom.price),
                status: newRoom.status,
                image: newRoom.image
            };

            if (isEditMode && roomIdToEdit) {
                // Update existing room
                await ApiRoom.updateRoom(roomIdToEdit, roomData);
                toast.success('Room updated successfully');
            } else {
                // Create new room
                await ApiRoom.createRoom(roomData);
                toast.success('Room created successfully');
            }

            setIsAddRoomDialogOpen(false);
            setImagePreview(null);

            // Reset form and edit mode
            setNewRoom({
                roomName: '',
                roomType: '',
                price: '',
                status: 'Available',
                image: null
            });
            setIsEditMode(false);
            setRoomIdToEdit(null);

            // Refresh rooms list
            const fetchRoomsAfterSubmit = async () => {
                try {
                    const params = {
                        pageNumber: pageNumber,
                        pageSize: pageSize,
                        sortDescending: sortDescending
                    };
                    if (filterType !== "all") {
                        params.roomType = filterType;
                    }
                    const response = await ApiRoom.getRoomsByHotelId(id, params);
                    if (response.data && response.data.data) {
                        setRooms(response.data.data.items);
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
                    console.error('Error refreshing rooms:', error);
                }
            };
            fetchRoomsAfterSubmit();
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} room:`, error);
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} room`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const toggleSortOrder = () => {
        setSortDescending(!sortDescending);
    };

    const resetFilters = () => {
        setFilterType("all");  // Use "all" instead of empty string
        setSortDescending(true);
        setPageNumber(1);
    };

    // Generate pagination items
    const renderPaginationItems = () => {
        const items = [];
        const maxPagesToShow = 5;
        const totalPages = pagination.totalPages;

        let startPage = Math.max(1, pageNumber - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            items.push(
                <PaginationItem key="first">
                    <PaginationLink onClick={() => setPageNumber(1)}>1</PaginationLink>
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
                        isActive={i === pageNumber}
                        onClick={() => setPageNumber(i)}
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
                    <PaginationLink onClick={() => setPageNumber(totalPages)}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Hotel Details Section */}
                {hotelLoading ? (
                    <div className="animate-pulse">
                        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-6"></div>
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                ) : hotel ? (
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-8">
                        <div className="relative h-64 sm:h-80">
                            <Image
                                src={hotelImage}
                                alt={hotel.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{hotel.name}</h1>
                                <div className="flex items-center mt-2 sm:mt-0 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="ml-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        {hotel.rating ? hotel.rating.toFixed(1) : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                <span className="inline-block mr-2">📍</span>
                                {hotel.address}
                            </p>

                            <p className="text-gray-700 dark:text-gray-300">
                                {hotel.description || "No description available for this hotel."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center items-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-8">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Hotel not found</h2>
                            <p className="text-gray-500 dark:text-gray-400">The hotel you're looking for doesn't exist or has been removed.</p>
                        </div>
                    </div>
                )}

                {/* Rooms Section */}
                {hotel && (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
                                Available Rooms
                            </h2>
                            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
                                <Select
                                    value={filterType}
                                    onValueChange={setFilterType}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {roomTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={toggleSortOrder}
                                        title={sortDescending ? "Sort by: Price high to low" : "Sort by: Price low to high"}
                                    >
                                        <ArrowUpDown className="h-4 w-4" />
                                    </Button>

                                    <Select
                                        value={pageSize.toString()}
                                        onValueChange={(value) => {
                                            setPageSize(Number(value));
                                            setPageNumber(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-[70px]">
                                            <SelectValue placeholder="Show" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3">3</SelectItem>
                                            <SelectItem value="6">6</SelectItem>
                                            <SelectItem value="9">9</SelectItem>
                                            <SelectItem value="12">12</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {filterType !== "all" && (
                                    <Button
                                        variant="ghost"
                                        onClick={resetFilters}
                                        className="sm:self-end"
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </div>

                        {roomsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array(pageSize).fill().map((_, i) => (
                                    <Card key={i} className="overflow-hidden">
                                        <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                        <CardHeader className="p-4">
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4 mb-2"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full"></div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                                        </CardContent>
                                        <CardFooter className="flex justify-between p-4 border-t">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/4"></div>
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/4"></div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : rooms.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {rooms.map((room) => (
                                        <Card key={room.id} className="overflow-hidden transition-transform hover:shadow-lg">
                                            <div className="relative h-48">
                                                <Image
                                                    src={room.imageUrl ? room.imageUrl : roomImage}
                                                    alt={room.roomType}
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                />
                                                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                                                    {room.roomType}
                                                </div>

                                                {/* Admin Update Button */}
                                                {isAdmin && (
                                                    <div className="absolute top-2 left-2 flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="bg-white bg-opacity-75 hover:bg-opacity-100"
                                                            onClick={() => openEditRoomDialog(room)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <CardHeader className="p-4">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {room.roomName || `Room ${room.roomNumber || ''}`}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    {room.capacity} {room.capacity > 1 ? 'Persons' : 'Person'} • {room.beds} {room.beds > 1 ? 'Beds' : 'Bed'}
                                                </p>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                {/* Room content remains the same */}
                                            </CardContent>
                                            <CardFooter className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                                                <div className="font-semibold text-lg text-gray-900 dark:text-white">
                                                    {room.price.toLocaleString('vi-VN')} ₫
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                                        per night
                                                    </span>
                                                </div>
                                                {isAdmin ? (
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm">View</Button>
                                                        <Button size="sm" onClick={() => openEditRoomDialog(room)}>Update</Button>
                                                    </div>
                                                ) : (
                                                    <Button>Book Now</Button>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>

                                {pagination.totalPages > 1 && (
                                    <Pagination className="mt-8">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                                                    className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>

                                            {renderPaginationItems()}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setPageNumber(prev => Math.min(prev + 1, pagination.totalPages))}
                                                    className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </>
                        ) : (
                            <div className="flex justify-center items-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div className="text-center">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No rooms available</h2>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {filterType !== "all"
                                            ? `No ${filterType} rooms available. Try a different room type or clear filters.`
                                            : "No rooms are currently available for this hotel."}
                                    </p>
                                    {filterType !== "all" && (
                                        <Button
                                            variant="outline"
                                            onClick={resetFilters}
                                            className="mt-4"
                                        >
                                            Clear Filters
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
                {/* Add Room Dialog */}
                <Dialog open={isAddRoomDialogOpen} onOpenChange={(open) => {
                    setIsAddRoomDialogOpen(open);
                    if (!open) {
                        // Reset everything when closing
                        setImagePreview(null);
                        setIsEditMode(false);
                        setRoomIdToEdit(null);
                        setNewRoom({
                            roomName: '',
                            roomType: '',
                            price: '',
                            status: 'Available',
                            image: null
                        });
                    }
                }}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? 'Edit Room' : 'Add New Room'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRoomSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="roomName" className="text-right">Room Name</Label>
                                    <Input
                                        id="roomName"
                                        name="roomName"
                                        value={newRoom.roomName}
                                        onChange={handleRoomInputChange}
                                        className="col-span-3"
                                        placeholder="e.g., Room 101"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="roomType" className="text-right">Room Type</Label>
                                    <Input
                                        id="roomType"
                                        name="roomType"
                                        value={newRoom.roomType}
                                        onChange={handleRoomInputChange}
                                        className="col-span-3"
                                        placeholder="e.g., Deluxe, Standard"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="price" className="text-right">Price (VND)</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={newRoom.price}
                                        onChange={handleRoomInputChange}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="status" className="text-right">Status</Label>
                                    <Select
                                        value={newRoom.status}
                                        onValueChange={(value) => setNewRoom({...newRoom, status: value})}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Available">Available</SelectItem>
                                            <SelectItem value="Occupied">Occupied</SelectItem>
                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="image" className="text-right">Room Image</Label>
                                    <div className="col-span-3">
                                        <Input
                                            id="image"
                                            name="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            ref={fileInputRef}
                                            className="cursor-pointer"
                                        />

                                        {/* Image Preview */}
                                        {imagePreview && (
                                            <div className="mt-3 relative">
                                                <Image
                                                    src={imagePreview}
                                                    alt="Room Preview"
                                                    width={200}
                                                    height={120}
                                                    className="rounded-md object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                                    onClick={() => {
                                                        setImagePreview(null);
                                                        setNewRoom({...newRoom, image: null});
                                                        if (fileInputRef.current) {
                                                            fileInputRef.current.value = "";
                                                        }
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddRoomDialogOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? (isEditMode ? 'Updating...' : 'Adding...')
                                        : (isEditMode ? 'Update Room' : 'Add Room')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Add Room Button - Only show for admins */}
                {isAdmin && (
                    <div className="fixed bottom-6 right-6">
                        <Button
                            onClick={openAddRoomDialog}
                            className="rounded-full h-14 w-14 shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14"></path>
                            </svg>
                        </Button>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
'use client';

import { useState, useEffect } from 'react';
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

export default function HotelDetailPage() {
    const { id } = useParams();
    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [hotelLoading, setHotelLoading] = useState(true);
    const [roomsLoading, setRoomsLoading] = useState(true);

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
                                        <Card key={room.id} className="overflow-hidden transition-transform hover:scale-105">
                                            <div className="relative h-48">
                                                <Image
                                                    src={roomImage}
                                                    alt={room.roomType}
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                />
                                                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                                                    {room.roomType}
                                                </div>
                                            </div>
                                            <CardHeader className="p-4">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Room {room.roomNumber}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    {room.capacity} {room.capacity > 1 ? 'Persons' : 'Person'} • {room.beds} {room.beds > 1 ? 'Beds' : 'Bed'}
                                                </p>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                                                    {room.description || "Standard room with all essential amenities for a comfortable stay."}
                                                </p>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {room.hasWifi && (
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                                            WiFi
                                                        </span>
                                                    )}
                                                    {room.hasTV && (
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                                            TV
                                                        </span>
                                                    )}
                                                    {room.hasAirCon && (
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                                            Air Conditioning
                                                        </span>
                                                    )}
                                                    {room.hasBalcony && (
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                                            Balcony
                                                        </span>
                                                    )}
                                                </div>
                                            </CardContent>
                                            <CardFooter className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                                                <div className="font-semibold text-lg text-gray-900 dark:text-white">
                                                    {room.price.toLocaleString('vi-VN')} ₫
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                                        per night
                                                    </span>
                                                </div>
                                                <Button>Book Now</Button>
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
            </div>
        </MainLayout>
    );
}
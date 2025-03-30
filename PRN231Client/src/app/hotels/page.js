// src/app/hotels/page.js
'use client';

import {useState, useEffect, useRef} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/layouts/MainLayout';
import { ApiHotel } from '@/services/ApiHotel';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, SortDesc, SortAsc } from 'lucide-react';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";

export default function HotelsPage() {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [sortDescending, setSortDescending] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [totalPages, setTotalPages] = useState(0);
    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 6,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false
    });
    const defaultImageUrl = "https://vanangroup.com.vn/wp-content/uploads/2024/10/29df21cd740c64fda44d8e567685970b-e1729733600172.jpg";
    // Add Hotel Dialog state
    const [isAddHotelDialogOpen, setIsAddHotelDialogOpen] = useState(false);
    const [newHotel, setNewHotel] = useState({
        name: '',
        address: '',
        description: '',
        image: null
    });
    const [hotelImagePreview, setHotelImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const hotelFileInputRef = useRef(null);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Check if user is admin
    useEffect(() => {
        const userRole = localStorage.getItem('role');
        setIsAdmin(userRole === 'Admin');
    }, []);
// Open Add Hotel Dialog
    const openAddHotelDialog = () => {
        setNewHotel({
            name: '',
            address: '',
            description: '',
            image: null
        });
        setHotelImagePreview(null);
        setIsAddHotelDialogOpen(true);
    };

// Handle hotel form input changes
    const handleHotelInputChange = (e) => {
        const { name, value } = e.target;
        setNewHotel(prev => ({
            ...prev,
            [name]: value
        }));
    };

// Handle hotel image selection
    const handleHotelImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewHotel(prev => ({
                ...prev,
                image: file
            }));

            // Create image preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setHotelImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

// Handle hotel form submission
    const handleAddHotelSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!newHotel.name || !newHotel.address) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            // Use the ApiHotel service to create a new hotel
            await ApiHotel.createHotel(newHotel);

            toast.success('Hotel created successfully');
            setIsAddHotelDialogOpen(false);

            // Refresh hotel list
            fetchHotels();
        } catch (error) {
            console.error('Error creating hotel:', error);
            toast.error(error.response?.data?.message || 'Failed to create hotel');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Debounce search input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPageNumber(1); // Reset to first page when search changes
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const fetchHotels = async () => {
        setLoading(true);
        try {
            const response = await ApiHotel.getHotels({
                nameSearch: debouncedSearchTerm,
                sortDescending: sortDescending,
                pageNumber: pageNumber,
                pageSize: pageSize
            });

            if (response.data && response.data.data) {
                setHotels(response.data.data.items);
                setPagination({
                    pageNumber: response.data.data.pageNumber,
                    pageSize: response.data.data.pageSize,
                    totalCount: response.data.data.totalCount,
                    totalPages: response.data.data.totalPages,
                    hasPreviousPage: response.data.data.hasPreviousPage,
                    hasNextPage: response.data.data.hasNextPage
                });
                setTotalPages(response.data.data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching hotels:', error);
            toast.error('Failed to load hotels');
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch hotels when params change
    useEffect(() => {
        fetchHotels();
    }, [debouncedSearchTerm, sortDescending, pageNumber, pageSize]);

    const toggleSortOrder = () => {
        setSortDescending(!sortDescending);
    };

    // Generate pagination items
    const renderPaginationItems = () => {
        const items = [];
        const maxPagesToShow = 5;

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
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Hotels
                        </h1>
                        {isAdmin && (
                            <Button
                                onClick={openAddHotelDialog}
                                className="flex items-center gap-2 py-2 px-4 text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14"></path>
                                </svg>
                                Add Hotel
                            </Button>
                        )}
                    </div>
                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search hotels..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-full min-w-[200px]"
                            />
                        </div>
                        <div className="flex items-center">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleSortOrder}
                                className="mr-2"
                                title={sortDescending ? "Highest rating first" : "Lowest rating first"}
                            >
                                {sortDescending ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                            </Button>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(value) => {
                                    setPageSize(Number(value));
                                    setPageNumber(1);
                                }}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Page size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="6">6</SelectItem>
                                    <SelectItem value="9">9</SelectItem>
                                    <SelectItem value="12">12</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {loading ? (
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
                ) : hotels.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hotels.map((hotel) => (
                                <Card key={hotel.id} className="overflow-hidden transition-transform hover:scale-105">
                                    <div className="relative h-48">
                                        <Image
                                            src={hotel.imageUrl || defaultImageUrl}
                                            alt={hotel.name}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{hotel.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{hotel.address}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {hotel.description || "No description available"}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                                        <div className="flex items-center">
                                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="ml-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                 {hotel.rating ? hotel.rating.toFixed(1) : 'N/A'}
                                            </span>
                                        </div>
                                        <Link
                                            href={`/hotels/${hotel.id}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            View Details
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>

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
                                        onClick={() => setPageNumber(prev => Math.min(prev + 1, totalPages))}
                                        className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </>
                ) : (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No hotels found</h2>
                            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Hotel Dialog */}
            <Dialog open={isAddHotelDialogOpen} onOpenChange={(open) => {
                setIsAddHotelDialogOpen(open);
                if (!open) {
                    // Reset form when closing
                    setHotelImagePreview(null);
                    setNewHotel({
                        name: '',
                        address: '',
                        description: '',
                        image: null
                    });
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Hotel</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddHotelSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelName" className="text-right">Hotel Name *</Label>
                                <Input
                                    id="hotelName"
                                    name="name"
                                    value={newHotel.name}
                                    onChange={handleHotelInputChange}
                                    className="col-span-3"
                                    placeholder="Enter hotel name"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelAddress" className="text-right">Address *</Label>
                                <Input
                                    id="hotelAddress"
                                    name="address"
                                    value={newHotel.address}
                                    onChange={handleHotelInputChange}
                                    className="col-span-3"
                                    placeholder="Enter hotel address"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="hotelDescription" className="text-right pt-2">Description</Label>
                                <textarea
                                    id="hotelDescription"
                                    name="description"
                                    value={newHotel.description}
                                    onChange={handleHotelInputChange}
                                    rows="4"
                                    placeholder="Enter hotel description"
                                    className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelImage" className="text-right">Image</Label>
                                <div className="col-span-3">
                                    <Input
                                        id="hotelImage"
                                        name="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleHotelImageChange}
                                        ref={hotelFileInputRef}
                                        className="cursor-pointer"
                                    />

                                    {/* Image Preview */}
                                    {hotelImagePreview && (
                                        <div className="mt-3 relative">
                                            <Image
                                                src={hotelImagePreview}
                                                alt="Hotel Preview"
                                                width={200}
                                                height={120}
                                                className="rounded-md object-cover"
                                            />
                                            <button
                                                type="button"
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                                onClick={() => {
                                                    setHotelImagePreview(null);
                                                    setNewHotel({...newHotel, image: null});
                                                    if (hotelFileInputRef.current) {
                                                        hotelFileInputRef.current.value = "";
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
                                onClick={() => setIsAddHotelDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Hotel'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </MainLayout>
    );
}
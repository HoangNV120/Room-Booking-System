// src/app/home/page.js
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/layouts/MainLayout';
import { ApiHotel } from '@/services/ApiHotel';

export async function generateMetadata() {
    return {
        title: 'Hotel Booking - Find Your Perfect Stay',
        description: 'Discover the best hotels and rooms for your next adventure'
    };
}

export default async function HomePage() {
    const defaultImageUrl = "https://vanangroup.com.vn/wp-content/uploads/2024/10/29df21cd740c64fda44d8e567685970b-e1729733600172.jpg";

    const response = await ApiHotel.getHotels({
        pageNumber: 1,
        pageSize: 3,
        sortDescending: false
    });

    const hotels = response.data?.data?.items || [];

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="bg-blue-600 dark:bg-blue-800 rounded-lg overflow-hidden shadow-xl">
                    <div className="px-6 py-12 md:px-12 text-center md:text-left">
                        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                            Find Your Perfect Stay
                            <span className="block text-blue-200">With Our Hotel Booking Service</span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-lg text-blue-100 md:text-xl md:mt-5 md:max-w-3xl">
                            Discover the best hotels, rooms, and deals for your next adventure. Book with confidence and enjoy your stay.
                        </p>
                        <div className="mt-8 flex justify-center md:justify-start">
                            <div className="rounded-md shadow">
                                <Link href="/hotels" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                                    Browse Hotels
                                </Link>
                            </div>
                            <div className="ml-3 rounded-md shadow">
                                <Link href="/about" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900 md:py-4 md:text-lg md:px-10">
                                    Learn More
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Featured Hotels Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured Hotels</h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {hotels.length > 0 ? (
                            // Actual hotel data
                            hotels.map((hotel) => (
                                <div key={hotel.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-transform hover:scale-105">
                                    <div className="relative h-48">
                                        <Image
                                            src={hotel.imageUrl || defaultImageUrl}
                                            alt={hotel.name}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    </div>
                                    <div className="px-4 py-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{hotel.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{hotel.address}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {hotel.description || "No description available"}
                                        </p>
                                    </div>
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
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
                                    </div>
                                </div>
                            ))
                        ) : (
                            // No hotels found
                            <div className="col-span-3 text-center py-10">
                                <p className="text-gray-500 dark:text-gray-400">No hotels found. Check back later!</p>
                            </div>
                        )}
                    </div>

                    {hotels.length > 0 && (
                        <div className="mt-8 text-center">
                            <Link
                                href="/hotels"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                View All Hotels
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
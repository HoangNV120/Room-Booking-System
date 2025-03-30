'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';
import { ApiBooking } from '@/services/ApiBooking';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function CheckBookingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [booking, setBooking] = useState(null);
    const [paymentVerified, setPaymentVerified] = useState(false);

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                setIsLoading(true);

                // Extract all query parameters
                const params = {};
                searchParams.forEach((value, key) => {
                    params[key] = value;
                });

                // Check if we have the required parameters
                if (!params.vnp_ResponseCode) {
                    setError('Missing response parameters');
                    return;
                }

                // Process the payment callback
                const response = await ApiBooking.processPaymentCallback(params);

                if (response.data && response.data.data) {
                    // Set booking data from response
                    setBooking(response.data.data);

                    // Check booking status to determine if payment was successful
                    setPaymentVerified(response.data.data.status === 'Confirmed');
                } else {
                    setError('No booking information returned');
                }
            } catch (error) {
                console.error('Error verifying payment:', error);
                setError(error.response?.data?.message || 'Failed to verify payment');
            } finally {
                setIsLoading(false);
            }
        };

        verifyPayment();
    }, [searchParams]);

    // Format date for display
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch {
            return 'Invalid date';
        }
    };

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <Card className="shadow-lg">
                    {isLoading ? (
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Processing your payment...
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Please wait while we verify your transaction.
                            </p>
                        </CardContent>
                    ) : error ? (
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <XCircle className="h-16 w-16 text-red-500 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Payment Verification Failed
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
                        </CardContent>
                    ) : (
                        <>
                            <CardContent className="pt-8">
                                <div className="flex flex-col items-center mb-8">
                                    {paymentVerified ? (
                                        <>
                                            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                Payment Successful!
                                            </h2>
                                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                                Your booking has been confirmed.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-16 w-16 text-red-500 mb-4" />
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                Payment Verification Failed
                                            </h2>
                                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                                We couldn't verify your payment. Please try again or contact support.
                                            </p>
                                        </>
                                    )}
                                </div>

                                {booking && (
                                    <div className="mt-8 w-full border-t pt-6">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                            Booking Details
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Booking ID:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{booking.id}</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Hotel:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{booking.hotelName}</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Room Type:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{booking.roomType}</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Check-in Date:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{formatDate(booking.checkInDate)}</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Check-out Date:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{formatDate(booking.checkOutDate)}</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{booking.status}</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Total Price:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{booking.totalPrice?.toLocaleString('vi-VN')} ₫</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="flex justify-center pb-8">
                                <Link href="/bookings">
                                    <Button>View All Bookings</Button>
                                </Link>
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </MainLayout>
    );
}
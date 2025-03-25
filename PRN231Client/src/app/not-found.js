// src/app/not-found.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import MainLayout from '@/components/layouts/MainLayout';
import { Home, Hotel, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <h1 className="text-9xl font-bold text-blue-600 dark:text-blue-400">404</h1>

                    <div className="my-8 relative">
                        <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 absolute top-1/2 transform -translate-y-1/2"></div>
                        <div className="relative flex justify-center">
              <span className="bg-white dark:bg-gray-800 px-4 text-xl text-gray-500 dark:text-gray-400">
                Page Not Found
              </span>
                        </div>
                    </div>

                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                        Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or never existed.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild variant="default" size="lg" className="gap-2">
                            <Link href="/home">
                                <Home className="h-5 w-5" />
                                Back to Home
                            </Link>
                        </Button>

                        <Button asChild variant="outline" size="lg" className="gap-2">
                            <Link href="/hotels">
                                <Hotel className="h-5 w-5" />
                                Browse Hotels
                            </Link>
                        </Button>

                        <Button
                            variant="ghost"
                            size="lg"
                            className="gap-2"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
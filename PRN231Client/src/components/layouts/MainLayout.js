// src/components/layouts/MainLayout.js
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { toast } from "sonner";
import { ApiAuth } from '@/services/ApiAuth';

export default function MainLayout({ children }) {
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const userInfoCalledRef = useRef(false);

    // Handle clicks outside dropdown to close it
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            sessionStorage.setItem('previousPath', currentPath);
        }
    }, [pathname]);

    useEffect(() => {
        const checkAuth = () => {
            // Only call API if we haven't already called it
            if (userInfoCalledRef.current) return;

            const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

            if (!token) {
                setLoading(false);
                return;
            }

            userInfoCalledRef.current = true; // Mark as called

            ApiAuth.userInfo()
                .then(response => {
                    setUser(response.data.data);
                    localStorage.setItem('role' , response.data.data.role);
                    console.log("User info fetched successfully");
                })
                .catch(error => {
                    console.error('Error fetching user info:', error);
                })
                .finally(() => {
                    setLoading(false);
                });
        };

        if (typeof window !== 'undefined') {
            checkAuth();
        }
    }, []);

    const handleLogout = () => {
        const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        const request = { userId: userId, refreshToken: refreshToken };

        if (refreshToken && userId) {
            ApiAuth.logout(request)
                .then(() => {
                    // Clear tokens but keep rememberedEmail for auto-fill on next login
                    const rememberedEmail = localStorage.getItem('rememberedEmail');

                    // Clear localStorage tokens but keep email if remember me was checked
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('userId');

                    // Reset the userInfoCalledRef so we'll fetch again after login
                    userInfoCalledRef.current = false;

                    toast.success("Successfully logged out");
                    setUser(null);
                    setDropdownOpen(false);
                })
                .catch(err => {
                    console.error('Logout error:', err);

                    // Same cleanup as above on error
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('userId');

                    userInfoCalledRef.current = false;

                    setUser(null);
                    setDropdownOpen(false);
                });
        } else {
            // Clear tokens but keep rememberedEmail

            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');

            userInfoCalledRef.current = false;

            toast.success("Successfully logged out");
            setUser(null);
            setDropdownOpen(false);
        }
    };

    const isActiveLink = (path) => {
        if (path === '/home' && pathname === '/') return true;
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header with Navigation */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Image
                                    src="/next.svg"
                                    alt="Logo"
                                    width={120}
                                    height={30}
                                    className="dark:invert"
                                />
                            </div>
                            <nav className="ml-8 flex space-x-8">
                                <Link href="/home"
                                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                          isActiveLink('/home')
                                              ? "border-blue-500 text-gray-900 dark:text-white"
                                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white"
                                      }`}>
                                    Home
                                </Link>
                                <Link href="/hotels"
                                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                          isActiveLink('/hotels')
                                              ? "border-blue-500 text-gray-900 dark:text-white"
                                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white"
                                      }`}>
                                    Hotels
                                </Link>
                                <Link href="/rooms"
                                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                          isActiveLink('/rooms')
                                              ? "border-blue-500 text-gray-900 dark:text-white"
                                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white"
                                      }`}>
                                    Rooms
                                </Link>
                                <Link href="/payments"
                                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                          isActiveLink('/payments')
                                              ? "border-blue-500 text-gray-900 dark:text-white"
                                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white"
                                      }`}>
                                    Payments
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center">
                            {loading ? (
                                <div className="animate-pulse h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            ) : user ? (
                                <div
                                    className="relative"
                                    ref={dropdownRef}
                                    onMouseEnter={() => setDropdownOpen(true)}
                                >
                                    <button
                                        className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition duration-150 ease-in-out"
                                    >
                                        <Image
                                            src={user.avatarUrl || "/default-avatar.jpg"}
                                            alt="User Avatar"
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "/default-avatar.png";
                                            }}
                                        />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                                            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                                <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">{user.fullName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                            </div>
                                            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                                Your Profile
                                            </Link>
                                            <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                                Settings
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                            >
                                                Sign out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex space-x-4">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 dark:text-blue-400 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-800 shadow-inner">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} Hotel Booking Service. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
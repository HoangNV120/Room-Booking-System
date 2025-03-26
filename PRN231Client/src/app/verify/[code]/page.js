'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiAuth } from '@/services/ApiAuth';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';

export default function VerifyPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const code = params.code;
    const email = searchParams.get('email');

    useEffect(() => {
        const verifyEmail = async () => {
            if (!code || !email) {
                setError('Missing verification code or email');
                setVerifying(false);
                return;
            }

            try {
                await ApiAuth.verify({
                    email: email,
                    code: code
                });

                setSuccess(true);
                setVerifying(false);

                // Redirect to login after successful verification
                setTimeout(() => {
                    toast.success('Email verified successfully. You can now log in.');
                    router.push('/login');
                }, 2000);

            } catch (error) {
                console.error('Verification error:', error);
                setError(error.response?.data?.message || 'Verification failed. Please try again.');
                setVerifying(false);
            }
        };

        verifyEmail();
    }, [code, email, router]);

    return (
        <MainLayout>
            <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
                    Email Verification
                </h1>

                <div className="text-center">
                    {verifying && (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-10 h-10 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                            <p className="text-gray-600 dark:text-gray-300">Verifying your email...</p>
                        </div>
                    )}

                    {error && (
                        <div className="space-y-4">
                            <div className="text-red-500 dark:text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{error}</p>
                            <Button
                                onClick={() => router.push('/login')}
                                className="mt-4"
                            >
                                Go to Login
                            </Button>
                        </div>
                    )}

                    {success && (
                        <div className="space-y-4">
                            <div className="text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">Your email has been verified successfully!</p>
                            <p className="text-gray-600 dark:text-gray-400">Redirecting to login page...</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
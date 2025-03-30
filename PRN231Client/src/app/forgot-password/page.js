'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiAuth } from '@/services/ApiAuth';
import Turnstile from 'react-turnstile';
import {CardContent} from "@/components/ui/card";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [turnstileKey, setTurnstileKey] = useState(Date.now());
    const turnstileRef = useRef(null);
    const [error, setError] = useState('');


    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!turnstileToken) {
            setError('Please complete the CAPTCHA verification');
            return;
        }

        setIsSubmitting(true);

        try {
            const request = {
                // your existing request fields
                turnstileToken: turnstileToken,
                email: email
            };

            await ApiAuth.forgotPassword(request);
            toast.success('Password reset instructions sent to your email');
            router.push('/login');
        } catch (error) {
            // error handling
            setError(error.response?.data?.message || 'Failed to reset password');
            // Reset the captcha on error
            setTurnstileKey(Date.now());
            setTurnstileToken('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="flex min-h-[80vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Reset your password
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Enter your email address below and we'll send you instructions to reset your password.
                        </p>
                    </div>
                    <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded">
                            <p>{error}</p>
                        </div>
                    )}
                    <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                        <div className="space-y-4 rounded-md">
                            <div>
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="mt-1"
                                    placeholder="your.email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <Turnstile
                                key={turnstileKey}
                                sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY}
                                onVerify={(token) => setTurnstileToken(token)}
                                onExpire={() => setTurnstileToken('')}
                                onError={() => {
                                    setError('CAPTCHA verification failed. Please try again.');
                                    setTurnstileToken('');
                                }}
                                theme="light"
                                ref={turnstileRef}
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                            </Button>
                        </div>

                        <div className="text-center">
                            <Link
                                href="/login"
                                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Back to login
                            </Link>
                        </div>
                    </form>
                    </CardContent>
                </div>
            </div>
        </MainLayout>
    );
}
// src/app/login/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ApiAuth } from '@/services/ApiAuth';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Check for auth error message on component mount
    useEffect(() => {
        const hasToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

        if (hasToken) {
            toast.info("You are already logged in");

            // Try to get the referrer (the page that sent the user to login)
            const referrer = document.referrer;
            const isInternalReferrer = referrer && referrer.includes(window.location.host);
            const referrerPath = isInternalReferrer ? new URL(referrer).pathname : null;

            // Check if referrer is valid and not login/register
            if (referrerPath && !referrerPath.includes('/login') && !referrerPath.includes('/register')) {
                router.push(referrerPath);
            } else {
                // Try the stored previousPath as fallback
                const previousPath = sessionStorage.getItem('previousPath');
                if (previousPath && !previousPath.includes('/login') && !previousPath.includes('/register')) {
                    router.push(previousPath);
                } else {
                    // Default fallback
                    router.push('/home');
                }
            }
        } else {
            setCheckingAuth(false);
        }
    }, [router]);

    useEffect(() => {
        // Check if a remembered email exists and pre-fill it
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const validatePassword = (password) => {
        if (password.length < 8) {
            return "Password must be at least 8 characters";
        }
        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter";
        }
        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter";
        }
        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one number";
        }
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            return "Password must contain at least one special character";
        }
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validate password
        const passwordValidationError = validatePassword(password);
        if (passwordValidationError) {
            setPasswordError(passwordValidationError);
            setIsLoading(false);
            return;
        }

        const request = { email: email, password: password };

        ApiAuth.signIn(request)
            .then(response => {
                handleLoginSuccess(response.data);
            })
            .catch(err => {
                // Handle error from axios
                setError(err.response?.data?.message || 'Login failed');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleGoogleLoginSuccess = (credentialResponse) => {
        setIsLoading(true);
        setError('');

        // Send idToken instead of credential as required by backend
        const request = {
            idToken: credentialResponse.credential
        };

        ApiAuth.googleLogin(request)
            .then(response => {
                handleLoginSuccess(response.data);
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Google login failed');
                console.error('Google login error:', err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleLoginSuccess = (data) => {
        // Store tokens in localStorage or sessionStorage based on rememberMe
        if (rememberMe) {
            localStorage.setItem('accessToken', data.data.accessToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            localStorage.setItem('userId', data.data.userId);
            localStorage.setItem('rememberMe', 'true');
            // Store email for auto-fill next time
            if (email) {
                localStorage.setItem('rememberedEmail', email);
            }
        } else {
            sessionStorage.setItem('accessToken', data.data.accessToken);
            sessionStorage.setItem('refreshToken', data.data.refreshToken);
            sessionStorage.setItem('userId', data.data.userId);
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
        }

        toast.success("Successfully logged in!");
        router.push('/home');
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
                <Link
                    href="/home"
                    className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4 self-start ml-4 sm:ml-8"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    <span>Back to Home</span>
                </Link>
                {checkingAuth ? (
                        <div className="flex flex-col items-center justify-center">
                            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-300">Checking authentication...</p>
                        </div>
                    ) : (
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-2">
                            <Image
                                src="/next.svg"
                                alt="Logo"
                                width={120}
                                height={30}
                                className="dark:invert"
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                        <CardDescription>Sign in to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded">
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="name@company.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setPasswordError(validatePassword(e.target.value));
                                        }}
                                        required
                                        className={passwordError ? "border-red-500" : ""}
                                        placeholder="••••••••"
                                    />
                                    {passwordError && (
                                        <p className="text-sm text-red-500">{passwordError}</p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onCheckedChange={setRememberMe}
                                    />
                                    <Label
                                        htmlFor="rememberMe"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Remember me
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || passwordError}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Signing in...
                                        </>
                                    ) : "Sign in"}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-6 relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 w-full">
                            <GoogleLogin
                                onSuccess={handleGoogleLoginSuccess}
                                onError={() => {
                                    console.error('Google login failed');
                                    setError('Google login failed. Please try again.');
                                }}
                                theme="outline"
                                size="large"
                                width="100%"
                                text="signin_with"
                                shape="rectangular"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/register"
                                className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </Card> )}
            </div>
        </GoogleOAuthProvider>
    );
}
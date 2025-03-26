// src/app/register/page.js
'use client';

import { useState } from 'react';
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
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function Register() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

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
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return "Password must contain at least one special character";
        }
        return "";
    };

    const validateConfirmPassword = (confirmPassword) => {
        if (confirmPassword !== password) {
            return "Passwords do not match";
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

        // Validate confirm password
        const confirmPasswordValidationError = validateConfirmPassword(confirmPassword);
        if (confirmPasswordValidationError) {
            setConfirmPasswordError(confirmPasswordValidationError);
            setIsLoading(false);
            return;
        }

        // Only send fullName, email, and password to the API
        const request = {
            fullName: fullName,
            email: email,
            password: password
        };

        ApiAuth.signUp(request)
            .then(response => {
                toast.success("Registration successful! A verification email has been sent. Please verify your email to activate your account.");
                router.push('/login');
            })
            .catch(err => {
                // Handle error from axios
                setError(err.response?.data?.message || 'Registration failed');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleGoogleSignupSuccess = (credentialResponse) => {
        setIsLoading(true);
        setError('');

        const request = {
            idToken: credentialResponse.credential
        };

        ApiAuth.googleLogin(request)
            .then(response => {
                // Same logic as login page
                if (response.data && response.data.data) {
                    const { accessToken, refreshToken, userId } = response.data.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    localStorage.setItem('userId', userId);
                    
                }
                toast.success("Successfully registered with Google!");
                router.push('/home');
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Google sign-up failed');
                console.error('Google sign-up error:', err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
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
                    <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                    <CardDescription>Enter your information to get started</CardDescription>
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
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>

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
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setPasswordError(validatePassword(e.target.value));
                                        if (confirmPassword) {
                                            setConfirmPasswordError(validateConfirmPassword(confirmPassword));
                                        }
                                    }}
                                    required
                                    className={passwordError ? "border-red-500" : ""}
                                    placeholder="••••••••"
                                />
                                {passwordError && (
                                    <p className="text-sm text-red-500">{passwordError}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setConfirmPasswordError(validateConfirmPassword(e.target.value));
                                    }}
                                    required
                                    className={confirmPasswordError ? "border-red-500" : ""}
                                    placeholder="••••••••"
                                />
                                {confirmPasswordError && (
                                    <p className="text-sm text-red-500">{confirmPasswordError}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || passwordError || confirmPasswordError}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing up...
                                    </>
                                ) : "Sign up"}
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
                            onSuccess={handleGoogleSignupSuccess}
                            onError={() => {
                                console.error('Google sign-up failed');
                                setError('Google sign-up failed. Please try again.');
                            }}
                            theme="outline"
                            size="large"
                            width="100%"
                            text="signup_with"
                            shape="rectangular"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
        </GoogleOAuthProvider>
    );
}
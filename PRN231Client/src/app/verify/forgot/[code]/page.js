'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiAuth } from '@/services/ApiAuth';

export default function ResetPasswordPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
    });
    const [passwordsMatch, setPasswordsMatch] = useState(true);

    useEffect(() => {
        const code = params.code;
        const email = searchParams.get('email');

        if (!code || !email) {
            toast.error('Invalid reset link');
            router.push('/login');
            return;
        }

        setFormData(prev => ({
            ...prev,
            email: email,
            code: code
        }));
    }, [params.code, searchParams, router]);

    const checkPasswordRequirements = (password) => {
        setPasswordRequirements({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
        });
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setFormData({
            ...formData,
            newPassword
        });
        checkPasswordRequirements(newPassword);
        setPasswordsMatch(formData.confirmPassword === newPassword);
    };

    const handleConfirmPasswordChange = (e) => {
        const confirmPassword = e.target.value;
        setFormData({
            ...formData,
            confirmPassword
        });
        setPasswordsMatch(confirmPassword === formData.newPassword);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        // Check if all password requirements are met
        const allRequirementsMet = Object.values(passwordRequirements).every(req => req);
        if (!allRequirementsMet) {
            toast.error('Password does not meet all requirements');
            return;
        }

        setIsSubmitting(true);

        try {
            await ApiAuth.resetPassword({
                email: formData.email,
                code: formData.code,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });

            toast.success('Your password has been reset successfully');
            router.push('/login');
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error(error.response?.data?.message || 'Failed to reset password. The link may be expired or invalid.');
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
                            Enter your new password below
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    required
                                    className="mt-1"
                                    value={formData.newPassword}
                                    onChange={handlePasswordChange}
                                />

                                <div className="mt-2 text-xs space-y-1">
                                    <p className={passwordRequirements.length ? "text-green-500" : "text-gray-500"}>
                                        ✓ At least 8 characters
                                    </p>
                                    <p className={passwordRequirements.uppercase ? "text-green-500" : "text-gray-500"}>
                                        ✓ At least one uppercase letter
                                    </p>
                                    <p className={passwordRequirements.lowercase ? "text-green-500" : "text-gray-500"}>
                                        ✓ At least one lowercase letter
                                    </p>
                                    <p className={passwordRequirements.number ? "text-green-500" : "text-gray-500"}>
                                        ✓ At least one number
                                    </p>
                                    <p className={passwordRequirements.special ? "text-green-500" : "text-gray-500"}>
                                        ✓ At least one special character
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className={`mt-1 ${!passwordsMatch && formData.confirmPassword ? "border-red-500" : ""}`}
                                    value={formData.confirmPassword}
                                    onChange={handleConfirmPasswordChange}
                                />
                                {!passwordsMatch && formData.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting || !passwordsMatch}
                            >
                                {isSubmitting ? 'Resetting...' : 'Reset Password'}
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
                </div>
            </div>
        </MainLayout>
    );
}
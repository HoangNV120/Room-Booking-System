import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';

export async function generateMetadata() {
    return {
        title: 'About Us - Hotel Booking Service',
        description: 'Learn about our hotel booking platform, our mission, and our team'
    };
}

export default async function AboutPage() {
    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="relative rounded-xl overflow-hidden h-80 mb-12">
                    <Image
                        src="https://res.cloudinary.com/demo/image/upload/v1624388128/samples/landscapes/architecture-signs.jpg"
                        alt="Hotel Architecture"
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent flex items-center">
                        <div className="px-8 md:px-12">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">About Us</h1>
                            <p className="max-w-xl text-blue-100 text-lg md:text-xl">
                                Discover our story and mission to provide exceptional hotel accommodation services worldwide
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mission Section */}
                <div className="mb-16">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="md:w-1/2">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Mission</h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                Our mission is to provide travelers with a seamless and enjoyable hotel booking experience. We believe that finding the perfect accommodation should be as exciting as the journey itself.
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                We partner with the finest hotels across the globe to offer a diverse selection of accommodations that cater to every traveler's needs and preferences, from luxury resorts to cozy boutique hotels.
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                                With our platform, travelers can explore, compare, and book with confidence, knowing they're getting the best value and service every time.
                            </p>
                        </div>
                        <div className="md:w-1/2 relative h-64 rounded-lg overflow-hidden">
                            <Image
                                src="https://dq5r178u4t83b.cloudfront.net/wp-content/uploads/sites/125/2020/06/15182916/Sofitel-Dubai-Wafi-Luxury-Room-Bedroom-Skyline-View-Image1_WEB.jpg"
                                alt="Hotel Room"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Values Section */}
                <div className="py-8 bg-gray-50 dark:bg-gray-800 rounded-xl px-6 mb-16">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Our Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Trust</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                We build trust through transparency, honest reviews, and reliable information about all our listed properties.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Efficiency</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Our streamlined booking process saves you time and effort, getting you from search to confirmed reservation in minutes.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Customer Focus</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                We prioritize your needs and preferences, offering personalized recommendations and 24/7 customer support.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
                    <div className="md:w-1/2 order-2 md:order-1">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Get In Touch</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Have questions about our service or need assistance with your booking? Our dedicated team is ready to help you make the most of your travel experience.
                        </p>
                        <Link href="/contact" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                            Contact Us
                        </Link>
                    </div>
                    <div className="md:w-1/2 relative h-64 rounded-lg overflow-hidden order-1 md:order-2">
                        <Image
                            src="https://offloadmedia.feverup.com/secretdubai.co/wp-content/uploads/2023/07/07174621/shutterstock_151616084.jpg"
                            alt="City Skyline"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
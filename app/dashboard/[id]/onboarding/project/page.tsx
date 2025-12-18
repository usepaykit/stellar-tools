'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ImagePlus, X } from 'lucide-react';

export default function OnboardingProject() {
    const params = useParams();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const id = params?.id as string;

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // const logoSrc = resolvedTheme === 'dark' ? '/images/logo-light.png' : '/images/logo-dark.png';

    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');

    const [billingCycle, setBillingCycle] = useState<'one-time' | 'recurring'>('recurring');
    const [recurringInterval, setRecurringInterval] = useState('1');
    const [recurringPeriod, setRecurringPeriod] = useState('month');
    const [pricingModel, setPricingModel] = useState('fixed');
    const [price, setPrice] = useState('10.00');

    // Media preview state
    const [imagePreviews, setImagePreviews] = useState<{ url: string; file: File }[]>([]);

    const handleSetup = () => {
        if (!productName.trim()) {
            alert('Please enter a product name.');
            return;
        }
        console.log('Product setup:', {
            name: productName,
            description: productDescription,
            billingCycle,
            recurringInterval,
            recurringPeriod,
            pricingModel,
            price
        });
        // Navigate to next step or dashboard
        // router.push(`/dashboard/${id}/...`);
    };

    const handleSkip = () => {
        // Navigate to dashboard or next step
        router.push(`/dashboard/${id}`);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newPreviews: { url: string; file: File }[] = [];

            Array.from(files).forEach((file) => {
                // Check file size (10MB limit)
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File ${file.name} exceeds 10MB limit.`);
                    return;
                }

                // Create preview URL
                const previewUrl = URL.createObjectURL(file);
                newPreviews.push({ url: previewUrl, file });
            });

            setImagePreviews((prev) => [...prev, ...newPreviews]);
            console.log('Files selected:', files);
        }
    };

    const removeImage = (index: number) => {
        setImagePreviews((prev) => {
            // Revoke the object URL to free memory
            URL.revokeObjectURL(prev[index].url);
            return prev.filter((_, i) => i !== index);
        });
    };

    // Cleanup object URLs on unmount
    React.useEffect(() => {
        return () => {
            imagePreviews.forEach((preview) => {
                URL.revokeObjectURL(preview.url);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[600px] flex flex-col items-center">

                {mounted && (
                    <div className="mb-8">
                        <Image
                            src="/images/logo-light.png"
                            alt="Stellar Tools logo"
                            width={50}
                            height={50}
                            className="object-contain rounded-md"
                        />
                    </div>
                )}

                <h1 className="text-3xl font-normal tracking-tight mb-2 text-foreground text-center">
                    Your first product
                </h1>

                <p className="text-muted-foreground text-base mb-8 text-center">
                    Setup your first digital product to get started.
                </p>

                <div className="w-full space-y-6">
                    <Card>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-normal text-foreground">
                                    Product Information
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Basic product information which helps identify the product
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="productName">
                                    Name
                                </Label>
                                <Input
                                    id="productName"
                                    type="text"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="productDescription">
                                        Description
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        Markdown format
                                    </span>
                                </div>
                                <Textarea
                                    id="productDescription"
                                    value={productDescription}
                                    onChange={(e) => setProductDescription(e.target.value)}
                                    placeholder="Enter product description"
                                    className="min-h-[120px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media Section */}
                    <Card>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-normal text-foreground">
                                    Media
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Enhance the product page with medias, giving the customers a better idea of the product
                                </p>
                            </div>

                            <div className="space-y-4">
                                {imagePreviews.length > 0 ? (
                                    /* Image Previews - Replaces upload area */
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {imagePreviews.map((preview, index) => (
                                            <div
                                                key={index}
                                                className="relative group aspect-video rounded-lg overflow-hidden border border-input bg-muted"
                                            >
                                                <Image
                                                    src={preview.url}
                                                    alt={`Preview ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background border border-input opacity-0 group-hover:opacity-100 transition-opacity"
                                                    aria-label="Remove image"
                                                >
                                                    <X className="w-4 h-4 text-foreground" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Upload Area - Only shown when no images */
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="mediaUpload"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="border-2 border-dashed border-input rounded-lg p-12 flex flex-col items-center justify-center text-center hover:bg-accent/50 transition-colors">
                                            <ImagePlus className="w-12 h-12 text-muted-foreground mb-4" />
                                            <p className="text-sm font-medium text-foreground mb-1">
                                                Add product media
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Up to 10MB each. 16:9 ratio recommended for optimal display.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Section */}
                    <Card>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-normal text-foreground">
                                    Pricing
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Set your billing cycle and pricing model
                                </p>
                            </div>

                            {/* Billing Cycle */}
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="one-time"
                                        name="billingCycle"
                                        value="one-time"
                                        checked={billingCycle === 'one-time'}
                                        onChange={(e) => setBillingCycle(e.target.value as 'one-time' | 'recurring')}
                                        className="w-4 h-4 text-primary border-input focus:ring-primary focus:ring-2"
                                    />
                                    <Label htmlFor="one-time" className="font-normal cursor-pointer">
                                        One-time purchase
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="recurring"
                                        name="billingCycle"
                                        value="recurring"
                                        checked={billingCycle === 'recurring'}
                                        onChange={(e) => setBillingCycle(e.target.value as 'one-time' | 'recurring')}
                                        className="w-4 h-4 text-primary border-input focus:ring-primary focus:ring-2"
                                    />
                                    <Label htmlFor="recurring" className="font-normal cursor-pointer">
                                        Recurring subscription
                                    </Label>
                                </div>
                            </div>

                            {/* Recurring Subscription Details */}
                            {billingCycle === 'recurring' && (
                                <div className="flex items-center gap-2 pl-6">
                                    <span className="text-sm text-foreground">Every</span>
                                    <Input
                                        type="number"
                                        value={recurringInterval}
                                        onChange={(e) => setRecurringInterval(e.target.value)}
                                        className="w-20"
                                        min="1"
                                    />
                                    <select
                                        value={recurringPeriod}
                                        onChange={(e) => setRecurringPeriod(e.target.value)}
                                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="day">day</option>
                                        <option value="week">week</option>
                                        <option value="month">month</option>
                                        <option value="year">year</option>
                                    </select>
                                </div>
                            )}

                            {/* Pricing Model */}
                            <div className="space-y-2">
                                <Label htmlFor="pricingModel">
                                    Pricing Model
                                </Label>
                                <select
                                    id="pricingModel"
                                    value={pricingModel}
                                    onChange={(e) => setPricingModel(e.target.value)}
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="fixed">Fixed price</option>
                                    <option value="tiered">Tiered pricing</option>
                                    <option value="usage">Usage-based</option>
                                </select>
                            </div>

                            {/* Price Input */}
                            <div className="space-y-2">
                                <Label htmlFor="price">
                                    Price
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        id="price"
                                        type="text"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="pl-7"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Add Additional Price Button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    // Handle adding additional price
                                    console.log('Add additional price');
                                }}
                            >
                                Add Additional Price
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <Button
                            onClick={handleSetup}
                            className="flex-1"
                            size="lg"
                        >
                            Setup →
                        </Button>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Link
                            href={`/dashboard/${id}/configure`}
                            className="hover:text-foreground transition-colors"
                        >
                            Configure manually
                        </Link>
                        <span className="text-foreground">·</span>
                        <button
                            onClick={handleSkip}
                            className="hover:text-foreground transition-colors cursor-pointer"
                        >
                            Skip onboarding
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
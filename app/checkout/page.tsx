'use client';

import { TextField } from '@/components/input-picker';
import { PhoneNumberPicker } from '@/components/phone-number-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { BeautifulQRCode } from '@beautiful-qr-code/react';
import { X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

const checkoutSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    phoneNumber: z.object({
        number: z.string().min(1, 'Phone number is required'),
        countryCode: z.string().min(1, 'Country code is required'),
    }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
    const [showBanner, setShowBanner] = useState(true);
    const monthlyPrice = 200;

    const form = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            email: '',
            phoneNumber: {
                number: '',
                countryCode: 'US',
            },
        },
        mode: 'onChange',
    });

    const { formState: { isValid } } = form;
    const email = useWatch({ control: form.control, name: 'email' });
    const phoneNumber = useWatch({ control: form.control, name: 'phoneNumber' });
    const isFormValid = isValid && email && phoneNumber?.number;


    const qrCodeData = `web+stellar:pay?destination=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&amount=${monthlyPrice}&memo=Monthly%20Subscription&memo_type=text`;

    return (
        <div>
            {showBanner && (
                <div className="w-full mx-auto relative">
                    <div className="bg-primary bg-no-repeat bg-cover bg-center p-4 rounded-none text-center">
                        <div className="flex flex-wrap justify-center items-center gap-2 relative">
                            <p className="inline-block text-primary-foreground text-sm">
                                Enter your email and phone number to continue, or scan the QR code to pay directly.
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowBanner(false)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground hover:text-primary-foreground/70 hover:bg-primary-foreground/10 h-6 w-6"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8">
                <div className="w-full max-w-6xl space-y-6">
              

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
              
                        <div className="p-6 rounded-lg border border-border space-y-4">
                            <div className="space-y-3">
                                <h1 className="text-2xl font-semibold text-foreground">
                                    Unlimited Monthly Subscription
                                </h1>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Unlimited Monthly offers a flexible subscription that unlocks premium features 
                                    like unlimited transactions, priority support, and advanced analytics. 
                                    Billed monthly and can be canceled anytime.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <p className="text-2xl font-semibold text-foreground">
                                    {monthlyPrice} XLM <span className="text-base font-normal">/ month</span>
                                </p>
                            </div>
                        </div>
                        <div className="relative w-full rounded-xl overflow-hidden border border-border">
                            <Image
                                src="/images/checkoutimage.png"
                                alt="Unlimited Monthly Subscription"
                                width={800}
                                height={600}
                                className="w-full h-auto object-contain object-top-left"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>

                    </div>

                    <Card className="shadow-none">
                        <CardContent className="pt-6 pb-6 space-y-6">
                            <form className="space-y-6" onSubmit={form.handleSubmit(() => {})}>
                                {/* Email */}
                                <Controller
                                    control={form.control}
                                    name="email"
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            id="email"
                                            type="email"
                                            value={field.value}
                                            onChange={field.onChange}
                                            label="Email"
                                            error={error?.message || null}
                                            className="w-full shadow-none"
                                            placeholder="you@example.com"
                                        />
                                    )}
                                />

                                <Controller
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field, fieldState: { error } }) => (
                                        <PhoneNumberPicker
                                            id="phone"
                                            value={field.value}
                                            onChange={field.onChange}
                                            label="Phone number"
                                            error={error?.message || null}
                                            groupClassName="w-full shadow-none"
                                        />
                                    )}
                                />

                                {/* Payment Methods */}
                            <div className="space-y-6">
                                    {/* QR Code Payment */}
                                    <div className="relative">
                                        <Card className={`shadow-none! border-2 border-dashed border-border bg-muted/30 transition-all duration-300 ${!isFormValid ? 'blur-sm opacity-50' : ''}`}>
                                            <CardContent className="p-0 flex flex-col items-center justify-center space-y-4 shadow-none">
                                                <div className="bg-white rounded-lg flex items-center justify-center border border-border p-1">
                                                    <BeautifulQRCode
                                                        data={qrCodeData}
                                                        foregroundColor="#000000"
                                                        backgroundColor="#ffffff"
                                                        radius={1}
                                                        padding={1}
                                                        className='size-50'
                                                    />
                                        </div>
                                    </CardContent>
                                </Card>
                                        {!isFormValid && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    
                                            </div>
                                        )}
                                    </div>

                                    {/* OR Separator */}
                                <div className="flex items-center gap-4">
                                    <Separator className="flex-1" />
                                    <span className="text-sm text-muted-foreground font-medium">OR</span>
                                    <Separator className="flex-1" />
                                </div>

                                    {/* Wallet Payment */}
                                <Button
                                    type="button"
                                        variant="default"
                                    className="w-full h-12 shadow-none"
                                    size="lg"
                                        onClick={() => {
                                            if (!isFormValid) {
                                                form.trigger();
                                                toast.error('Please fill in your email and phone number to continue.');
                                            } else {
                                                // Handle wallet connection
                                                console.log('Connecting wallet...');
                                            }
                                        }}
                                    >
                                        Continue with Wallet 
                                </Button>
                                </div>

                                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                                    This order is facilitated by Stellar Tools.
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>

        
                <footer className="mt-12 pt-8 border-t border-border">
                    <div className="space-y-6">
                     


                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>© {new Date().getFullYear()} Stellar Tools. All rights reserved.</span>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
                            <Link
                                href="/terms"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Terms of Service
                            </Link>
                            <Link
                                href="/privacy"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                href="/refund"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Refund Policy
                            </Link>
                            <Link
                                href="/support"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Support
                            </Link>
                        </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Powered by</span>
                                <Image
                                    src="/images/integrations/stellar-official.png"
                                    alt="Stellar"
                                    width={20}
                                    height={20}
                                    className="object-contain"
                                />
                                <span className="text-xs font-medium text-foreground">Stellar</span>
                            </div>
                        </div>
                    </div>
                </footer>
                </div>
            </div>
        </div>
    );
}


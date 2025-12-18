'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

export default function CreateOrganization() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isSlugEdited, setIsSlugEdited] = useState(false);
    const [agreed, setAgreed] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // const logoSrc = resolvedTheme === 'dark' ? '/images/logo-light.png' : '/images/logo-dark.png';

    const generatedSlug = useMemo(() => {
        if (isSlugEdited) return slug;
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }, [name, isSlugEdited, slug]);

    React.useEffect(() => {
        if (!isSlugEdited) {
            setSlug(generatedSlug);
        }
    }, [generatedSlug, isSlugEdited]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            alert('Please agree to the terms to continue.');
            return;
        }
        if (!slug || !name) {
            alert('Please fill in all required fields.');
            return;
        }
        console.log('Creating Organization:', { name, slug });
        router.push(`/dashboard/${slug}/onboarding/project`);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[440px] flex flex-col items-center">

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

                {/* Header Text */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight mb-2 text-foreground">
                        Let&apos;s get you started
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        You&apos;ll be up and running in no time
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-6">

                    {/* Card 1: Organization Details */}
                    <Card>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="orgName">
                                    Organization Name
                                </Label>
                                <Input
                                    id="orgName"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Acme Inc."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="orgSlug">
                                    Organization Slug
                                </Label>
                                <Input
                                    id="orgSlug"
                                    type="text"
                                    value={slug}
                                    onChange={(e) => {
                                        setSlug(e.target.value);
                                        setIsSlugEdited(true);
                                    }}
                                    placeholder="acme-inc"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Terms & Agreement */}

                    <div className="flex items-start gap-3">
                        <div className="flex items-center h-6">
                            <Checkbox
                                id="terms"
                                checked={agreed}
                                onCheckedChange={(checked) => setAgreed(checked === true)}
                                className="w-5 h-5 border border-primary text-primary focus:ring-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="cursor-pointer text-foreground" id="terms-label">
                                I understand the restrictions above and agree to Paykit&apos;s terms
                            </span>
                        </div>
                    </div>


                    {/* Submit Action */}
                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                    >
                        Create
                    </Button>

                </form>
            </div>
        </div>
    );
}

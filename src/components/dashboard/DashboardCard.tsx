import React from "react";
import Button from "@/components/ui/Button.tsx";

export const DashboardCard = (
    {
        title,
        description,
        icon: Icon,
        linkText,
        imageUrl,
        additionalContent
    }: {
        title: string;
        description: string;
        icon: React.ElementType;
        linkText?: string;
        linkUrl?: string;
        imageUrl: string;
        additionalContent?: React.ReactNode;
    }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
        <div className="p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-primary-500"/>
                    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                </div>
                <p className="text-gray-600">{description}</p>
                {additionalContent}

                {linkText &&
                    <Button>
                        {linkText}
                    </Button>
                }


            </div>
            <div className="md:w-1/3">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-48 md:h-full object-cover rounded-lg"
                />
            </div>
        </div>
    </div>
);
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const accountDetailsSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  category: z.string().min(1, 'Category is required'),
  platform: z.string().min(1, 'Platform is required'),
  price_usd: z
    .number()
    .min(1, 'Price must be at least $0.01')
    .transform((val) => Math.round(val * 100)), // Convert to cents
  description: z.string().optional(),
  monthly_earnings: z
    .number()
    .min(0)
    .optional()
    .transform((val) => (val ? Math.round(val * 100) : undefined)), // Convert to cents
  account_age_months: z.number().min(0).optional(),
  rating: z.string().optional(),
});

export type AccountDetailsFormData = z.infer<typeof accountDetailsSchema>;

interface AccountDetailsFormProps {
  defaultValues?: Partial<AccountDetailsFormData>;
  onSubmit: (data: AccountDetailsFormData) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  'Academic',
  'Article',
  'Translation',
  'Transcription',
  'Data Entry',
  'Other',
];

const PLATFORMS = [
  'Upwork',
  'Fiverr',
  'Freelancer',
  'PeoplePerHour',
  'Other',
];

export function AccountDetailsForm({
  defaultValues,
  onSubmit,
  onBack,
  isLoading,
}: AccountDetailsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AccountDetailsFormData>({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: {
      price_usd: defaultValues?.price_usd
        ? defaultValues.price_usd / 100
        : undefined,
      monthly_earnings: defaultValues?.monthly_earnings
        ? defaultValues.monthly_earnings / 100
        : undefined,
      ...defaultValues,
    },
  });

  const priceValue = watch('price_usd');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="title">Listing Title *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="e.g., Top-Rated Upwork Account - $5K+ Monthly"
          className="mt-1"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            {...register('category')}
            className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-destructive mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="platform">Platform *</Label>
          <select
            id="platform"
            {...register('platform')}
            className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select platform</option>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          {errors.platform && (
            <p className="text-sm text-destructive mt-1">
              {errors.platform.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="price_usd">Price (USD) *</Label>
        <Input
          id="price_usd"
          type="number"
          step="0.01"
          min="0.01"
          {...register('price_usd', { valueAsNumber: true })}
          placeholder="0.00"
          className="mt-1"
        />
        {priceValue && (
          <p className="text-sm text-muted-foreground mt-1">
            ${priceValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        )}
        {errors.price_usd && (
          <p className="text-sm text-destructive mt-1">
            {errors.price_usd.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          placeholder="Describe the account, its history, and why it's valuable..."
          className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.description && (
          <p className="text-sm text-destructive mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="monthly_earnings">Monthly Earnings (USD)</Label>
          <Input
            id="monthly_earnings"
            type="number"
            step="0.01"
            min="0"
            {...register('monthly_earnings', { valueAsNumber: true })}
            placeholder="0.00"
            className="mt-1"
          />
          {errors.monthly_earnings && (
            <p className="text-sm text-destructive mt-1">
              {errors.monthly_earnings.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="account_age_months">Account Age (Months)</Label>
          <Input
            id="account_age_months"
            type="number"
            min="0"
            {...register('account_age_months', { valueAsNumber: true })}
            placeholder="0"
            className="mt-1"
          />
          {errors.account_age_months && (
            <p className="text-sm text-destructive mt-1">
              {errors.account_age_months.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="rating">Rating</Label>
          <Input
            id="rating"
            {...register('rating')}
            placeholder="e.g., 4.8"
            className="mt-1"
          />
          {errors.rating && (
            <p className="text-sm text-destructive mt-1">
              {errors.rating.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="ml-auto">
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}


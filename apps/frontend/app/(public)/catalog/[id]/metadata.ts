import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  // In a real implementation, fetch listing data here
  // For now, return default metadata
  return {
    title: 'Listing Details | ESCROW',
    description: 'View detailed information about this verified freelance account listing.',
  };
}


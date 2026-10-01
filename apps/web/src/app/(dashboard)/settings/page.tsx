'use client';

import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { IncomeTaxQuestion } from '@/components/shared/income-tax-question';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" subtitle="Preferences that shape how the app reports your numbers." />

      <Card>
        <SectionHeading className="mb-2">Tax</SectionHeading>
        <p className="mb-4 text-sm leading-relaxed text-ink-muted">
          This decides whether the PPh Final UMKM (0.5%) estimate on Reports applies to you.
          Independent professional services (pekerjaan bebas) are taxed at progressive rates
          under PPh Pasal 17 instead, which this app does not calculate.
        </p>
        <IncomeTaxQuestion />
      </Card>
    </div>
  );
}

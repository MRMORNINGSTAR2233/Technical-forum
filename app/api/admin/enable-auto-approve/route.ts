import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.globalSettings.upsert({
      where: { id: 1 },
      update: { autoApproveEnabled: true },
      create: { id: 1, autoApproveEnabled: true },
    });

    return NextResponse.json({
      success: true,
      autoApproveEnabled: settings.autoApproveEnabled,
      message: 'Auto-approve has been enabled!',
    });
  } catch (error) {
    console.error('Error enabling auto-approve:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enable auto-approve' },
      { status: 500 }
    );
  }
}

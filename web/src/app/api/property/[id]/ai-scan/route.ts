import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePropertyAiAnalysis } from '@/lib/aiRiskExtractor';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const property = await prisma.property.findUnique({
      where: { sale_unit_id: id },
      select: {
        sale_unit_id: true,
        source_provider: true,
        property_type: true,
        raw_display_data: true,
        ai_analysis: true,
        ai_status: true,
      }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Synthesize structured analysis
    const structured = resolvePropertyAiAnalysis(property);

    // Save structured analysis into Property DB
    await prisma.property.update({
      where: { sale_unit_id: id },
      data: {
        ai_analysis: structured as any,
        ai_status: 'COMPLETED_AI',
        updated_at: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      analysis: structured 
    });
  } catch (error: any) {
    console.error('AI Scan API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process AI scan request',
      details: error?.message 
    }, { status: 500 });
  }
}

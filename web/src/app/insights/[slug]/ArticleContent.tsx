import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { Map, TrendingUp, ExternalLink } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import InteractivePropertyChart from '@/components/InteractivePropertyChart';

type ContentBlock = {
  textParts: string[];
  chartId?: string;
  isCTA?: boolean;
};

export default async function ArticleContent({ content }: { content: string }) {
  if (!content) return null;

  // Split content by {{CHART_ID="XXX"}} and {{CTA_MAP_SEARCH}}
  const regex = /(\{\{CHART_ID="[^"]+"\}\}|\{\{CTA_MAP_SEARCH\}\})/g;
  const parts = content.split(regex);
  
  // Extract all sale unit IDs to fetch them at once
  const matches = [...content.matchAll(/\{\{CHART_ID="([^"]+)"\}\}/g)];
  const saleUnitIds = matches.map(m => m[1]);
  
  let propertyMap: Record<string, any> = {};
  if (saleUnitIds.length > 0) {
    const properties = await prisma.property.findMany({
      where: { sale_unit_id: { in: saleUnitIds } }
    });
    propertyMap = properties.reduce((acc, p) => {
      acc[p.sale_unit_id] = p;
      return acc;
    }, {} as Record<string, any>);
  }

  // Parse parts into distinct block sections
  const blocks: ContentBlock[] = [];
  let currentBlock: ContentBlock = { textParts: [] };

  parts.forEach((part) => {
    if (part === '{{CTA_MAP_SEARCH}}') {
      if (currentBlock.textParts.length > 0) blocks.push(currentBlock);
      blocks.push({ textParts: [], isCTA: true });
      currentBlock = { textParts: [] };
    } else {
      const match = part.match(/\{\{CHART_ID="([^"]+)"\}\}/);
      if (match) {
        currentBlock.chartId = match[1];
        blocks.push(currentBlock);
        currentBlock = { textParts: [] };
      } else {
        if (part.trim() !== '') {
          currentBlock.textParts.push(part);
        }
      }
    }
  });

  if (currentBlock.textParts.length > 0) {
    blocks.push(currentBlock);
  }

  return (
    <div className="space-y-16 lg:space-y-24">
      {blocks.filter(b => !b.isCTA).map((block, index) => {
        
        // Render clustered block (Text on Left, Chart on Right)
        const propData = block.chartId ? propertyMap[block.chartId] : null;

        return (
          <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Markdown text portion */}
            <div className={block.chartId ? "lg:col-span-7" : "lg:col-span-12"}>
              <article className="prose prose-zinc dark:prose-invert prose-lg max-w-none 
                prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl 
                prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500
                prose-img:rounded-xl prose-img:shadow-lg">
                {block.textParts.map((textStr, i) => (
                  <ReactMarkdown 
                    key={i} 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="min-w-full divide-y divide-zinc-300 dark:divide-zinc-700" {...props} /></div>,
                      th: ({node, ...props}) => <th className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100" {...props} />,
                      td: ({node, ...props}) => <td className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 text-sm" {...props} />,
                    }}
                  >
                    {textStr}
                  </ReactMarkdown>
                ))}
                {block.chartId && (
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-6 pb-2 border-b border-zinc-100 dark:border-zinc-800/50 inline-flex items-center">
                    出典：
                    <Link href="/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 ml-1">
                      keibai-koubai.com <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </p>
                )}
              </article>
            </div>

            {/* Right Column: Chart specific to this section */}
            {block.chartId && (
              <div className="lg:col-span-5 lg:sticky lg:top-24 mt-8 lg:mt-0">
                {propData ? (
                  <InteractivePropertyChart property={propData} />
                ) : (
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">データが見つかりません: {block.chartId}</p>
                  </div>
                )}
              </div>
            )}
            
          </div>
        );
      })}

      {/* Global CTA at the very end */}
      <div className="pt-16 pb-8 border-t border-zinc-200 dark:border-zinc-800 mt-16 flex justify-center">
        <Link href="/" className="flex items-center gap-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg px-10 py-5 rounded-full transition-transform hover:scale-105 shadow-xl shadow-amber-600/20">
          <TrendingUp className="w-6 h-6" />
          掘り出し物マップを開く
        </Link>
      </div>
    </div>
  );
}

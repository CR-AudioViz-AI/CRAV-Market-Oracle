'use client'

import { TrendingUp, Sparkles, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({ 
  title = "No Stock Picks Yet",
  description = "AI models haven't made any predictions yet. Check back soon!",
  showAction = false,
  actionText = "Generate Picks",
  onAction
}: {
  title?: string
  description?: string
  showAction?: boolean
  actionText?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 py-12">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-full">
          <TrendingUp className="w-12 h-12 text-white" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-slate-900 mb-2 text-center">
        {title}
      </h3>
      
      <p className="text-slate-600 text-center max-w-md mb-8">
        {description}
      </p>

      {showAction && onAction && (
        <Button 
          onClick={onAction}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {actionText}
        </Button>
      )}

      <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span>5 AI Models</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Real-time Analysis</span>
        </div>
      </div>
    </div>
  )
}

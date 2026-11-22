
import { ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  unit?: string
  note: string
  icon: LucideIcon
  trend?: string
  tone?: string
}

function MetricCard({
  title,
  value,
  unit,
  note,
  icon: Icon,
  trend,
  tone = 'mint',
}: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={17} />
        </span>
      </div>

      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>

      <div className="metric-foot">
        <span className="trend">
          <ArrowUpRight size={13} />
          {trend}
        </span>
        <span>{note}</span>
      </div>
    </div>
  )
}

export default MetricCard

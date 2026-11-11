import type { TowerBlock } from '@/components/app/search/TowerGrid';

// Shapes from backend/routes/ai.js: POST /ai/chat reply and GET /ai/conversations/:id/messages rows.

export interface TableData {
  title?: string | null;
  columns: string[];
  rows: (string | number | null)[][];
}

export interface ChartSeries { name: string; data: (number | null)[] }
export interface ChartData {
  type: 'bar' | 'line';
  title?: string | null;
  labels: string[];
  series: ChartSeries[];
}

export interface TowerGridData {
  found?: boolean;
  project_name: string;
  blocks: TowerBlock[];
  note?: string;
  message?: string;
}

export interface YieldCardData {
  found?: boolean;
  project_name: string;
  yield_pct: number;
  avg_monthly_rent_psf: number;
  avg_sale_psf: number;
  rental_sample_count: number;
}

export interface InvestmentReturnData {
  irr_pct: number | null;
  equity?: number;
  loan_amount?: number;
  total_interest_cost?: number;
  assumed_rental_yield_pct?: number | null;
  net_proceeds?: number;
  assumed_loan_interest_rate_pct?: number;
  holding_years?: number;
  estimated_sale_price?: number;
  purchase_price?: number;
  down_payment_pct?: number;
  assumptions?: string[];
  note?: string;
}

export interface ChatMessage {
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  table?: TableData | null;
  chart?: ChartData | null;
  towerGrid?: TowerGridData | null;
  yieldCard?: YieldCardData | null;
  investmentReturn?: InvestmentReturnData | null;
  created_at?: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatReply {
  conversation_id: number;
  reply: string;
  table: TableData | null;
  chart: ChartData | null;
  towerGrid: TowerGridData | null;
  yieldCard: YieldCardData | null;
  investmentReturn: InvestmentReturnData | null;
}

/** "Socrates · tower view" label for an assistant message. */
export function answerKind(m: ChatMessage): string {
  if (m.towerGrid?.blocks?.length) return 'tower view';
  if (m.table?.columns?.length) return 'table';
  if (m.chart?.labels?.length) return 'chart';
  if (m.yieldCard?.project_name) return 'yield card';
  if (m.investmentReturn) return 'IRR card';
  return 'answer';
}

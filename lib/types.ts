export interface PropPrediction {
  id: string;
  player: string;
  team: string;
  metric: string;
  line: number;
  projection: string;
  edge: string;
  recommendation: 'OVER' | 'UNDER' | 'PASS';
  bookie: string;
  offFactor: number;
  defFactor: number;
}
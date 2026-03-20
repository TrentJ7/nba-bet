"use client";
import { useState, useEffect } from 'react';
import { PropPrediction } from '@/lib/types';

export default function Home() {
  const [data, setData] = useState<PropPrediction[]>([]);

  useEffect(() => {
    fetch('/api/props') // No localhost:3000 here!
      .then(res => res.json())
      .then(json => setData(json));
  }, []);

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">NBA Prop Predictions</h1>
      {data.map(prop => (
        <div key={prop.id} className="p-4 bg-slate-900 rounded mb-2">
          {prop.player}: {prop.recommendation} ({prop.edge}% Edge)
        </div>
      ))}
    </div>
  );
}
'use client';

import { Box } from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { VoteResult } from '@/types/database';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface VoteChartProps {
  results: VoteResult[];
  winners: VoteResult[];
  votedCount: number;
}

export default function VoteChart({
  results,
  winners,
  votedCount,
}: VoteChartProps) {
  if (!results.length) {
    return null;
  }

  // データを降順でソート済みなので、そのまま使用
  const labels = results.map(result => result.name);
  const votes = results.map(result => result.vote_count);

  // 背景色を設定（当選者は金色、その他は順位に応じた色）
  const backgroundColors = results.map(result => {
    const isWinner = winners.some(w => w.id === result.id);
    if (isWinner) return 'rgba(255, 215, 0, 0.8)'; // 金色

    const index = results.findIndex(r => r.id === result.id);
    if (index === 0) return 'rgba(59, 130, 246, 0.8)'; // 青 (1位)
    if (index === 1) return 'rgba(34, 197, 94, 0.8)'; // 緑 (2位)
    if (index === 2) return 'rgba(251, 146, 60, 0.8)'; // オレンジ (3位)
    return 'rgba(156, 163, 175, 0.8)'; // グレー (その他)
  });

  // 境界線の色
  const borderColors = results.map(result => {
    const isWinner = winners.some(w => w.id === result.id);
    if (isWinner) return 'rgba(255, 215, 0, 1)';

    const index = results.findIndex(r => r.id === result.id);
    if (index === 0) return 'rgba(59, 130, 246, 1)';
    if (index === 1) return 'rgba(34, 197, 94, 1)';
    if (index === 2) return 'rgba(251, 146, 60, 1)';
    return 'rgba(156, 163, 175, 1)';
  });

  const data = {
    labels,
    datasets: [
      {
        label: '得票数',
        data: votes,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  // 棒の太さを調整（最大幅を制限）
  const maxBarThickness = 80; // 最大80px
  const barThickness = Math.min(
    maxBarThickness,
    Math.max(40, 300 / results.length)
  ); // 参加者数に応じて調整、最小40px

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '📊 投票結果',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: 'rgb(55, 65, 81)',
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const voteCount = context.parsed.y;
            const percentage =
              votedCount > 0 ? Math.round((voteCount / votedCount) * 100) : 0;
            return [`得票数: ${voteCount}票`, `得票率: ${percentage}%`];
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: 'rgb(107, 114, 128)',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        title: {
          display: true,
          text: '得票数',
          color: 'rgb(75, 85, 99)',
          font: {
            weight: 'bold' as const,
          },
        },
      },
      x: {
        ticks: {
          color: 'rgb(107, 114, 128)',
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: '参加者',
          color: 'rgb(75, 85, 99)',
          font: {
            weight: 'bold' as const,
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
    // 棒の太さを制限
    datasets: {
      bar: {
        maxBarThickness: barThickness,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
      },
    },
  };

  return (
    <Box bg="white" p={6} borderRadius="xl" shadow="md">
      <Box height="400px">
        <Bar data={data} options={options} />
      </Box>
    </Box>
  );
}

<template>
  <div class="chart-container">
    <h3 class="chart-title">
      История котировок {{ stock.symbol }} ({{ stock.companyName }})
    </h3>

    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'chart' }"
        @click="activeTab = 'chart'"
      >
        График
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'table' }"
        @click="activeTab = 'table'"
      >
        Таблица
      </button>
    </div>

    <div v-if="activeTab === 'chart'">
      <div class="chart-wrapper">
        <Line ref="chartRef" :data="chartData" :options="chartOptions" />
      </div>
      <div class="zoom-controls">
        <button class="zoom-button" @click="resetZoom">Сбросить масштаб</button>
      </div>
    </div>

    <div v-else-if="activeTab === 'table'" class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Цена ($)</th>
            <th>Изменение (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in sortedHistory" :key="item.date">
            <td>{{ formatDate(item.parsedDate) }}</td>
            <td>${{ item.price.toFixed(2) }}</td>
            <td :style="{ color: getChangeColor(idx) }">
              {{ calculateChange(idx) }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Stock } from "@/types";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import { Line } from "vue-chartjs";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
import { ru } from "date-fns/locale";

// Register Chart.js components
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

interface Props {
  stock: Stock;
}

const props = defineProps<Props>();
const activeTab = ref<"chart" | "table">("chart");
const chartRef = ref<any>(null);

// Парсинг даты (поддерживает форматы M/D/YYYY и ISO)
const parseDate = (dateStr: string): Date | null => {
  try {
    if (dateStr.includes("/")) {
      const [month, day, year] = dateStr.split("/");
      const parsedDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    } else {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
    console.warn("Invalid date format, skipping:", dateStr);
    return null;
  } catch (error) {
    console.error("Error parsing date:", dateStr, error);
    return null;
  }
};

// Парсинг цены (из "$123.45" в 123.45)
const parsePrice = (priceStr: string): number => {
  return parseFloat(priceStr.replace("$", ""));
};

// Сортированная история с распарсенными датами и ценами
const sortedHistory = computed(() => {
  return [...props.stock.historicalData]
    .map((item) => ({
      ...item,
      parsedDate: parseDate(item.date),
      price: parsePrice(item.open),
    }))
    .filter(
      (item): item is typeof item & { parsedDate: Date } =>
        item.parsedDate instanceof Date && !isNaN(item.parsedDate.getTime())
    )
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
});

// Данные для графика
const chartData = computed(() => {
  const dataPoints = sortedHistory.value.map((item) => ({
    x: item.parsedDate.getTime(),
    y: item.price,
  }));

  return {
    datasets: [
      {
        label: "Цена акции",
        data: dataPoints,
        borderColor: "#4a90e2",
        backgroundColor: "rgba(74, 144, 226, 0.1)",
        fill: false,
        borderWidth: 1.5,
        tension: 0.1,
        pointRadius: 1,
        pointHoverRadius: 4,
        pointBackgroundColor: "#4a90e2",
        pointBorderColor: "#4a90e2",
      },
    ],
  };
});

// Опции графика
const chartOptions = computed<ChartOptions<"line">>(() => {
  const minZoomRange = 7 * 24 * 60 * 60 * 1000; // 7 дней

  return {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    scales: {
      x: {
        type: "time" as const,
        adapters: {
          date: { locale: ru },
        },
        time: {
          unit: "month",
          displayFormats: {
            millisecond: "HH:mm:ss.SSS",
            second: "HH:mm:ss",
            minute: "HH:mm",
            hour: "HH:mm",
            day: "dd MMM",
            week: "dd MMM",
            month: "MMM yyyy",
            quarter: "'Q'q yyyy",
            year: "yyyy",
          },
          tooltipFormat: "dd MMMM yyyy",
        },
        grid: {
          display: false,
        },
        ticks: {
          source: "auto",
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: window.innerWidth < 768 ? 6 : 10,
        },
        title: {
          display: true,
          text: "Дата",
          font: {
            size: 14,
            weight: "bold" as const,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: (value: string | number) =>
            `$${Number(value).toFixed(2)}`,
        },
        title: {
          display: true,
          text: "Цена ($)",
          font: {
            size: 14,
            weight: "bold" as const,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems: TooltipItem<"line">[]) => {
            const timestamp = tooltipItems[0]?.parsed?.x;
            if (timestamp === undefined || timestamp === null) return "";
            const date = new Date(timestamp);
            return new Intl.DateTimeFormat("ru-RU", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(date);
          },
          label: (tooltipItem: TooltipItem<"line">) => {
            const price = tooltipItem.parsed?.y;
            if (price === undefined || price === null) return "";
            return `Цена: $${price.toFixed(2)}`;
          },
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x" as const,
          threshold: 5,
        },
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1,
          },
          pinch: {
            enabled: true,
          },
          mode: "x" as const,
        },
        limits: {
          x: {
            min: "original" as const,
            max: "original" as const,
            minRange: minZoomRange,
          },
        },
      },
    },
  };
});

const resetZoom = () => {
  if (chartRef.value?.chart) {
    chartRef.value.chart.resetZoom();
  }
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const calculateChange = (idx: number): string => {
  if (idx === 0) return "0.00";
  const prevPrice = sortedHistory.value[idx - 1].price;
  const currentPrice = sortedHistory.value[idx].price;
  const change = ((currentPrice - prevPrice) / prevPrice) * 100;
  return change.toFixed(2);
};

const getChangeColor = (idx: number): string => {
  if (idx === 0) return "#6c757d";
  const change = parseFloat(calculateChange(idx));
  return change >= 0 ? "#22c55e" : "#ef4444";
};
</script>

<style scoped>
.chart-container {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #333;
}

.tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eaedf3;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #64748b;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  border-bottom-color: #4a90e2;
  color: #4a90e2;
}

.tab:hover {
  color: #4a90e2;
}

.chart-wrapper {
  position: relative;
  height: 400px;
  margin-bottom: 1rem;
}

.zoom-controls {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.zoom-button {
  padding: 0.5rem 1rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.zoom-button:hover {
  background-color: #3a7bc8;
}

.data-table-container {
  width: 100%;
  overflow-x: auto;
  margin-top: 1rem;
}

.data-table {
  width: 100%;
  min-width: 500px;
  border-collapse: collapse;
}

.data-table th {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eaedf3;
  color: #64748b;
  font-weight: 600;
  font-size: 0.875rem;
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #eaedf3;
}

.data-table tr:hover {
  background-color: #f8fafc;
}

@media (max-width: 768px) {
  .chart-container {
    padding: 1rem;
  }

  .chart-title {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .chart-wrapper {
    height: 300px;
  }

  .tab {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .chart-wrapper {
    height: 250px;
  }
}
</style>

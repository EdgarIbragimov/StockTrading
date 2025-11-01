<template>
  <div>
    <div class="header">
      <div class="header-content">
        <div>
          <h1>Панель администратора</h1>
          <p v-if="currentDate" style="color: #6c757d; margin-top: 5px">
            Текущая дата: {{ formatDate(currentDate) }}
          </p>
        </div>
        <button class="btn btn-secondary" @click="goBack">← Назад</button>
      </div>
    </div>

    <div class="container">
      <div v-if="loading" class="loading">Загрузка...</div>

      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else>
        <!-- Список всех брокеров -->
        <div class="card">
          <h2>Список брокеров</h2>
          <div
            v-if="brokersWithPortfolio.length === 0"
            style="padding: 40px; text-align: center; color: #6c757d"
          >
            Нет зарегистрированных брокеров
          </div>
          <div v-else style="margin-top: 20px">
            <div
              v-for="broker in brokersWithPortfolio"
              :key="broker.id"
              class="card"
              style="margin-bottom: 20px"
            >
              <h3>{{ broker.name }}</h3>

              <!-- Общая информация -->
              <div class="grid" style="margin: 20px 0">
                <div>
                  <p style="color: #6c757d; font-size: 14px">
                    Денежные средства
                  </p>
                  <p style="font-size: 20px; font-weight: 600">
                    ${{ broker.balance.toFixed(2) }}
                  </p>
                </div>
                <div>
                  <p style="color: #6c757d; font-size: 14px">Общий баланс</p>
                  <p style="font-size: 20px; font-weight: 600">
                    ${{ broker.totalBalance?.toFixed(2) || "0.00" }}
                  </p>
                </div>
                <div>
                  <p style="color: #6c757d; font-size: 14px">Всего вложено</p>
                  <p style="font-size: 20px; font-weight: 600">
                    ${{ broker.totalInvested?.toFixed(2) || "0.00" }}
                  </p>
                </div>
                <div>
                  <p style="color: #6c757d; font-size: 14px">Прибыль/Убыток</p>
                  <p
                    style="font-size: 20px; font-weight: 600"
                    :class="
                      (broker.totalProfitLoss || 0) >= 0 ? 'profit' : 'loss'
                    "
                  >
                    {{ (broker.totalProfitLoss || 0) >= 0 ? "+" : "" }}${{
                      broker.totalProfitLoss?.toFixed(2) || "0.00"
                    }}
                  </p>
                </div>
              </div>

              <!-- Портфель брокера -->
              <div v-if="broker.portfolio && broker.portfolio.length > 0">
                <h4 style="margin: 20px 0 10px">Портфель акций</h4>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Символ</th>
                      <th>Компания</th>
                      <th>Количество</th>
                      <th>Средняя цена</th>
                      <th>Текущая цена</th>
                      <th>Стоимость</th>
                      <th>Прибыль/Убыток</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in broker.portfolio" :key="item.symbol">
                      <td>
                        <strong>{{ item.symbol }}</strong>
                      </td>
                      <td>{{ item.companyName }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>${{ item.averagePrice.toFixed(2) }}</td>
                      <td>${{ item.currentPrice.toFixed(2) }}</td>
                      <td>${{ item.totalValue.toFixed(2) }}</td>
                      <td :class="item.profitLoss >= 0 ? 'profit' : 'loss'">
                        {{ item.profitLoss >= 0 ? "+" : "" }}${{
                          item.profitLoss.toFixed(2)
                        }}
                      </td>
                      <td
                        :class="item.profitLossPercent >= 0 ? 'profit' : 'loss'"
                      >
                        {{ item.profitLossPercent >= 0 ? "+" : ""
                        }}{{ item.profitLossPercent.toFixed(2) }}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div
                v-else
                style="
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 4px;
                  text-align: center;
                  color: #6c757d;
                "
              >
                У брокера нет акций
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useBrokers } from "@/composables/useBrokers";
import { useSocket } from "@/composables/useSocket";
import { brokersApi } from "@/services/api";
import type { Broker, Portfolio } from "@/types";

const router = useRouter();
const { brokers, loading, error, fetchBrokers } = useBrokers();
const { currentDate, stockPrices, connect, disconnect } = useSocket();

interface BrokerWithPortfolio extends Broker {
  portfolio?: Portfolio["portfolio"];
  totalBalance?: number;
  totalInvested?: number;
  totalProfitLoss?: number;
}

const brokersWithPortfolio = ref<BrokerWithPortfolio[]>([]);

const loadBrokersData = async () => {
  await fetchBrokers();

  // Загружаем портфели для каждого брокера
  const portfolioPromises = brokers.value.map(async (broker) => {
    try {
      const response = await brokersApi.getPortfolio(broker.id);
      return {
        ...broker,
        portfolio: response.data.portfolio,
        totalBalance: response.data.totalBalance,
        totalInvested: response.data.totalInvested,
        totalProfitLoss: response.data.totalProfitLoss,
      };
    } catch (e) {
      console.error(`Error loading portfolio for broker ${broker.id}:`, e);
      return {
        ...broker,
        portfolio: [],
        totalBalance: broker.balance,
        totalInvested: 0,
        totalProfitLoss: 0,
      };
    }
  });

  brokersWithPortfolio.value = await Promise.all(portfolioPromises);
};

// Обновление портфелей существующих брокеров БЕЗ замены массива
const updateBrokersPortfolios = async () => {
  // Обновляем портфели для каждого брокера на месте
  for (const broker of brokersWithPortfolio.value) {
    try {
      const response = await brokersApi.getPortfolio(broker.id);
      // Обновляем свойства существующего объекта вместо замены
      broker.portfolio = response.data.portfolio;
      broker.totalBalance = response.data.totalBalance;
      broker.totalInvested = response.data.totalInvested;
      broker.totalProfitLoss = response.data.totalProfitLoss;
    } catch (e) {
      console.error(`Error updating portfolio for broker ${broker.id}:`, e);
    }
  }
};

onMounted(async () => {
  await loadBrokersData();
  connect();
});

onUnmounted(() => {
  disconnect();
});

watch(
  stockPrices,
  (newPrices) => {
    if (newPrices && newPrices.length > 0) {
      // Обновляем данные существующих брокеров БЕЗ замены массива
      // Это не вызывает полную перерисовку и сохраняет скролл
      updateBrokersPortfolios();
    }
  },
  { deep: true }
);

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const goBack = () => {
  router.push("/");
};
</script>

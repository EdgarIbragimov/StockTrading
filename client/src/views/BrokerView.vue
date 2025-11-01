<template>
  <div>
    <div class="header">
      <div class="header-content">
        <div>
          <h1>{{ currentBroker?.name || "Брокер" }}</h1>
          <p v-if="currentDate" style="color: #6c757d; margin-top: 5px">
            Текущая дата: {{ formatDate(currentDate) }}
          </p>
        </div>
        <button class="btn btn-secondary" @click="goBack">← Назад</button>
      </div>
    </div>

    <div class="container">
      <div v-if="loading && !portfolio" class="loading">Загрузка...</div>

      <div v-else-if="error && !portfolio" class="error">{{ error }}</div>

      <div v-else-if="portfolio">
        <!-- Информация о балансе -->
        <div class="card">
          <h2>Баланс</h2>
          <div class="grid" style="margin-top: 20px">
            <div>
              <p style="color: #6c757d; font-size: 14px">Денежные средства</p>
              <p style="font-size: 24px; font-weight: 600">
                ${{ currentBroker?.balance.toFixed(2) }}
              </p>
            </div>
            <div>
              <p style="color: #6c757d; font-size: 14px">Стоимость акций</p>
              <p style="font-size: 24px; font-weight: 600">
                ${{
                  (portfolio.totalBalance - currentBroker!.balance).toFixed(2)
                }}
              </p>
            </div>
            <div>
              <p style="color: #6c757d; font-size: 14px">Общий баланс</p>
              <p style="font-size: 24px; font-weight: 600">
                ${{ portfolio.totalBalance.toFixed(2) }}
              </p>
            </div>
            <div>
              <p style="color: #6c757d; font-size: 14px">Прибыль/Убыток</p>
              <p
                style="font-size: 24px; font-weight: 600"
                :class="portfolio.totalProfitLoss >= 0 ? 'profit' : 'loss'"
              >
                {{ portfolio.totalProfitLoss >= 0 ? "+" : "" }}${{
                  portfolio.totalProfitLoss.toFixed(2)
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Доступные акции -->
        <div class="card">
          <h2>Доступные акции</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Символ</th>
                <th>Компания</th>
                <th>Текущая цена</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stock in activeStocks" :key="stock.symbol">
                <td>
                  <strong>{{ stock.symbol }}</strong>
                </td>
                <td>{{ stock.companyName }}</td>
                <td>${{ parsePrice(getStockPrice(stock.symbol)) }}</td>
                <td>
                  <span class="badge badge-success">Активна</span>
                </td>
                <td>
                  <button
                    class="btn btn-success"
                    @click="openBuyDialog(stock)"
                    style="margin-right: 5px"
                  >
                    Купить
                  </button>
                  <button
                    class="btn btn-secondary"
                    @click="openChartDialog(stock)"
                  >
                    График
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Портфель -->
        <div class="card">
          <h2>Мой портфель</h2>
          <div
            v-if="portfolio.portfolio.length === 0"
            style="padding: 40px; text-align: center; color: #6c757d"
          >
            У вас пока нет акций
          </div>
          <table v-else class="table">
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
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in portfolio.portfolio" :key="item.symbol">
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
                <td :class="item.profitLossPercent >= 0 ? 'profit' : 'loss'">
                  {{ item.profitLossPercent >= 0 ? "+" : ""
                  }}{{ item.profitLossPercent.toFixed(2) }}%
                </td>
                <td>
                  <button class="btn btn-danger" @click="openSellDialog(item)">
                    Продать
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Диалог покупки -->
    <div
      v-if="showBuyDialog"
      class="modal-overlay"
      @click.self="closeBuyDialog"
    >
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Купить {{ selectedStock?.symbol }}</h3>
          <button class="modal-close" @click="closeBuyDialog">×</button>
        </div>
        <div>
          <p style="margin-bottom: 20px">
            <strong>{{ selectedStock?.companyName }}</strong
            ><br />
            Текущая цена: ${{
              parsePrice(getStockPrice(selectedStock?.symbol || ""))
            }}
          </p>
          <div class="form-group">
            <label>Количество акций:</label>
            <input type="number" v-model.number="buyQuantity" min="1" />
          </div>
          <p style="margin: 15px 0; font-size: 18px">
            Сумма:
            <strong
              >${{
                (
                  buyQuantity *
                  parsePrice(getStockPrice(selectedStock?.symbol || ""))
                ).toFixed(2)
              }}</strong
            >
          </p>
          <div v-if="tradeError" class="error">{{ tradeError }}</div>
          <div style="display: flex; gap: 10px; margin-top: 20px">
            <button
              class="btn btn-success"
              @click="confirmBuy"
              :disabled="loading || buyQuantity < 1"
              style="flex: 1"
            >
              {{ loading ? "Покупка..." : "Купить" }}
            </button>
            <button
              class="btn btn-secondary"
              @click="closeBuyDialog"
              style="flex: 1"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог продажи -->
    <div
      v-if="showSellDialog"
      class="modal-overlay"
      @click.self="closeSellDialog"
    >
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">
            Продать {{ selectedPortfolioItem?.symbol }}
          </h3>
          <button class="modal-close" @click="closeSellDialog">×</button>
        </div>
        <div>
          <p style="margin-bottom: 20px">
            <strong>{{ selectedPortfolioItem?.companyName }}</strong
            ><br />
            Текущая цена: ${{ selectedPortfolioItem?.currentPrice.toFixed(2)
            }}<br />
            Доступно: {{ selectedPortfolioItem?.quantity }} шт.
          </p>
          <div class="form-group">
            <label>Количество акций:</label>
            <input
              type="number"
              v-model.number="sellQuantity"
              min="1"
              :max="selectedPortfolioItem?.quantity"
            />
          </div>
          <p style="margin: 15px 0; font-size: 18px">
            Сумма:
            <strong
              >${{
                (
                  sellQuantity * (selectedPortfolioItem?.currentPrice || 0)
                ).toFixed(2)
              }}</strong
            >
          </p>
          <div v-if="tradeError" class="error">{{ tradeError }}</div>
          <div style="display: flex; gap: 10px; margin-top: 20px">
            <button
              class="btn btn-danger"
              @click="confirmSell"
              :disabled="
                loading ||
                sellQuantity < 1 ||
                sellQuantity > (selectedPortfolioItem?.quantity || 0)
              "
              style="flex: 1"
            >
              {{ loading ? "Продажа..." : "Продать" }}
            </button>
            <button
              class="btn btn-secondary"
              @click="closeSellDialog"
              style="flex: 1"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог графика (заглушка) -->
    <div
      v-if="showChartDialog"
      class="modal-overlay"
      @click.self="closeChartDialog"
    >
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">График {{ selectedStock?.symbol }}</h3>
          <button class="modal-close" @click="closeChartDialog">×</button>
        </div>
        <div>
          <StockChart v-if="selectedStock" :stock="selectedStock" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBrokers } from "@/composables/useBrokers";
import { useStocks } from "@/composables/useStocks";
import { useSocket } from "@/composables/useSocket";
import type { Stock, PortfolioItem } from "@/types";
import StockChart from "@/components/StockChart.vue";

const route = useRoute();
const router = useRouter();
const brokerId = route.params.id as string;

const {
  currentBroker,
  portfolio,
  loading,
  error,
  fetchPortfolio,
  buyStock,
  sellStock,
} = useBrokers();

const { stocks, fetchStocks, parsePrice: parsePriceUtil } = useStocks();
const { currentDate, stockPrices, connect, disconnect } = useSocket();

// Диалоги
const showBuyDialog = ref(false);
const showSellDialog = ref(false);
const showChartDialog = ref(false);
const selectedStock = ref<Stock | null>(null);
const selectedPortfolioItem = ref<PortfolioItem | null>(null);
const buyQuantity = ref(1);
const sellQuantity = ref(1);
const tradeError = ref<string | null>(null);

const activeStocks = computed(() => stocks.value.filter((s) => s.isActive));

onMounted(async () => {
  await fetchPortfolio(brokerId);
  await fetchStocks();
  connect();
});

onUnmounted(() => {
  disconnect();
});

// Обновляем данные акций при получении WebSocket событий
watch(
  stockPrices,
  (newPrices) => {
    if (newPrices && newPrices.length > 0) {
      // Обновляем текущие цены акций
      newPrices.forEach(({ symbol, price }) => {
        const stock = stocks.value.find((s) => s.symbol === symbol);
        if (stock) {
          stock.currentPrice = price;

          // Добавляем новую точку в исторические данные если есть currentDate
          if (currentDate.value) {
            const dateStr = formatDateForHistory(currentDate.value);
            const existingIndex = stock.historicalData.findIndex(
              (h) => h.date === dateStr
            );

            if (existingIndex === -1) {
              // Добавляем новую точку данных
              stock.historicalData.push({
                date: dateStr,
                open: price,
              });
            } else {
              // Обновляем существующую точку
              stock.historicalData[existingIndex].open = price;
            }
          }
        }
      });

      // Обновляем портфель для пересчета прибыли/убытка
      if (portfolio.value) {
        fetchPortfolio(brokerId);
      }
    }
  },
  { deep: true }
);

const formatDateForHistory = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const getStockPrice = (symbol: string): string => {
  const stockPrice = stockPrices.value.find((sp) => sp.symbol === symbol);
  if (stockPrice) return stockPrice.price;
  const stock = stocks.value.find((s) => s.symbol === symbol);
  return stock?.currentPrice || "$0.00";
};

const parsePrice = (priceStr: string): number => {
  return parsePriceUtil(priceStr);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const openBuyDialog = (stock: Stock) => {
  selectedStock.value = stock;
  buyQuantity.value = 1;
  tradeError.value = null;
  showBuyDialog.value = true;
};

const closeBuyDialog = () => {
  showBuyDialog.value = false;
  selectedStock.value = null;
};

const confirmBuy = async () => {
  if (!selectedStock.value) return;
  tradeError.value = null;

  const success = await buyStock(
    brokerId,
    selectedStock.value.symbol,
    buyQuantity.value
  );
  if (success) {
    closeBuyDialog();
  } else {
    tradeError.value = error.value;
  }
};

const openSellDialog = (item: PortfolioItem) => {
  selectedPortfolioItem.value = item;
  sellQuantity.value = 1;
  tradeError.value = null;
  showSellDialog.value = true;
};

const closeSellDialog = () => {
  showSellDialog.value = false;
  selectedPortfolioItem.value = null;
};

const confirmSell = async () => {
  if (!selectedPortfolioItem.value) return;
  tradeError.value = null;

  const success = await sellStock(
    brokerId,
    selectedPortfolioItem.value.symbol,
    sellQuantity.value
  );
  if (success) {
    closeSellDialog();
  } else {
    tradeError.value = error.value;
  }
};

const openChartDialog = (stock: Stock) => {
  selectedStock.value = stock;
  showChartDialog.value = true;
};

const closeChartDialog = () => {
  showChartDialog.value = false;
  selectedStock.value = null;
};

const goBack = () => {
  router.push("/");
};
</script>

<template>
  <div>
    <div class="header">
      <div class="header-content">
        <h1 style="color: #4a90e2; font-size: 1.8rem; font-weight: 600;" >Broker Exc. Platform</h1>
      </div>
    </div>

    <div class="container">
      <div class="card" style="max-width: 600px; margin: 50px auto">
        <h2 style="margin-bottom: 30px; text-align: center">Вход в систему</h2>

        <div v-if="loading" class="loading">Загрузка...</div>

        <div v-else-if="error" class="error">{{ error }}</div>

        <div v-else>
          <div class="form-group">
            <label>Выберите брокера:</label>
            <select v-model="selectedBrokerId">
              <option value="">-- Выберите брокера --</option>
              <option
                v-for="broker in brokers"
                :key="broker.id"
                :value="broker.id"
              >
                {{ broker.name }} (Баланс: ${{ broker.balance.toFixed(2) }})
              </option>
            </select>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 30px">
            <button
              class="btn btn-primary"
              @click="enterAsBroker"
              :disabled="!selectedBrokerId"
              style="flex: 1"
            >
              Войти как брокер
            </button>
            <button
              class="btn btn-secondary"
              @click="enterAsAdmin"
              style="flex: 1"
            >
              Войти как администратор
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useBrokers } from "@/composables/useBrokers";

const router = useRouter();
const { brokers, loading, error, fetchBrokers } = useBrokers();
const selectedBrokerId = ref("");

onMounted(() => {
  fetchBrokers();
});

const enterAsBroker = () => {
  if (selectedBrokerId.value) {
    router.push(`/broker/${selectedBrokerId.value}`);
  }
};

const enterAsAdmin = () => {
  router.push("/admin");
};
</script>

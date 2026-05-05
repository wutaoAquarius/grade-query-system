<template>
  <div class="search-form-container">
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span class="form-title">查询条件</span>
        </div>
      </template>

      <!-- 查询类型选择 -->
      <el-form label-width="100px" class="search-form">
        <el-form-item label="查询方式">
          <el-radio-group v-model="searchType" @change="handleTypeChange">
            <el-radio label="id">按学号查询</el-radio>
            <el-radio label="name">按姓名查询</el-radio>
            <el-radio label="class">按班级查询</el-radio>
            <el-radio label="all">显示全部</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 查询输入框 -->
        <el-form-item v-if="searchType !== 'all'" label="查询值">
          <el-input
            v-model="searchValue"
            :placeholder="getPlaceholder()"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            @click="handleSearch"
            :loading="isLoading"
            :disabled="searchType !== 'all' && !searchValue.trim()"
          >
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleClear">清空</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['search']);

const searchType = ref('all');
const searchValue = ref('');
const isLoading = ref(false);

const getPlaceholder = () => {
  const placeholders = {
    id: '请输入学号，如：2024001',
    name: '请输入姓名，支持模糊搜索',
    class: '请输入班级，如：高一(1)班'
  };
  return placeholders[searchType.value] || '';
};

const handleTypeChange = () => {
  searchValue.value = '';
};

const handleSearch = async () => {
  if (searchType.value !== 'all' && !searchValue.value.trim()) {
    ElMessage.warning('请输入查询值');
    return;
  }

  isLoading.value = true;
  try {
    emit('search', {
      type: searchType.value,
      value: searchValue.value.trim()
    });
  } finally {
    isLoading.value = false;
  }
};

const handleReset = () => {
  searchType.value = 'all';
  searchValue.value = '';
};

const handleClear = () => {
  searchValue.value = '';
};
</script>

<style scoped>
.search-form-container {
  margin-bottom: 20px;
}

.search-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.search-form {
  padding: 10px 0;
}

.el-button {
  margin-right: 10px;
}
</style>

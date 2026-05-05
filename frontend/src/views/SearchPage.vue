<template>
  <div class="search-page">
    <div class="page-header">
      <h1>📚 学生成绩查询系统</h1>
      <p class="page-description">快速查询学生成绩信息</p>
    </div>

    <!-- 查询表单 -->
    <search-form
      :loading="isSearching"
      @search="handleSearch"
    />

    <!-- 查询结果表格 -->
    <result-table
      :table-data="tableData"
      :loading="isLoading"
      :pagination="pagination"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import SearchForm from '../components/SearchForm.vue';
import ResultTable from '../components/ResultTable.vue';
import axios from 'axios';

const tableData = ref([]);
const isLoading = ref(false);
const isSearching = ref(false);
const pagination = ref(null);
const currentSearchParams = ref({
  type: 'all',
  value: '',
  pageSize: 10
});

// 获取 API 基础地址
const getApiBaseUrl = () => {
  // 在浏览器中，相对路径 /api 会自动指向当前域名的 /api
  // Vercel 会通过 rewrites 规则将 /api 转发到后端函数
  return '/api';
};

// 执行查询
const fetchData = async (type, value = '', page = 1, pageSize = 10) => {
  isLoading.value = true;
  try {
    const params = {
      type,
      page,
      pageSize
    };

    if (type !== 'all' && value) {
      params.value = value;
    }

    const response = await axios.get(`${getApiBaseUrl()}/students`, { params });

    if (response.data.success) {
      tableData.value = response.data.data;
      pagination.value = response.data.pagination;

      // 如果是单个学号查询，不需要分页提示
      if (type === 'id' && response.data.data.length === 1) {
        ElMessage.success('查询成功');
      } else if (response.data.data.length === 0) {
        ElMessage.info('没有找到匹配的结果');
      } else {
        ElMessage.success(`查询成功，共 ${response.data.pagination.totalRecords} 条记录`);
      }
    } else {
      ElMessage.error(response.data.message || '查询失败');
    }
  } catch (error) {
    console.error('查询错误:', error);
    ElMessage.error('查询失败，请检查网络连接');
  } finally {
    isLoading.value = false;
  }
};

// 处理查询事件
const handleSearch = async (params) => {
  isSearching.value = true;
  try {
    currentSearchParams.value = {
      type: params.type,
      value: params.value,
      pageSize: pagination.value?.pageSize || 10
    };
    await fetchData(params.type, params.value, 1, currentSearchParams.value.pageSize);
  } finally {
    isSearching.value = false;
  }
};

// 处理页码改变
const handlePageChange = async (page) => {
  await fetchData(
    currentSearchParams.value.type,
    currentSearchParams.value.value,
    page,
    pagination.value?.pageSize || 10
  );
};

// 处理每页条数改变
const handlePageSizeChange = async (size) => {
  currentSearchParams.value.pageSize = size;
  await fetchData(
    currentSearchParams.value.type,
    currentSearchParams.value.value,
    1,
    size
  );
};

// 页面加载时获取默认数据
onMounted(() => {
  fetchData('all', '', 1, 10);
});
</script>

<style scoped>
.search-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.page-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
  animation: fadeInDown 0.6s ease-out;
}

.page-header h1 {
  font-size: 36px;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.page-description {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .search-page {
    padding: 20px 10px;
  }

  .page-header h1 {
    font-size: 24px;
  }

  .page-description {
    font-size: 14px;
  }
}
</style>

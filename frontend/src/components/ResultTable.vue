<template>
  <div class="result-table-container">
    <el-card class="result-card">
      <template #header>
        <div class="card-header">
          <span class="result-title">查询结果</span>
          <span v-if="pagination" class="result-count">
            共 {{ pagination.totalRecords }} 条记录
          </span>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        stripe
        style="width: 100%"
        :loading="loading"
        empty-text="暂无数据"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="student_id" label="学号" width="120" />
        <el-table-column prop="class" label="班级" width="140" />
        <el-table-column prop="chinese_score" label="语文" width="100" />
        <el-table-column prop="math_score" label="数学" width="100" />
        <el-table-column prop="english_score" label="英语" width="100" />
        <el-table-column
          prop="total_score"
          label="总分"
          width="100"
          sortable
        >
          <template #default="{ row }">
            <strong class="total-score">{{ row.total_score }}</strong>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="pagination && pagination.totalPages > 1" class="pagination-container">
        <el-pagination
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :total="pagination.totalRecords"
          :page-sizes="[10, 20, 50]"
          layout="prev, pager, next, sizes, total, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  tableData: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['page-change', 'page-size-change']);

const handlePageChange = (page) => {
  emit('page-change', page);
};

const handlePageSizeChange = (size) => {
  emit('page-size-change', size);
};
</script>

<style scoped>
.result-table-container {
  margin-top: 20px;
}

.result-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.result-count {
  font-size: 14px;
  color: #909399;
}

.total-score {
  color: #f56c6c;
  font-size: 16px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  font-weight: bold;
}
</style>

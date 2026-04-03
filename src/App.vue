<template>
  <div class="layout">
    <!-- 左侧导航栏-->
    <aside class="sidebar">
      <div class="logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span>位置展示系统</span>
      </div>

      <nav class="menu">
        <div
          v-for="(item, index) in menuItems"
          :key="index"
          class="menu-item"
          :class="{ active: activeMenu === index }"
          @click="activeMenu = index"
        >
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="item.icon"></svg>
          <span>{{ item.label }}</span>
        </div>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="main">
      <!-- 顶部工具栏已移除 -->

      <!-- 地图区域锛堣蒋浠舵帶鍒堕〉涓嶆樉绀哄湴鍥撅級 -->
      <!-- 内容查询页-->
      <section v-if="activeMenu === 1" class="file-query-page">
        <div class="file-query-bar">
          <input type="datetime-local" v-model="fileQueryStartTime" class="datetime-input" step="1" />
          <span class="datetime-arrow">→</span>
          <input type="datetime-local" v-model="fileQueryEndTime" class="datetime-input" step="1" />
          <label class="checkbox-label"><input type="checkbox" v-model="fileQueryOnlyUl" /> 包含上行</label>
          <label class="checkbox-label"><input type="checkbox" v-model="fileQueryOnlyImei" /> 仅IMEI</label>
          <input type="text" v-model="fileQueryImeiFilter" class="imei-filter-input" placeholder="IMEI过滤..." />
          <button class="query-btn" @click="handleFileQuery">查 询</button>
          <button class="export-btn" @click="handleFileQueryExport">导出</button>
        </div>
        <div class="payload-filter-bar">
          <span class="payload-filter-title">载荷过滤：</span>
          <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterCommType" /> 业务类型</label>
          <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterSignaling" /> 信令类型</label>
          <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterIdappXYZ" /> 播发经纬度</label>
          <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterAircraft" /> ACARS</label>
          <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterVoice" /> 语音通话</label>
          <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterSms" /> 短信数据</label>
          <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterIp" /> IP数据</label>
          <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterLowSpeed" /> 低速数据</label>
          <label class="checkbox-label"><input type="checkbox" v-model="payloadFilterIdapp" /> 解析数据</label>
        </div>
        <div v-if="loading" class="loading-overlay static-loading">
          <div class="loading-spinner"></div>
          <span class="loading-text">数据加载中..</span>
        </div>
        <div class="file-query-table-wrapper">
          <table class="device-table file-query-fixed-table">
            <colgroup>
              <col v-for="col in fileQueryColumns" :key="col.key" :style="{ width: col.width }" />
              <col style="width:110px" />
            </colgroup>
            <thead>
              <tr>
                <th v-for="col in fileQueryColumns" :key="col.key" class="filterable-th">
                  <span>{{ col.label }}</span>
                  <button
                    v-if="!col.noFilter"
                    class="filter-icon-btn"
                    :class="{ 'filter-active': fileQueryFilters[col.key]?.size > 0 }"
                    @click.stop="toggleFilterDropdown(col.key, $event)"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                    </svg>
                  </button>
                </th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in fileQueryPagedData" :key="i">
                <td v-for="col in fileQueryColumns" :key="col.key">
                  <button v-if="col.key === 'payloadInfo'" class="payload-btn" @click="openPayloadModal(row)">查看载荷</button>
                  <template v-else-if="col.key === 'locationLatLon'">
                    <div class="latlon-cell">
                      <span class="latlon-text">{{ row.locationLatLon || '-' }}</span>
                      <button v-if="row.locationLatLon" class="location-view-btn" @click="openLocationPreview(row)">查看</button>
                    </div>
                  </template>
                  <template v-else>{{ row[col.key] }}</template>
                </td>
                <td>
                  <div class="detail-actions">
                    <button class="detail-btn" @click="showLCWDetail(row)">查看</button>
                    <button class="detail-export-btn" @click="handleLCWDetailExport(row)">导出</button>
                  </div>
                </td>
              </tr>
              <tr v-if="fileQueryFilteredData.length === 0">
                <td :colspan="fileQueryColumns.length + 1" class="empty-row">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 分页 -->
        <div v-if="fileQueryFilteredData.length > 0" class="pagination">
          <span class="page-info">共 {{ fileQueryFilteredData.length }} 条，第 {{ fileQueryPage }}/{{ fileQueryTotalPages }} 页</span>
          <div class="page-btns">
            <button class="page-btn" :disabled="fileQueryPage <= 1" @click="fileQueryPage = 1">首页</button>
            <button class="page-btn" :disabled="fileQueryPage <= 1" @click="fileQueryPage--">&lt;</button>
            <template v-for="p in fileQueryVisiblePages" :key="p">
              <button class="page-btn" :class="{ 'page-active': p === fileQueryPage }" @click="fileQueryPage = p">{{ p }}</button>
            </template>
            <button class="page-btn" :disabled="fileQueryPage >= fileQueryTotalPages" @click="fileQueryPage++">&gt;</button>
            <button class="page-btn" :disabled="fileQueryPage >= fileQueryTotalPages" @click="fileQueryPage = fileQueryTotalPages">末页</button>
          </div>
        </div>
      </section>

      <section v-show="activeMenu === 0 || activeMenu === 2" class="map-container">
        <div id="map" ref="mapRef"></div>
        <!-- 实时位置 - 地图右上角控件-->
        <div v-if="activeMenu === 0" class="map-controls">
          <select v-model="queryMode" class="map-select">
            <option value="realtime">实时模式</option>
            <option value="highprecision">高精度模式</option>
          </select>
          <select v-model="calStepSecond" class="map-select" :disabled="queryMode === 'realtime'" :title="queryMode === 'realtime' ? '实时定位模式无效' : 'CalStepSecond'">
            <option value="30">30s</option>
            <option value="60">1min</option>
            <option value="120">2min</option>
            <option value="300">5min</option>
            <option value="600">10min</option>
            <option value="1800">30min</option>
            <option value="3600">60min</option>
          </select>
          <select v-model="timeRange" class="map-select">
            <option value="1hour">1hour</option>
            <option value="2hour">2hour</option>
            <option value="6hour">6hour</option>
            <option value="12hour">12hour</option>
            <option value="24hour">24hour</option>
          </select>
          <button class="query-btn" @click="handleRealtimeQuery">查 询</button>
          <span class="countdown-badge">{{ countdown }}s</span>
          <button class="export-btn" @click="handleExport">导 出</button>
        </div>
        <!-- 加载遮罩 -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <span class="loading-text">数据加载中..</span>
        </div>
        <!-- 位置展示 - 鍦板浘椤堕儴查询鏍?-->
        <div v-if="activeMenu === 2" class="map-controls-bar">
          <select v-model="searchQueryMode" class="map-select">
            <option value="realtime">实时模式</option>
            <option value="highprecision">高精度模式</option>
          </select>
          <select v-model="searchCalStepSecond" class="map-select" :disabled="searchQueryMode === 'realtime'" :title="searchQueryMode === 'realtime' ? '实时定位模式无效' : 'CalStepSecond'">
            <option value="30">30s</option>
            <option value="60">1min</option>
            <option value="120">2min</option>
            <option value="300">5min</option>
            <option value="600">10min</option>
            <option value="1800">30min</option>
            <option value="3600">60min</option>
          </select>
          <input type="datetime-local" v-model="searchStartTime" class="datetime-input" step="1" />
          <span class="datetime-arrow">→</span>
          <input type="datetime-local" v-model="searchEndTime" class="datetime-input" step="1" />
          <input type="text" v-model="searchTerminalId" class="terminal-input" placeholder="请输入终端ID" />
          <button class="query-btn" @click="handleSearch">查询</button>
          <button class="export-btn" @click="handleExport">导出</button>
        </div>
      </section>

      <!-- 软件控制 - 设备信息页-->
      <section v-if="activeMenu === 3" class="device-page">
        <div class="device-section device-config-section">
          <div class="device-section-header">
            <div>
              <div class="device-section-title">设备配置</div>
            </div>
            <div class="device-config-toolbar">
              <button class="query-btn" :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice" @click="handleSaveDeviceConfig">
                {{ deviceConfigSaving ? '保存中...' : '保存配置' }}
              </button>
              <button class="danger-btn" :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice" @click="handleReboot">
                {{ rebootingDevice ? '重启中...' : '设备重启' }}
              </button>
              <button class="danger-btn danger-btn-secondary" :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice || shuttingDownDevice" @click="handleShutdown">
                {{ shuttingDownDevice ? '关机中...' : '设备关机' }}
              </button>
            </div>
          </div>

          <div
            v-if="deviceConfigMessage"
            class="device-config-message"
            :class="`device-config-message-${deviceConfigMessageType}`"
          >
            {{ deviceConfigMessage }}
          </div>

          <div class="device-config-grid">
            <div class="device-config-field">
              <span class="device-config-label">设备编号</span>
              <input class="device-config-input" :value="deviceConfigMeta.deviceGuid || '-'" type="text" readonly />
            </div>

            <label class="device-config-field">
              <span class="device-config-label">是否是中心节点</span>
              <div class="device-switch-row">
                <label class="device-switch">
                  <input v-model="deviceConfigForm.isCenterNode" type="checkbox" :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice" />
                  <span class="device-switch-slider"></span>
                </label>
                <span class="device-switch-text">{{ deviceConfigForm.isCenterNode ? '是' : '否' }}</span>
              </div>
            </label>

            <div class="device-config-field">
              <span class="device-config-label">主节点 IP</span>
              <input
                v-model.trim="deviceConfigForm.device1IP"
                class="device-config-input"
                type="text"
                placeholder="对应 Device1IP"
                :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
              />
            </div>

            <div class="device-config-field">
              <span class="device-config-label">从节点2 IP</span>
              <input
                v-model.trim="deviceConfigForm.device2IP"
                class="device-config-input"
                type="text"
                placeholder="对应 Device2IP"
                :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
              />
            </div>

            <div class="device-config-field">
              <span class="device-config-label">从节点3 IP</span>
              <input
                v-model.trim="deviceConfigForm.device3IP"
                class="device-config-input"
                type="text"
                placeholder="对应 Device3IP"
                :disabled="deviceConfigLoading || deviceConfigSaving || rebootingDevice"
              />
            </div>
          </div>
        </div>

        <div class="device-section device-card-section">
          <div class="device-section-header">
            <div>
              <div class="device-section-title">设备运行信息</div>
              <div class="device-section-desc">展示当前三台设备的在线状态、资源占用与自组网入口。</div>
            </div>
          </div>
          <div class="device-table-wrapper">
            <table class="device-table">
              <thead>
                <tr>
                  <th>设备名称</th>
                  <th>更新时间</th>
                  <th>已工作时间</th>
                  <th>磁盘已用/总量(GB)</th>
                  <th>磁盘剩余(GB)</th>
                  <th>CPU使用率(%)</th>
                  <th>自组网</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(dev, i) in deviceList" :key="i">
                  <td><span class="status-light" :class="dev.isOnline ? 'online' : 'offline'"></span>{{ dev.name }}</td>
                  <td>{{ dev.lastWorkedTime }}</td>
                  <td>{{ dev.workedTime }}</td>
                  <td>{{ dev.diskUsedGB }} / {{ dev.diskTotalGB }}</td>
                  <td>{{ dev.diskAvailGB }}</td>
                  <td :class="{ 'cpu-high': dev.cpuUsagePercent > 80 }">{{ dev.cpuUsagePercent }}</td>
                  <td><button class="mesh-btn" @click="openMeshPage(i + 1)">前往自组网</button></td>
                </tr>
                <tr v-if="deviceList.length === 0">
                  <td colspan="7" class="empty-row">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- 底部通信事件表格锛堜粎实时位置椤垫樉绀猴級 -->
      <section v-if="activeMenu === 0" class="table-panel">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>设备号</th>
                <th>识别码</th>
                <th>通信起始时间</th>
                <th>通信截止时间</th>
                <th>通信时长(秒)</th>
                <th>IMEI</th>
                <th>定位经纬度</th>
                <th>载荷信息</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in commTableData" :key="i">
                <td>{{ row.deviceNumber }}</td>
                <td>{{ row.chainID }}</td>
                <td>{{ row.startTime }}</td>
                <td>{{ row.endTime }}</td>
                <td>{{ row.duration }}</td>
                <td>{{ row.imei }}</td>
                <td>
                  <div class="latlon-cell">
                    <span class="latlon-text">{{ row.locationLatLon || '-' }}</span>
                    <button v-if="row.locationLatLon" class="location-view-btn" @click="openLocationPreview(row)">查看</button>
                  </div>
                </td>
                <td><button class="payload-btn" @click="openPayloadModal(row)">查看载荷</button></td>
                <td>
                  <div class="detail-actions">
                    <button class="detail-btn" @click="showLCWDetail(row)">查看</button>
                    <button class="detail-export-btn" @click="handleLCWDetailExport(row)">导出</button>
                  </div>
                </td>
              </tr>
              <tr v-if="commTableData.length === 0">
                <td colspan="9" class="empty-row">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- 轨迹弹窗 -->
    <div v-if="showTrajectoryModal" class="trajectory-modal-overlay" @click.self="closeTrajectoryModal">
      <div class="trajectory-modal">
        <div class="trajectory-modal-header">
          <span>终端轨迹 - {{ trajectoryTerminalId }}  {{ trajectoryTimeRange }}</span>
          <button class="trajectory-modal-close" @click="closeTrajectoryModal">&times;</button>
        </div>
        <div class="trajectory-modal-body">
          <div id="trajectoryMap" style="width:100%;height:100%;"></div>
        </div>
      </div>
    </div>

    <!-- 定位预览弹窗 -->
    <div v-if="showLocationModal" class="trajectory-modal-overlay" @click.self="closeLocationPreview">
      <div class="trajectory-modal location-preview-modal">
        <div class="trajectory-modal-header">
          <span>定位预览 - {{ locationPreviewLatLon }}</span>
          <button class="trajectory-modal-close" @click="closeLocationPreview">&times;</button>
        </div>
        <div class="trajectory-modal-body">
          <div id="locationPreviewMap" style="width:100%;height:100%;"></div>
        </div>
      </div>
    </div>

    <!-- LCW详情弹窗 -->
    <div v-if="showLCWModal" class="trajectory-modal-overlay" @click.self="showLCWModal = false">
      <div class="trajectory-modal" style="width:90vw;height:80vh;">
        <div class="trajectory-modal-header">
          <span>LCW 详情</span>
          <button class="trajectory-modal-close" @click="showLCWModal = false">&times;</button>
        </div>
        <div class="trajectory-modal-body" style="overflow:auto;">
          <div v-if="lcwLoading" class="loading-overlay" style="position:relative;height:100%;display:flex;align-items:center;justify-content:center;">
            <div class="loading-spinner"></div>
            <span class="loading-text">加载中..</span>
          </div>
          <div v-else class="lcw-detail-wrapper">
            <table class="device-table lcw-detail-table" style="width:100%;">
              <thead>
                <tr>
                  <th v-for="col in lcwDetailColumns" :key="col.key" class="filterable-th">
                    <span>{{ col.label }}</span>
                    <button
                      class="filter-icon-btn"
                      :class="{ 'filter-active': lcwDetailFilters[col.key]?.size > 0 }"
                      @click.stop="toggleLCWFilterDropdown(col.key, $event)"
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                      </svg>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in lcwDetailFilteredData" :key="i">
                  <td
                    v-for="col in lcwDetailColumns"
                    :key="col.key"
                    :style="col.key === 'rawLine' ? 'text-align:left;word-break:break-all;' : ''"
                  >
                    {{ row[col.key] }}
                  </td>
                </tr>
                <tr v-if="lcwDetailFilteredData.length === 0 && !lcwLoading">
                  <td :colspan="lcwDetailColumns.length" class="empty-row">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <!-- 载荷信息弹窗 -->
    <div v-if="showPayloadModal" class="trajectory-modal-overlay" @click.self="showPayloadModal = false">
      <div class="payload-modal">
        <div class="trajectory-modal-header">
          <span>载荷信息</span>
          <button class="trajectory-modal-close" @click="showPayloadModal = false">&times;</button>
        </div>
        <div class="payload-modal-body">
          <div v-for="section in currentPayloadSections" :key="section.label" class="payload-section">
            <div class="payload-section-label" :style="{ color: section.color }">{{ section.label }}</div>
            <div class="payload-tags">
              <!-- 璇煶閫氳瘽锛氭瘡鏉℃樉绀轰笅杞芥寜閽?-->
              <template v-if="section.type === 'wav'">
                <button
                  v-for="(val, vi) in section.values"
                  :key="vi"
                  class="wav-download-btn"
                  @click="downloadWav(val, currentPayloadData.chainID, vi)"
                >
                  <span class="wav-icon">&#9654;</span> 语音{{ vi + 1 }}.wav
                </button>
              </template>
              <!-- 鏂囨湰类型锛氬琛屽睍绀?-->
              <template v-else-if="section.type === 'text'">
                <div class="payload-text-block">
                  <span v-for="(line, li) in section.text.split('\n')" :key="li" class="payload-text-line">{{ line }}</span>
                </div>
              </template>
              <!-- 鏍囩类型 -->
              <template v-else>
                <span v-for="(val, vi) in section.values" :key="vi" class="payload-tag" :style="{ borderColor: section.color, color: section.color }">{{ val }}</span>
              </template>
            </div>
          </div>
          <div v-if="currentPayloadSections.length === 0" class="empty-row" style="padding:24px 0;">暂无载荷数据</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 列筛选変笅鎷夛紙Teleport 鍒?body锛宖ixed 瀹氫綅锛屼笉琚?overflow 瑁佸壀锛?-->
  <Teleport to="body">
    <div
      v-if="activeFilterCol"
      class="filter-dropdown"
      :style="{ top: filterDropdownPos.top + 'px', left: filterDropdownPos.left + 'px' }"
      @click.stop
    >
      <input type="text" class="filter-search" v-model="filterSearchText" placeholder="搜索..." />
      <div class="filter-actions">
        <button @click="filterSelectAll(activeFilterCol)">全选</button>
        <button @click="filterClearAll(activeFilterCol)">清除</button>
      </div>
      <div class="filter-options">
        <label
          v-for="val in getFilteredOptions(activeFilterCol)"
          :key="val"
          class="filter-option"
        >
          <input type="checkbox" :checked="fileQueryFilters[activeFilterCol]?.has(val)" @change="toggleFilterValue(activeFilterCol, val)" />
          <span>{{ val || '(空)' }}</span>
        </label>
        <div v-if="getFilteredOptions(activeFilterCol).length === 0" class="filter-empty">无匹配项</div>
      </div>
      <div class="filter-footer">
        <button class="filter-confirm" @click="activeFilterCol = null">确定</button>
      </div>
    </div>
  </Teleport>
  <Teleport to="body">
    <div
      v-if="lcwActiveFilterCol"
      class="filter-dropdown"
      :style="{ top: lcwFilterDropdownPos.top + 'px', left: lcwFilterDropdownPos.left + 'px' }"
      @click.stop
    >
      <input type="text" class="filter-search" v-model="lcwFilterSearchText" placeholder="搜索..." />
      <div class="filter-actions">
        <button @click="lcwFilterSelectAll(lcwActiveFilterCol)">全选</button>
        <button @click="lcwFilterClearAll(lcwActiveFilterCol)">清除</button>
      </div>
      <div class="filter-options">
        <label
          v-for="val in getLCWFilteredOptions(lcwActiveFilterCol)"
          :key="val"
          class="filter-option"
        >
          <input type="checkbox" :checked="lcwDetailFilters[lcwActiveFilterCol]?.has(val)" @change="toggleLCWFilterValue(lcwActiveFilterCol, val)" />
          <span>{{ val || '(空)' }}</span>
        </label>
        <div v-if="getLCWFilteredOptions(lcwActiveFilterCol).length === 0" class="filter-empty">无匹配项</div>
      </div>
      <div class="filter-footer">
        <button class="filter-confirm" @click="lcwActiveFilterCol = null">确定</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 侧栏菜单
const activeMenu = ref(0)
const sidebarCollapsed = ref(false)

const menuItems = [
  { label: '实时位置', icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>' },
  { label: '内容查询', icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/>' },
  { label: '位置展示', icon: '<circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 00-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 00-8-8z"/>' },
  { label: '设备信息', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>' },
]

// 鍦板浘鎺т欢鐘舵€?- 实时位置
const queryMode = ref('realtime')
const calStepSecond = ref('60')
const timeRange = ref('2hour')
const refreshInterval = ref('10min')

// 位置展示查询参数
const searchQueryMode = ref('realtime')
const searchCalStepSecond = ref('60')
const searchStartTime = ref('')
const searchEndTime = ref('')
const searchTerminalId = ref('')

// LCW详情弹窗
const showLCWModal = ref(false)
const lcwDetailData = ref([])
const lcwLoading = ref(false)
const lcwDetailColumns = [
  { key: 'deviceNumber', label: '设备编号' },
  { key: 'time', label: '时间' },
  { key: 'isUl', label: '方向' },
  { key: 'frequency', label: '频率' },
  { key: 'imei', label: 'IMEI' },
  { key: 'chn', label: '信道' },
  { key: 'signaling', label: '信号类型' },
  { key: 'frameType', label: '帧类型' },
  { key: 'rawLine', label: '原始数据' },
]
const lcwDetailFilters = reactive(
  Object.fromEntries(lcwDetailColumns.map(c => [c.key, new Set()]))
)
const lcwActiveFilterCol = ref(null)
const lcwFilterSearchText = ref('')
const lcwFilterDropdownPos = ref({ top: 0, left: 0 })

const lcwDetailFilteredData = computed(() => {
  return lcwDetailData.value.filter(row => {
    return lcwDetailColumns.every(col => {
      const selected = lcwDetailFilters[col.key]
      if (!selected || selected.size === 0) return true
      return selected.has(String(row[col.key] || ''))
    })
  })
})

// 轨迹弹窗
const showTrajectoryModal = ref(false)
const trajectoryTerminalId = ref('')
const trajectoryTimeRange = ref('')
let trajectoryMap = null
const showLocationModal = ref(false)
const locationPreviewLatLon = ref('')
let locationPreviewMap = null

// 内容查询参数
const fileQueryStartTime = ref('')
const fileQueryEndTime = ref('')
const fileQueryOnlyUl = ref(true)
const fileQueryOnlyImei = ref(true)
const fileQueryOnlyLocation = ref(true)
const fileQueryImeiFilter = ref('')

// 载荷杩囨护
const payloadFilterCommType = ref(false)
const payloadFilterSignaling = ref(false)
const payloadFilterIdappXYZ = ref(false)
const payloadFilterAircraft = ref(false)
const payloadFilterVoice = ref(false)
const payloadFilterSms = ref(false)
const payloadFilterIp = ref(false)
const payloadFilterLowSpeed = ref(false)
const payloadFilterIdapp = ref(false)
const fileQueryTableData = ref([])
const fileQueryPage = ref(1)
const fileQueryPageSize = 50

const fileQueryColumns = [
  { key: 'deviceNumber', label: '设备编号', width: '65px' },
  { key: 'chainID', label: '识别码', width: '145px' },
  { key: 'startTime', label: '通信起始时间', width: '130px' },
  { key: 'endTime', label: '通信截止时间', width: '130px' },
  { key: 'duration', label: '通信时长(秒)', width: '78px' },
  { key: 'imei', label: 'IMEI', width: '110px' },
  { key: 'locationLatLon', label: '定位经纬度', width: '180px' },
  { key: 'payloadInfo', label: '载荷信息', width: '74px', noFilter: true },
]

// 列筛选状态：每列一个 Set，空 Set 表示不过滤
const fileQueryFilters = reactive(
  Object.fromEntries(fileQueryColumns.map(c => [c.key, new Set()]))
)
const activeFilterCol = ref(null)
const filterSearchText = ref('')
const filterDropdownPos = ref({ top: 0, left: 0 })

// 获取某列所有唯一值
function getColumnUniqueValues(key) {
  const vals = new Set()
  fileQueryTableData.value.forEach(row => vals.add(String(row[key] || '')))
  return [...vals].sort()
}

// 鑾峰彇绛涢€夋悳绱㈠悗鐨勯€夐」
function getFilteredOptions(key) {
  const all = getColumnUniqueValues(key)
  if (!filterSearchText.value) return all
  const kw = filterSearchText.value.toLowerCase()
  return all.filter(v => v.toLowerCase().includes(kw))
}

function toggleFilterDropdown(key, event) {
  if (activeFilterCol.value === key) {
    activeFilterCol.value = null
  } else {
    activeFilterCol.value = key
    filterSearchText.value = ''
    // 鐢ㄦ寜閽潗鏍囧畾浣嶏紝閬垮厤琚?overflow:auto 瑁佸壀
    if (event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect()
      filterDropdownPos.value = {
        top: rect.bottom + 4,
        left: rect.left,
      }
    }
  }
}

function toggleFilterValue(key, val) {
  const s = fileQueryFilters[key]
  if (s.has(val)) s.delete(val)
  else s.add(val)
  fileQueryPage.value = 1
}

function filterSelectAll(key) {
  const all = getFilteredOptions(key)
  const s = fileQueryFilters[key]
  all.forEach(v => s.add(v))
  fileQueryPage.value = 1
}

function filterClearAll(key) {
  fileQueryFilters[key].clear()
  fileQueryPage.value = 1
}

function getLCWColumnUniqueValues(key) {
  const vals = new Set()
  lcwDetailData.value.forEach(row => vals.add(String(row[key] || '')))
  return [...vals].sort()
}

function getLCWFilteredOptions(key) {
  const all = getLCWColumnUniqueValues(key)
  if (!lcwFilterSearchText.value) return all
  const kw = lcwFilterSearchText.value.toLowerCase()
  return all.filter(v => v.toLowerCase().includes(kw))
}

function toggleLCWFilterDropdown(key, event) {
  if (lcwActiveFilterCol.value === key) {
    lcwActiveFilterCol.value = null
  } else {
    lcwActiveFilterCol.value = key
    lcwFilterSearchText.value = ''
    if (event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect()
      lcwFilterDropdownPos.value = {
        top: rect.bottom + 4,
        left: rect.left,
      }
    }
  }
}

function toggleLCWFilterValue(key, val) {
  const s = lcwDetailFilters[key]
  if (s.has(val)) s.delete(val)
  else s.add(val)
}

function lcwFilterSelectAll(key) {
  const all = getLCWFilteredOptions(key)
  const s = lcwDetailFilters[key]
  all.forEach(v => s.add(v))
}

function lcwFilterClearAll(key) {
  lcwDetailFilters[key].clear()
}

const fileQueryFilteredData = computed(() => {
  return fileQueryTableData.value.filter(row => {
    // IMEI 文本过滤（前端，模糊匹配）
    if (fileQueryImeiFilter.value.trim()) {
      const kw = fileQueryImeiFilter.value.trim().toLowerCase()
      if (!String(row.imei || '').toLowerCase().includes(kw)) return false
    }

    // 列筛选夛紙noFilter 鍒楄烦杩囷級
    if (!fileQueryColumns.every(col => {
      if (col.noFilter) return true
      const selected = fileQueryFilters[col.key]
      if (!selected || selected.size === 0) return true
      return selected.has(String(row[col.key] || ''))
    })) return false

    // 载荷过滤（勾选的条件必须全部满足）
    const d = row.payloadData || {}
    if (payloadFilterCommType.value && !(d.commType?.length > 0)) return false
    if (payloadFilterSignaling.value && !(d.signaling?.length > 0)) return false
    if (payloadFilterIdappXYZ.value && !(d.idappXYZ?.length > 0)) return false
    if (payloadFilterAircraft.value && !(d.acars?.length > 0)) return false
    if (payloadFilterVoice.value && !(d.voiceWavs?.length > 0)) return false
    if (payloadFilterSms.value && !(d.sms?.length > 0)) return false
    if (payloadFilterIp.value && !d.isIp) return false
    if (payloadFilterLowSpeed.value && !d.isLowSpeedData) return false
    if (payloadFilterIdapp.value && !d.parsedData) return false

    return true
  })
})

const fileQueryTotalPages = computed(() =>
  Math.max(1, Math.ceil(fileQueryFilteredData.value.length / fileQueryPageSize))
)

const fileQueryPagedData = computed(() => {
  const start = (fileQueryPage.value - 1) * fileQueryPageSize
  return fileQueryFilteredData.value.slice(start, start + fileQueryPageSize)
})

const fileQueryVisiblePages = computed(() => {
  const total = fileQueryTotalPages.value
  const current = fileQueryPage.value
  const pages = []
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  if (end - start < 4) {
    if (start === 1) end = Math.min(total, start + 4)
    else start = Math.max(1, end - 4)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// 表格数据
const tableData = ref([])
const commTableData = ref([])

// 软件控制 - 设备列表锛堝浐瀹氫笁鍙帮級
const deviceList = ref([
  { name: 'Device1', isOnline: false, ip: '', lastWorkedTime: '', workedTime: '', diskUsedGB: '0.00', diskTotalGB: '0.00', diskAvailGB: '0.00', cpuUsagePercent: 0 },
  { name: 'Device2', isOnline: false, ip: '', lastWorkedTime: '', workedTime: '', diskUsedGB: '0.00', diskTotalGB: '0.00', diskAvailGB: '0.00', cpuUsagePercent: 0 },
  { name: 'Device3', isOnline: false, ip: '', lastWorkedTime: '', workedTime: '', diskUsedGB: '0.00', diskTotalGB: '0.00', diskAvailGB: '0.00', cpuUsagePercent: 0 },
])
const deviceConfigForm = reactive({
  isCenterNode: false,
  device1IP: '',
  device2IP: '',
  device3IP: '',
})
const deviceConfigMeta = reactive({
  deviceGuid: '',
})
const deviceConfigRaw = ref(null)
const deviceConfigLoading = ref(false)
const deviceConfigSaving = ref(false)
const rebootingDevice = ref(false)
const shuttingDownDevice = ref(false)
const deviceConfigMessage = ref('')
const deviceConfigMessageType = ref('info')
let deviceRefreshTimer = null

// 加载状态
const loading = ref(false)

// 倒计时
const countdown = ref(60)
let countdownTimer = null

// 初始化位置展示的默认时间
function initSearchTime() {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 3600 * 1000)
  searchEndTime.value = formatDateTimeLocal(now)
  searchStartTime.value = formatDateTimeLocal(oneHourAgo)
}

function formatDateTimeLocal(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const mapRef = ref(null)
let map = null
let markers = [] // 存储地图上的标记
let refreshTimer = null

// 时间范围映射（小时数）
const timeRangeHours = {
  '1hour': 1, '2hour': 2, '6hour': 6, '12hour': 12, '24hour': 24
}

// 刷新间隔映射锛堟绉掞級
const refreshIntervalMs = {
  '5min': 5 * 60 * 1000,
  '10min': 10 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '60min': 60 * 60 * 1000
}

// 格式化栨棩鏈熶负 API 闇€瑕佺殑鏍煎紡
function formatDateTime(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// 格式化日期用于表格显示// 格式化.NET TimeSpan 字符串// "739699.14:51:03.8393552" 鈫?"739699澶?14:51:03"
// "00:00:12.1426503"        鈫?"00:00:12"
function formatWorkedTime(val) {
  if (!val) return ''
  // 判断是否有天数前缀€锛氬舰濡?"数字.数字:数字:数字"
  const withDays = /^(\d+)\.(\d+):(\d+):(\d+)/.exec(val)
  if (withDays) {
    const [, d, hh, mm, ss] = withDays
    return `${d}天 ${hh.padStart(2,'0')}:${mm.padStart(2,'0')}:${ss.padStart(2,'0')}`
  }
  // 不含天数锛氬舰濡?"HH:mm:ss.fff"
  const nodays = /^(\d+):(\d+):(\d+)/.exec(val)
  if (nodays) {
    const [, hh, mm, ss] = nodays
    return `${hh.padStart(2,'0')}:${mm.padStart(2,'0')}:${ss.padStart(2,'0')}`
  }
  return val
}

// 字节转 GB，保留两位小数
function bytesToGB(bytes) {
  if (!bytes && bytes !== 0) return '0.00'
  return (bytes / (1024 ** 3)).toFixed(2)
}

function setDeviceConfigMessage(message, type = 'info') {
  deviceConfigMessage.value = message
  deviceConfigMessageType.value = type
}

function formatDisplay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatDisplayPlus8(dateStr) {
  if (!dateStr) return ''
  // 强制按 UTC 解析（服务端返回无时区字符串）
  const utcStr = String(dateStr).replace(' ', 'T') + 'Z'
  const d = new Date(new Date(utcStr).getTime() + 8 * 3600 * 1000)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

// 璁＄畻閫氫俊鏃堕暱
function getChainIdFromItem(item) {
  return String(item?.chainID ?? item?.ChainID ?? item?.chainId ?? item?.ChainId ?? '').trim()
}

function formatLocationLatLon(item) {
  const lat = item?.['定位经纬度Lat'] ?? item?.定位经纬度Lat ?? item?.locationLat ?? item?.LocationLat ?? item?.lat ?? item?.Lat
  const lon = item?.['定位经纬度Lon'] ?? item?.定位经纬度Lon ?? item?.locationLon ?? item?.LocationLon ?? item?.lon ?? item?.Lon

  const latText = String(lat ?? '').trim()
  const lonText = String(lon ?? '').trim()
  if (latText && lonText) {
    const latNum = Number(latText)
    const lonNum = Number(lonText)
    if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
      if (latNum === 0 && lonNum === 0) return ''
      return `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`
    }
    return `${latText}, ${lonText}`
  }

  const fallback = String(item?.locationLatLon ?? item?.LocationLatLon ?? '').trim()
  if (!fallback) return ''
  const parts = fallback.split(/[,\s，]+/).filter(Boolean)
  if (parts.length >= 2) {
    const latNum = Number(parts[0])
    const lonNum = Number(parts[1])
    if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
      if (latNum === 0 && lonNum === 0) return ''
      return `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`
    }
  }
  return fallback
}

function parseLatLonText(text) {
  const parts = String(text || '')
    .split(/[,\s，]+/)
    .map(s => s.trim())
    .filter(Boolean)
  if (parts.length < 2) return null
  const lat = Number(parts[0])
  const lon = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat === 0 && lon === 0) return null
  return { lat, lon }
}

function openLocationPreview(row) {
  const parsed = parseLatLonText(row?.locationLatLon)
  if (!parsed) return

  locationPreviewLatLon.value = `${parsed.lat.toFixed(6)}, ${parsed.lon.toFixed(6)}`
  showLocationModal.value = true

  nextTick(() => {
    if (locationPreviewMap) {
      locationPreviewMap.remove()
      locationPreviewMap = null
    }

    locationPreviewMap = L.map('locationPreviewMap', {
      center: [parsed.lat, parsed.lon],
      zoom: 12,
      zoomControl: true
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(locationPreviewMap)

    L.marker([parsed.lat, parsed.lon]).addTo(locationPreviewMap)
      .bindPopup(`<b>定位点</b><br>纬度: ${parsed.lat.toFixed(6)}<br>经度: ${parsed.lon.toFixed(6)}`)
      .openPopup()

    setTimeout(() => {
      if (locationPreviewMap) locationPreviewMap.invalidateSize()
    }, 120)
  })
}

function closeLocationPreview() {
  showLocationModal.value = false
  if (locationPreviewMap) {
    locationPreviewMap.remove()
    locationPreviewMap = null
  }
}

function calcDuration(start, end) {
  if (!start || !end) return ''
  const ms = new Date(end) - new Date(start)
  if (ms < 0) return ''
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h${m}m${s}s`
  if (m > 0) return `${m}m${s}s`
  return `${s}s`
}

// 解析 .NET TimeSpan 字符串为秒数锛堜繚鐣?浣嶅皬鏁帮級
function parseDurationToSeconds(dur) {
  if (dur === null || dur === undefined || dur === '') return ''
  // If already a number, just format it
  if (typeof dur === 'number') return dur.toFixed(2)
  // If string that looks like a number (no colons)
  if (typeof dur === 'string' && !dur.includes(':')) return parseFloat(dur).toFixed(2)
  // 格式: "HH:MM:SS.xxx" 鎴?"D.HH:MM:SS.xxx"
  const parts = dur.split(':')
  if (parts.length < 3) return dur
  let h = 0, m = 0, s = 0
  if (parts.length === 3) {
    const dayHour = parts[0].split('.')
    if (dayHour.length === 2) {
      h = parseInt(dayHour[0]) * 24 + parseInt(dayHour[1])
    } else {
      h = parseInt(parts[0])
    }
    m = parseInt(parts[1])
    s = parseFloat(parts[2])
  }
  const totalSec = h * 3600 + m * 60 + s
  return totalSec.toFixed(2)
}

// 调用 API 获取坐标数据
async function fetchCoordinateData() {
  const now = new Date()
  const hours = timeRangeHours[timeRange.value] || 2
  const startTime = new Date(now.getTime() - hours * 3600 * 1000)

  const isRealtime = queryMode.value === 'realtime'

  const params = new URLSearchParams({
    StartTime: formatDateTime(startTime),
    EndTime: formatDateTime(now),
    LocateByCoummounication: isRealtime ? 'true' : 'false',
    LocateByImeiOrTmsi: 'false',
    TargetImeiOrTmsi: '',
    isshowdevice: 'true',
    ...(isRealtime ? {} : { CalStepSecond: calStepSecond.value })
  })

  try {
    const resp = await fetch(`/api/Result/SearchCoordinate?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)

    if (result.data) {
      // 更新表格数据
      tableData.value = result.data.map(item => ({
        terminalId: item.terminalID || '',
        chainID: getChainIdFromItem(item),
        startTime: formatDisplayPlus8(item.startTime),
        endTime: formatDisplayPlus8(item.endTime),
        duration: calcDuration(item.startTime, item.endTime),
        longitude: item.longitude,
        latitude: item.latitude,
        altitude: item.altitude,
        lastDataTime: formatDisplay(item.lastDataTime)
      }))

      // 更新地图标记
      updateMapMarkers(result.data)
    }
  } catch (err) {
    console.error('获取坐标数据失败:', err)
  }
}

// 更新地图上的标记
// 判断是否为设备标记帮紙device1/2/3锛屽彧鏈夊潗鏍囨病鏈夋椂闂达級
function isDeviceMarker(item) {
  const id = (item.terminalID || '').toLowerCase()
  return id.startsWith('devive') || id.startsWith('device')
}

// 创建设备图钉图标
function createPinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="#fff"/>
  </svg>`
  return L.divIcon({
    html: svg,
    className: 'pin-icon',
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38]
  })
}

// 閲嶅彔鐐硅仛鍚堢姸鎬侊細key -> { lat, lng, items, clusterMarker, expanded, individualMarkers }
let clusterGroups = {}

function createClusterIcon(count) {
  const r = count > 99 ? 20 : count > 9 ? 18 : 16
  const d = r * 2
  const h = d + r * 0.7
  const fs = count > 99 ? 11 : 13
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${h}" viewBox="0 0 ${d} ${h}">
    <circle cx="${r}" cy="${r}" r="${r - 1.5}" fill="#1890ff" stroke="#fff" stroke-width="2.5"/>
    <polygon points="${r - 6},${d - 3} ${r + 6},${d - 3} ${r},${h}" fill="#1890ff"/>
    <text x="${r}" y="${r + fs * 0.38}" text-anchor="middle" fill="#fff"
      font-size="${fs}" font-weight="700" font-family="sans-serif">${count}</text>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [d, h],
    iconAnchor: [r, h], // 尖角底部为锚点
  })
}

// 鍒涘缓鍗曚釜缁堢鏍囪骞舵坊鍔犲埌鍦板浘
function createSingleMarker(item, lat, lng) {
  let marker
  const chainID = getChainIdFromItem(item)
  if (isDeviceMarker(item)) {
    marker = L.marker([lat, lng], { icon: createPinIcon('#52c41a') }).addTo(map)
    marker.bindPopup(
      `<b>${item.terminalID}</b>${chainID ? `<br>识别码: ${chainID}` : ''}<br>经度: ${item.longitude.toFixed(6)}<br>纬度: ${item.latitude.toFixed(6)}`
    )
  } else {
    const hasTerminal = !!item.terminalID
    marker = L.circleMarker([lat, lng], {
      radius: 7,
      fillColor: hasTerminal ? '#1890ff' : '#e74c3c',
      color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85
    }).addTo(map)
    const popupContent = document.createElement('div')
    popupContent.style.cssText = 'font-size:13px;line-height:1.8;min-width:180px;'
    popupContent.innerHTML =
      `<div style="font-weight:600;font-size:14px;color:#1e3a5f;border-bottom:1px solid #e8e8e8;padding-bottom:4px;margin-bottom:4px;">终端: ${item.terminalID || '无'}</div>` +
      (chainID ? `<div>识别码: ${chainID}</div>` : '') +
      `<div>经度: ${item.longitude.toFixed(6)}</div>` +
      `<div>纬度: ${item.latitude.toFixed(6)}</div>` +
      `<div>时间: ${formatDisplay(item.lastDataTime)}</div>`
    if (hasTerminal) {
      const btn = document.createElement('button')
      btn.textContent = '查询轨迹'
      btn.style.cssText = 'margin-top:8px;padding:4px 14px;background:#1890ff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;width:100%;'
      btn.onmouseenter = () => btn.style.background = '#096dd9'
      btn.onmouseleave = () => btn.style.background = '#1890ff'
      btn.onclick = () => queryTrajectory(item.terminalID)
      popupContent.appendChild(btn)
    }
    marker.bindPopup(popupContent)
  }
  return marker
}

// 展开聚合：移除聚合图标，在圆形范围内显示各终端标记
function expandCluster(key) {
  const g = clusterGroups[key]
  if (!g || g.expanded) return
  map.removeLayer(g.clusterMarker)
  g.expanded = true
  g.individualMarkers = []
  const n = g.items.length
  const R = 0.0004

  // 半透明背景圆，视觉上框住散开的标记
  const bgCircle = L.circle([g.lat, g.lng], {
    radius: 55,          // 绫筹紝涓庢暎寮€鍗婂緞鍖归厤
    color: '#ff4d4f',
    weight: 1.5,
    opacity: 0.5,
    fillColor: '#ff4d4f',
    fillOpacity: 0.08,
    interactive: false,
  }).addTo(map)
  g.individualMarkers.push(bgCircle)

  g.items.forEach((item, idx) => {
    const angle = (2 * Math.PI * idx) / n - Math.PI / 2
    const lat = g.lat + R * Math.cos(angle)
    const lng = g.lng + R * Math.sin(angle)
    const m = createSingleMarker(item, lat, lng)
    g.individualMarkers.push(m)
  })
  // 鏀惰捣鎸夐挳
  const collapseIcon = L.divIcon({
    html: `<div class="map-cluster-collapse">×</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
  const collapseMarker = L.marker([g.lat, g.lng], { icon: collapseIcon, zIndexOffset: 1000 }).addTo(map)
  collapseMarker.on('click', () => collapseCluster(key))
  g.collapseMarker = collapseMarker
  g.individualMarkers.push(collapseMarker)
}

// 收起聚合：移除各终端标记，恢复聚合图标
function collapseCluster(key) {
  const g = clusterGroups[key]
  if (!g || !g.expanded) return
  g.individualMarkers.forEach(m => map.removeLayer(m))
  g.individualMarkers = []
  g.collapseMarker = null
  g.expanded = false
  g.clusterMarker.addTo(map)
}

function updateMapMarkers(data) {
  // 清除鏃ф爣璁帮紙鍚凡灞曞紑鐨勪釜浣撴爣璁帮級
  markers.forEach(m => map.removeLayer(m))
  Object.values(clusterGroups).forEach(g => {
    g.individualMarkers.forEach(m => map.removeLayer(m))
  })
  markers = []
  clusterGroups = {}

  if (!data || data.length === 0) return

  // 按精确坐标分组
  const coordGroups = {}
  data.forEach(item => {
    if (!item.latitude || !item.longitude || item.latitude === 0 || item.longitude === 0) return
    const key = `${item.latitude.toFixed(6)},${item.longitude.toFixed(6)}`
    if (!coordGroups[key]) coordGroups[key] = []
    coordGroups[key].push(item)
  })

  Object.entries(coordGroups).forEach(([key, group]) => {
    const [lat, lng] = key.split(',').map(Number)
    if (group.length === 1) {
      // 单点，直接渲染
      markers.push(createSingleMarker(group[0], lat, lng))
    } else {
      // 多点重叠，显示聚合图标
      const clusterMarker = L.marker([lat, lng], { icon: createClusterIcon(group.length), zIndexOffset: 500 }).addTo(map)
      clusterMarker.on('click', () => expandCluster(key))
      markers.push(clusterMarker)
      clusterGroups[key] = { lat, lng, items: group, clusterMarker, expanded: false, individualMarkers: [], collapseMarker: null }
    }
  })

  // 涓嶈嚜鍔ㄧ缉鏀惧湴鍥撅紝淇濈暀鐢ㄦ埛褰撳墠瑙嗚
}

// 查询LCW详情
async function showLCWDetail(row) {
  showLCWModal.value = true
  lcwDetailData.value = []
  lcwLoading.value = true
  lcwDetailColumns.forEach(c => lcwDetailFilters[c.key].clear())
  lcwActiveFilterCol.value = null
  lcwFilterSearchText.value = ''
  try {
    lcwDetailData.value = await fetchLCWDetailRows(row)
  } catch (err) {
    console.error('查询LCW详情失败:', err)
  } finally {
    lcwLoading.value = false
  }
  return

  showLCWModal.value = true
  lcwDetailData.value = []
  lcwLoading.value = true
  lcwDetailColumns.forEach(c => lcwDetailFilters[c.key].clear())
  lcwActiveFilterCol.value = null
  lcwFilterSearchText.value = ''

  // 使用查询时的时间范围锛岃€岄潪琛屾暟鎹殑时间
  let startTime, endTime
  if (activeMenu.value === 0) {
    // 实时位置 - 当前时间减去时间范围
    const now = new Date()
    const hours = timeRangeHours[timeRange.value] || 2
    const start = new Date(now.getTime() - hours * 3600 * 1000)
    startTime = formatDateTime(start)
    endTime = formatDateTime(now)
  } else {
    // 内容查询 - 用户选择的时间
    startTime = fileQueryStartTime.value
    endTime = fileQueryEndTime.value
  }

  const params = new URLSearchParams({
    StartTime: startTime,
    EndTime: endTime,
    ChainID: row.chainID || ''
  })

  try {
    const resp = await fetch(`/api/Result/SearchLCW?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)
    lcwDetailData.value = (result.data || []).map(item => ({
      deviceNumber: item.deviceName ?? item.DeviceName ?? item.deviceNumber ?? item.DeviceNumber ?? '',
      time: formatDisplayPlus8(item.time ?? item.Time),
      isUl: (item.isUl ?? item.IsUl ?? item.isUL ?? item.IsUL) ? '上行' : '下行',
      frequency: item.frequncy ?? item.frequency ?? item.Frequency ?? item.Frequncy ?? '',
      imei: item.imei ?? item.Imei ?? item.IMEI ?? '',
      chn: item.chn ?? item.Chn ?? item.channel ?? item.Channel ?? '',
      signaling: item['信令类型'] ?? item.signaling ?? item.Signaling ?? '',
      frameType: item.frameType ?? item.FrameType ?? '',
      rawLine: item.rawLine ?? item.RawLine ?? ''
    }))
  } catch (err) {
    console.error('查询LCW详情失败:', err)
  } finally {
    lcwLoading.value = false
  }
}

// 查询轨迹
function getLCWQueryTimeRangeForDetail() {
  if (activeMenu.value === 0) {
    const now = new Date()
    const hours = timeRangeHours[timeRange.value] || 2
    const start = new Date(now.getTime() - hours * 3600 * 1000)
    return {
      startTime: formatDateTime(start),
      endTime: formatDateTime(now)
    }
  }
  return {
    startTime: fileQueryStartTime.value,
    endTime: fileQueryEndTime.value
  }
}

function mapLCWDetailRowsForUI(list) {
  return (list || []).map(item => ({
    deviceNumber: item.deviceName ?? item.DeviceName ?? item.deviceNumber ?? item.DeviceNumber ?? '',
    time: formatDisplayPlus8(item.time ?? item.Time),
    isUl: (item.isUl ?? item.IsUl ?? item.isUL ?? item.IsUL) ? '上行' : '下行',
    frequency: item.frequncy ?? item.frequency ?? item.Frequency ?? item.Frequncy ?? '',
    imei: item.imei ?? item.Imei ?? item.IMEI ?? '',
    chn: item.chn ?? item.Chn ?? item.channel ?? item.Channel ?? '',
    signaling: item['信令类型'] ?? item.signaling ?? item.Signaling ?? '',
    frameType: item.frameType ?? item.FrameType ?? '',
    rawLine: item.rawLine ?? item.RawLine ?? ''
  }))
}

async function fetchLCWDetailRows(row) {
  const { startTime, endTime } = getLCWQueryTimeRangeForDetail()
  const params = new URLSearchParams({
    StartTime: startTime,
    EndTime: endTime,
    ChainID: row.chainID || ''
  })

  const resp = await fetch(`/api/Result/SearchLCW?${params}`)
  const text = await resp.text()
  if (!text) return []
  const result = JSON.parse(text)
  return mapLCWDetailRowsForUI(result.data || [])
}

async function handleLCWDetailExport(row) {
  try {
    const rows = await fetchLCWDetailRows(row)
    const cols = lcwDetailColumns
    const header = cols.map(c => csvEscape(c.label)).join(',')
    const lines = rows.map(r => cols.map(c => csvEscape(r?.[c.key] ?? '')).join(','))
    const csv = [header, ...lines].join('\r\n')

    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const chain = String(row?.chainID || 'unknown').replace(/[\\/:*?"<>|]/g, '_')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lcw_detail_${chain}_${ts}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('导出LCW详情澶辫触:', err)
  }
}

async function queryTrajectory(terminalId) {
  trajectoryTerminalId.value = terminalId
  showTrajectoryModal.value = true

  // 根据当前页面获取时间范围
  let startTime, endTime
  if (activeMenu.value === 0) {
    // 实时位置 - 用当前时间和时间范围
    const now = new Date()
    const hours = timeRangeHours[timeRange.value] || 2
    const start = new Date(now.getTime() - hours * 3600 * 1000)
    startTime = formatDateTime(start)
    endTime = formatDateTime(now)
  } else {
    // 位置展示 - 鐢ㄧ敤鎴烽€夌殑时间
    startTime = searchStartTime.value
    endTime = searchEndTime.value
  }

  trajectoryTimeRange.value = `${startTime.replace('T', ' ')} 至 ${endTime.replace('T', ' ')}`

  // 缁ф壙褰撳墠椤甸潰鐨勬ā寮忓拰 CalStepSecond 璁剧疆
  const isRealtime = activeMenu.value === 0
    ? queryMode.value === 'realtime'
    : searchQueryMode.value === 'realtime'
  const stepSecond = activeMenu.value === 0 ? calStepSecond.value : searchCalStepSecond.value

  const params = new URLSearchParams({
    StartTime: startTime,
    EndTime: endTime,
    LocateByCoummounication: isRealtime ? 'true' : 'false',
    LocateByImeiOrTmsi: 'true',
    TargetImeiOrTmsi: terminalId,
    isshowdevice: 'true',
    ...(isRealtime ? {} : { CalStepSecond: stepSecond })
  })

  await nextTick()

  // 初始化轨迹地图
  if (trajectoryMap) {
    trajectoryMap.remove()
    trajectoryMap = null
  }
  trajectoryMap = L.map('trajectoryMap', {
    center: [30, 50],
    zoom: 3,
    zoomControl: true
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(trajectoryMap)

  try {
    const resp = await fetch(`/api/Result/SearchCoordinate?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)

    if (result.data && result.data.length > 0) {
      // 按时间排序
      const sorted = result.data
        .filter(item => item.latitude && item.longitude && item.latitude !== 0 && item.longitude !== 0)
        .sort((a, b) => new Date(a.lastDataTime || a.startTime) - new Date(b.lastDataTime || b.startTime))

      if (sorted.length === 0) return

      const latlngs = sorted.map(item => [item.latitude, item.longitude])

      // 画轨迹线（浅蓝色）
      L.polyline(latlngs, { color: '#91d5ff', weight: 3, opacity: 0.9 }).addTo(trajectoryMap)

      // 在每段线段中间画箭头锛堟鑹?SVG锛?      // 注意锛氬睆骞昚轴向下嬶紝纬度向上锛屾墍浠lat鍙栧弽
      for (let i = 0; i < latlngs.length - 1; i++) {
        const from = latlngs[i]
        const to = latlngs[i + 1]
        const midLat = (from[0] + to[0]) / 2
        const midLng = (from[1] + to[1]) / 2
        const dlat = to[0] - from[0]
        const dlng = to[1] - from[1]
        // 墨卡托投影：经度方向在屏幕上缩短 cos(lat) 倍
        const cosLat = Math.cos(midLat * Math.PI / 180)
        // 屏幕坐标锛歑=dlng*cosLat, Y=-dlat锛圷轴向下嬶級
        const angleDeg = Math.atan2(-dlat, dlng * cosLat) * 180 / Math.PI
        // SVG箭头初始朝右(0掳)锛屽叧浜庝腑蹇冪偣(14,7)瀵圭О
        const arrowSvg = `<svg width="28" height="14" viewBox="0 0 28 14" style="transform:rotate(${angleDeg}deg)"><polygon points="4,2 24,7 4,12" fill="#fa8c16" stroke="#e8740e" stroke-width="0.5"/></svg>`
        const arrowIcon = L.divIcon({
          html: arrowSvg,
          className: 'arrow-icon',
          iconSize: [28, 14],
          iconAnchor: [14, 7]
        })
        L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(trajectoryMap)
      }

      // 起点标记锛堢豢鑹诧級
      L.circleMarker(latlngs[0], {
        radius: 9, fillColor: '#52c41a', color: '#fff', weight: 2, fillOpacity: 1
      }).addTo(trajectoryMap).bindPopup(`<b>起点</b><br>时间: ${formatDisplay(sorted[0].lastDataTime || sorted[0].startTime)}<br>经度: ${sorted[0].longitude.toFixed(6)}<br>纬度: ${sorted[0].latitude.toFixed(6)}`)

      // 终点标记锛堢孩鑹诧級
      const last = sorted[sorted.length - 1]
      L.circleMarker(latlngs[latlngs.length - 1], {
        radius: 9, fillColor: '#e74c3c', color: '#fff', weight: 2, fillOpacity: 1
      }).addTo(trajectoryMap).bindPopup(`<b>终点</b><br>时间: ${formatDisplay(last.lastDataTime || last.startTime)}<br>经度: ${last.longitude.toFixed(6)}<br>纬度: ${last.latitude.toFixed(6)}`)

      // 中间点癸紙深蓝色诧級
      for (let i = 1; i < sorted.length - 1; i++) {
        L.circleMarker(latlngs[i], {
          radius: 5, fillColor: '#1e3a5f', color: '#fff', weight: 1.5, fillOpacity: 0.9
        }).addTo(trajectoryMap).bindPopup(`<b>第${i + 1}点</b><br>时间: ${formatDisplay(sorted[i].lastDataTime || sorted[i].startTime)}<br>经度: ${sorted[i].longitude.toFixed(6)}<br>纬度: ${sorted[i].latitude.toFixed(6)}`)
      }

      // 调整视野
      trajectoryMap.fitBounds(L.latLngBounds(latlngs).pad(0.2))
    }
  } catch (err) {
    console.error('查询轨迹失败:', err)
  }

  // 修正地图尺寸
  setTimeout(() => { if (trajectoryMap) trajectoryMap.invalidateSize() }, 200)
}

function closeTrajectoryModal() {
  showTrajectoryModal.value = false
  if (trajectoryMap) {
    trajectoryMap.remove()
    trajectoryMap = null
  }
}

// 实时位置 - 立即查询
async function handleRealtimeQuery() {
  loading.value = true
  try {
    await Promise.all([fetchCoordinateData(), fetchCommEvents()])
  } finally {
    loading.value = false
  }
  resetCountdown()
}

// 设置自动刷新定时器（1分钟）
function setupRefreshTimer() {
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)

  countdown.value = 60

  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      handleRealtimeQuery()
    }
  }, 1000)
}

function resetCountdown() {
  countdown.value = 60
}

// 监听控件变化，重新查询
watch([queryMode, timeRange], () => {
  if (activeMenu.value === 0) {
    handleRealtimeQuery()
  }
})

// 切换菜单时讹紝娓呯┖鏁版嵁骞跺垏鎹㈤€昏緫
watch(activeMenu, (val) => {
  tableData.value = []
  if (map) {
    markers.forEach(m => map.removeLayer(m))
    markers = []
  }

  // 清除鎵€鏈夊畾鏃跺櫒
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  if (deviceRefreshTimer) { clearInterval(deviceRefreshTimer); deviceRefreshTimer = null }

  if (val === 0) {
    nextTick(() => { if (map) map.invalidateSize() })
    handleRealtimeQuery()
    setupRefreshTimer()
  } else if (val === 1) {
    if (!fileQueryStartTime.value) initFileQueryTime()
  } else if (val === 2) {
    nextTick(() => { if (map) map.invalidateSize() })
    if (!searchStartTime.value) initSearchTime()
  } else if (val === 3) {
    setDeviceConfigMessage('')
    fetchDeviceInfo()
    fetchDeviceConfiguration()
    deviceRefreshTimer = setInterval(fetchDeviceInfo, 120000)
  }
})

// 点击页面其他区域关闭列筛选下拉
function handleGlobalClick() {
  if (activeFilterCol.value) activeFilterCol.value = null
  if (lcwActiveFilterCol.value) lcwActiveFilterCol.value = null
}

onMounted(async () => {
  document.addEventListener('click', handleGlobalClick)
  await nextTick()
  // 鍒濆鍖?Leaflet 鍦板浘
  map = L.map('map', {
    center: [30, 50],
    zoom: 3,
    zoomControl: false
  })

  // 左上角缩放控件
  L.control.zoom({ position: 'topleft' }).addTo(map)

  // OpenStreetMap 在线瓦片
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)

  // 首次加载数据
  handleRealtimeQuery()
  setupRefreshTimer()
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  if (deviceRefreshTimer) clearInterval(deviceRefreshTimer)
  document.removeEventListener('click', handleGlobalClick)
  if (locationPreviewMap) {
    locationPreviewMap.remove()
    locationPreviewMap = null
  }
})

// 位置展示 - 查询（使用 SearchCoordinate 接口）
async function handleSearch() {
  if (!searchStartTime.value || !searchEndTime.value) return

  loading.value = true
  const isRealtime = searchQueryMode.value === 'realtime'
  const params = new URLSearchParams({
    StartTime: searchStartTime.value,
    EndTime: searchEndTime.value,
    LocateByCoummounication: isRealtime ? 'true' : 'false',
    LocateByImeiOrTmsi: searchTerminalId.value ? 'true' : 'false',
    TargetImeiOrTmsi: searchTerminalId.value || '',
    isshowdevice: 'true',
    ...(isRealtime ? {} : { CalStepSecond: searchCalStepSecond.value })
  })

  try {
    const resp = await fetch(`/api/Result/SearchCoordinate?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)

    if (result.data) {
      tableData.value = result.data.map(item => ({
        terminalId: item.terminalID || '',
        chainID: getChainIdFromItem(item),
        startTime: formatDisplayPlus8(item.startTime),
        endTime: formatDisplayPlus8(item.endTime),
        duration: calcDuration(item.startTime, item.endTime),
        longitude: item.longitude,
        latitude: item.latitude,
        altitude: item.altitude,
        lastDataTime: formatDisplay(item.lastDataTime)
      }))
      updateMapMarkers(result.data)
    }
  } catch (err) {
    console.error('查询坐标数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 软件控制 - 获取设备信息锛堝浐瀹氫笁琛岋紝接口无返回时亮红灯級
async function fetchDeviceInfo() {
  // 鍏堟妸鎵€鏈夎澶囨爣涓虹绾匡紝接口返回后再更新
  deviceList.value.forEach(d => d.isOnline = false)
  try {
    const resp = await fetch('/api/Execution/GetMachineUsage')
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)
    const list = Array.isArray(result) ? result : (result.data || [])
    list.forEach((item, idx) => {
      const target = deviceList.value[idx]
      if (!target) return
      target.isOnline = item.isOnline ?? true
      target.ip = item.ip || ''
      target.lastWorkedTime = formatDisplay(item.lastWorkedTime)
      target.workedTime = formatWorkedTime(item.workedTime || '')
      target.diskUsedGB = bytesToGB(item.diskUsedBytes ?? 0)
      target.diskTotalGB = bytesToGB(item.diskTotalBytes ?? 0)
      target.diskAvailGB = bytesToGB(item.diskAvailableBytes ?? 0)
      target.cpuUsagePercent = parseFloat((item.cpuUsagePercent ?? 0).toFixed(1))
    })
  } catch (err) {
    console.error('获取设备信息失败:', err)
  }
}

function applyDeviceConfiguration(data) {
  deviceConfigRaw.value = data ? { ...data } : null
  deviceConfigMeta.deviceGuid = data?.deviceGuid || ''
  deviceConfigForm.isCenterNode = !!data?.isCenterNode
  deviceConfigForm.device1IP = data?.device1IP || ''
  deviceConfigForm.device2IP = data?.device2IP || ''
  deviceConfigForm.device3IP = data?.device3IP || ''
}

async function fetchDeviceConfiguration() {
  deviceConfigLoading.value = true
  try {
    const resp = await fetch('/api/Configuration/Get')
    const text = await resp.text()
    if (!text) {
      setDeviceConfigMessage('未获取到设备配置数据。', 'warning')
      return
    }
    const result = JSON.parse(text)
    if (result?.status !== undefined && result.status !== 1) {
      throw new Error(result?.message || '获取设备配置失败')
    }
    const data = result?.data || result
    applyDeviceConfiguration(data)
    setDeviceConfigMessage('设备配置已加载。', 'success')
  } catch (err) {
    console.error('获取设备配置失败:', err)
    setDeviceConfigMessage(`获取设备配置失败：${err?.message || err}`, 'error')
  } finally {
    deviceConfigLoading.value = false
  }
}

function buildDeviceConfigPayload() {
  const base = deviceConfigRaw.value ? { ...deviceConfigRaw.value } : {}
  return {
    ...base,
    deviceGuid: deviceConfigMeta.deviceGuid || base.deviceGuid || '',
    isCenterNode: !!deviceConfigForm.isCenterNode,
    device1IP: deviceConfigForm.device1IP.trim(),
    device2IP: deviceConfigForm.device2IP.trim(),
    device3IP: deviceConfigForm.device3IP.trim(),
  }
}

async function postDeviceConfiguration(payload) {
  const endpoints = [
    '/api/Configuration/Set',
    '/api/Configuration/Update',
    '/api/Configuration/Save',
  ]
  let lastError = null

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) {
        lastError = new Error(`${url} 返回 ${resp.status}`)
        continue
      }

      const text = await resp.text()
      if (!text) return
      const result = JSON.parse(text)
      if (result?.status !== undefined && result.status !== 1) {
        throw new Error(result?.message || `${url} 保存失败`)
      }
      return
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('保存配置失败')
}

async function handleSaveDeviceConfig() {
  const payload = buildDeviceConfigPayload()
  deviceConfigSaving.value = true
  setDeviceConfigMessage('正在保存设备配置...', 'info')

  try {
    await postDeviceConfiguration(payload)
    deviceConfigRaw.value = { ...payload }
    setDeviceConfigMessage('设备配置已保存。', 'success')
    await fetchDeviceConfiguration()
  } catch (err) {
    console.error('保存设备配置失败:', err)
    setDeviceConfigMessage(`保存设备配置失败：${err?.message || err}`, 'error')
  } finally {
    deviceConfigSaving.value = false
  }
}

async function handleReboot() {
  const ok = window.confirm('确认要重启设备吗？该操作会中断当前设备服务。')
  if (!ok) return

  rebootingDevice.value = true
  setDeviceConfigMessage('正在发送重启指令...', 'warning')

  try {
    const resp = await fetch('/api/Execution/Reboot', { method: 'POST' })
    if (!resp.ok) {
      throw new Error(`重启接口返回 ${resp.status}`)
    }
    setDeviceConfigMessage('重启指令已发送。设备可能会暂时离线，请稍后刷新查看。', 'success')
  } catch (err) {
    console.error('设备重启失败:', err)
    setDeviceConfigMessage(`设备重启失败：${err?.message || err}`, 'error')
  } finally {
    rebootingDevice.value = false
  }
}

async function handleShutdown() {
  const ok = window.confirm('确认要关闭设备吗？设备关机后需要人工重新开机。')
  if (!ok) return

  shuttingDownDevice.value = true
  setDeviceConfigMessage('正在发送关机指令...', 'warning')

  try {
    const resp = await fetch('/api/Execution/Close', { method: 'POST' })
    if (!resp.ok) {
      throw new Error(`关机接口返回 ${resp.status}`)
    }
    setDeviceConfigMessage('关机指令已发送。设备可能会很快离线。', 'success')
  } catch (err) {
    console.error('设备关机失败:', err)
    setDeviceConfigMessage(`设备关机失败：${err?.message || err}`, 'error')
  } finally {
    shuttingDownDevice.value = false
  }
}

// 载荷淇℃伅寮圭獥
const showPayloadModal = ref(false)
const currentPayloadData = ref(null)

const payloadSectionDefs = [
  { key: 'commType',  label: '业务类型',  color: '#1890ff', type: 'tags' },
  { key: 'signaling', label: '信令类型',  color: '#1890ff', type: 'tags' },
  { key: 'tmsi',      label: 'TMSI',    color: '#722ed1', type: 'tags' },
  { key: 'idappXYZ',  label: '播发经纬度', color: '#1890ff', type: 'tags' },
  { key: 'acars',     label: 'ACARS',   color: '#1890ff', type: 'tags' },
  { key: 'ira',       label: 'IRA',      color: '#1890ff', type: 'tags' },
  { key: 'parsedDataTags', label: '解析数据', color: '#1890ff', type: 'tags' },
  { key: 'sms',       label: '短信数据',  color: '#fa8c16', type: 'tags' },
  { key: 'voiceWavs', label: '语音通话',  color: '#52c41a', type: 'wav'  },
  { key: 'voiceInfo', label: '语音附加信息', color: '#52c41a', type: 'text' },
]

const currentPayloadSections = computed(() => {
  if (!currentPayloadData.value) return []
  return payloadSectionDefs
    .map(def => {
      const raw = currentPayloadData.value[def.key]
      if (def.type === 'text') {
        const text = (raw || '').trim()
        return { ...def, text, values: [] }
      }
      const values = Array.isArray(raw) ? raw.filter(Boolean) : (raw ? [String(raw)] : [])
      return { ...def, values }
    })
    .filter(s => s.type === 'text' ? s.text.length > 0 : s.values.length > 0)
})

function openPayloadModal(row) {
  currentPayloadData.value = row.payloadData || null
  showPayloadModal.value = true
}

function toArr(val) {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'object') return [JSON.stringify(val)]
  return [String(val)]
}

function toText(val) {
  if (val === null || val === undefined) return ''
  if (Array.isArray(val)) return val.filter(Boolean).map(v => String(v)).join('\n')
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function splitMultiValueText(text) {
  return String(text || '')
    .split(/[\r\n,，;；]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

function normalizeTmsiValues(val) {
  const rawList = Array.isArray(val)
    ? val.flatMap(v => splitMultiValueText(typeof v === 'object' ? JSON.stringify(v) : v))
    : splitMultiValueText(typeof val === 'object' ? JSON.stringify(val) : val)

  const normalized = rawList
    .map(v => v.replace(/\s+/g, '').toUpperCase())
    .filter(Boolean)

  return [...new Set(normalized)]
}

function normalizeParsedData(raw) {
  if (raw === null || raw === undefined) {
    return { text: '', tags: [] }
  }

  if (Array.isArray(raw)) {
    const tags = raw
      .map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
      .map(s => s.trim())
      .filter(Boolean)
    return { text: tags.join('\n'), tags }
  }

  if (typeof raw === 'object') {
    const tags = Object.entries(raw)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .map(s => s.trim())
      .filter(Boolean)
    return { text: tags.join('\n'), tags }
  }

  const text = toText(raw).trim()
  if (!text) return { text: '', tags: [] }
  const tags = text
    .split(/\r?\n|；|;/)
    .map(s => s.trim())
    .filter(Boolean)
  return { text, tags: tags.length ? tags : [text] }
}

// 提取结构化载荷数据
function extractPayloadData(item) {
  const parsed = normalizeParsedData(item.payloadData ?? item.PayloadData ?? item.IdappRawLine ?? item.idappRawLine)
  const rawIsIp =
    item?.isIp ??
    item?.IsIp ??
    item?.IsIP ??
    item?.['isIp'] ??
    item?.['IsIp'] ??
    item?.['IsIP'] ??
    item?.['isIP数据'] ??
    item?.['IsIP数据'] ??
    item?.['IP数据']
  return {
    commType:   toArr(item.commType),
    signaling:  toArr(item['信令类型']),
    tmsi:       normalizeTmsiValues(item.tmsi ?? item.Tmsi ?? item.TMSI),
    idappXYZ:   toArr(item.idappXYZ ?? item.IdappXYZ),
    acars:      toArr(item.acars ?? item.Acars),
    ira:        toArr(item.ira ?? item.IRA),
    sms:        toArr(item.sms ?? item.Sms ?? item.SMS),
    ipData:     toArr(item.ipData ?? item.IPData ?? item.IpData ?? item.IpRawLine ?? item.ipRawLine),
    isIp:       rawIsIp === true || rawIsIp === 1 || String(rawIsIp ?? '').toLowerCase() === 'true' || String(rawIsIp ?? '') === '1',
    voiceWavs:  toArr(item.VoiceWavs ?? item.voiceWavs),
    voiceInfo:  (item.VoiceInfo ?? item.voiceInfo ?? '').trim(),
    parsedData: parsed.text,
    parsedDataTags: parsed.tags,
    isLowSpeedData: !!(
      item?.isLowSpeedData ??
      item?.IsLowSpeedData ??
      item?.['isLowSpeedData'] ??
      item?.['IsLowSpeedData'] ??
      item?.['低速数据'] ??
      item?.['is低速数据'] ??
      item?.['Is低速数据']
    ),
  }
}

// 格式化栬浇鑽蜂俊鎭负绾枃鏈紙鐢ㄤ簬列筛选夛級
function formatPayloadInfo(item) {
  const d = extractPayloadData(item)
  const parts = []
  if (d.commType.length) parts.push(`业务类型: ${d.commType.join(', ')}`)
  if (d.signaling.length) parts.push(`信令类型: ${d.signaling.join(', ')}`)
  if (d.tmsi.length) parts.push(`TMSI: ${d.tmsi.join(', ')}`)
  if (d.idappXYZ.length) parts.push(`播发经纬度: ${d.idappXYZ.join(', ')}`)
  if (d.acars.length) parts.push(`ACARS: ${d.acars.join(', ')}`)
  if (d.ira.length) parts.push(`IRA: ${d.ira.join(', ')}`)
  if (d.sms.length) parts.push(`短信数据: ${d.sms.join(', ')}`)
  if (d.parsedData) parts.push(`解析数据: ${d.parsedData}`)
  if (d.voiceWavs.length) parts.push(`语音通话: ${d.voiceWavs.length}条`)
  if (d.voiceInfo) parts.push(`语音附加信息: ${d.voiceInfo}`)
  return parts.join('\n')
}

function downloadWav(base64Data, chainID, index) {
  try {
    const binary = atob(base64Data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voice_${chainID || 'unknown'}_${index + 1}.wav`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('WAV涓嬭浇澶辫触', e)
  }
}

// 实时位置 - 获取通信事件
async function fetchCommEvents() {
  const now = new Date()
  const hours = timeRangeHours[timeRange.value] || 2
  const startTime = new Date(now.getTime() - hours * 3600 * 1000)

  const params = new URLSearchParams({
    StartTime: formatDateTime(startTime),
    EndTime: formatDateTime(now),
    OnlyUl: 'false',
    OnlyLocation: 'true',
    Count: '100'
  })

  try {
    const resp = await fetch(`/api/Result/SearchCommEvent?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)
    const list = result.data || []
    commTableData.value = list.map(item => ({
      deviceNumber: item.deviceNumber || '',
      dataCount: `${item.device1Count ?? 0} / ${item.device2Count ?? 0} / ${item.device3Count ?? 0}`,
      startTime: formatDisplayPlus8(item.startTime),
      endTime: formatDisplayPlus8(item.endTime),
      duration: parseDurationToSeconds(item.duration),
      imei: item.imei || '',
      payloadInfo: formatPayloadInfo(item),
      payloadData: extractPayloadData(item),
      locationLatLon: formatLocationLatLon(item),
      chainID: item.chainID || ''
    }))
  } catch (err) {
    console.error('获取通信事件失败:', err)
  }
}

// 内容查询
async function handleFileQuery() {
  if (!fileQueryStartTime.value || !fileQueryEndTime.value) return

  // 清空列过滤
  fileQueryColumns.forEach(c => { if (fileQueryFilters[c.key]) fileQueryFilters[c.key].clear() })
  activeFilterCol.value = null
  fileQueryPage.value = 1

  loading.value = true
  const params = new URLSearchParams({
    StartTime: fileQueryStartTime.value,
    EndTime: fileQueryEndTime.value,
    OnlyUl: String(fileQueryOnlyUl.value),
    OnlyImei: String(fileQueryOnlyImei.value),
    OnlyLocation: String(fileQueryOnlyLocation.value),
    Count: '100000'
  })

  try {
    const resp = await fetch(`/api/Result/SearchCommEvent?${params}`)
    const text = await resp.text()
    if (!text) return
    const result = JSON.parse(text)
    const list = result.data || []
    fileQueryPage.value = 1
    fileQueryTableData.value = list.map(item => ({
      deviceNumber: item.deviceNumber || '',
      dataCount: `${item.device1Count ?? 0} / ${item.device2Count ?? 0} / ${item.device3Count ?? 0}`,
      startTime: formatDisplayPlus8(item.startTime),
      endTime: formatDisplayPlus8(item.endTime),
      duration: parseDurationToSeconds(item.duration),
      imei: item.imei || '',
      payloadInfo: formatPayloadInfo(item),
      payloadData: extractPayloadData(item),
      locationLatLon: formatLocationLatLon(item),
      chainID: item.chainID || ''
    }))
  } catch (err) {
    console.error('内容查询失败:', err)
  } finally {
    loading.value = false
  }
}

function csvEscape(val) {
  const s = String(val ?? '')
    .replace(/\r?\n+/g, ' | ')
    .trim()
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function normalizeExportCell(key, val) {
  const text = String(val ?? '')
  if (key === 'deviceNumber') {
    return text.replace(/[，,]+/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return text
}

function handleFileQueryExport() {
  const cols = fileQueryColumns
  const header = cols.map(c => csvEscape(c.label)).join(',')
  const rows = fileQueryFilteredData.value.map(row =>
    cols.map(c => csvEscape(normalizeExportCell(c.key, row?.[c.key] ?? ''))).join(',')
  )
  const csv = [header, ...rows].join('\r\n')

  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `content_query_${ts}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function handleFileQueryReset() {
  initFileQueryTime()
  fileQueryOnlyUl.value = true
  fileQueryOnlyImei.value = true
  fileQueryOnlyLocation.value = true
  fileQueryTableData.value = []
  fileQueryPage.value = 1
  fileQueryColumns.forEach(c => fileQueryFilters[c.key] = new Set())
  payloadFilterCommType.value = false
  payloadFilterSignaling.value = false
  payloadFilterIdappXYZ.value = false
  payloadFilterAircraft.value = false
  payloadFilterVoice.value = false
  payloadFilterSms.value = false
  payloadFilterIp.value = false
  payloadFilterLowSpeed.value = false
  payloadFilterIdapp.value = false
  fileQueryImeiFilter.value = ''
}

function initFileQueryTime() {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 3600 * 1000)
  fileQueryEndTime.value = formatDateTimeLocal(now)
  fileQueryStartTime.value = formatDateTimeLocal(oneHourAgo)
}

function openMeshPage(deviceNum) {
  window.open(`http://192.168.104.${deviceNum}/`, '_blank')
}

function handleExport() {
  const now = new Date()
  let startTime, endTime, locateByComm, locateByImei, targetImei

  if (activeMenu.value === 0) {
    const hours = timeRangeHours[timeRange.value] || 2
    startTime = formatDateTime(new Date(now.getTime() - hours * 3600 * 1000))
    endTime = formatDateTime(now)
    locateByComm = queryMode.value === 'realtime' ? 'true' : 'false'
    locateByImei = 'false'
    targetImei = ''
  } else if (activeMenu.value === 2) {
    const isRealtime = searchQueryMode.value === 'realtime'
    startTime = searchStartTime.value
    endTime = searchEndTime.value
    locateByComm = isRealtime ? 'true' : 'false'
    locateByImei = searchTerminalId.value ? 'true' : 'false'
    targetImei = searchTerminalId.value || ''
  } else {
    return
  }

  const isRealtimeExport = activeMenu.value === 0
    ? queryMode.value === 'realtime'
    : searchQueryMode.value === 'realtime'
  const stepSecondExport = activeMenu.value === 0 ? calStepSecond.value : searchCalStepSecond.value

  const params = new URLSearchParams({
    StartTime: startTime,
    EndTime: endTime,
    LocateByCoummounication: locateByComm,
    LocateByImeiOrTmsi: locateByImei,
    TargetImeiOrTmsi: targetImei,
    isshowdevice: 'true',
    ...(isRealtimeExport ? {} : { CalStepSecond: stepSecondExport })
  })

  window.open(`/api/Result/DownloadSearchCoordinateCSV?${params}`, '_blank')
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
</script>

<style>
/* ===== 全局重置 ===== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #app {
  height: 100%;
  font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Microsoft YaHei UI", "PingFang SC", "Helvetica Neue", sans-serif;
  font-size: 14px;
  color: #2c3e50;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===== 整体布局 ===== */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ===== 左侧导航栏===== */
.sidebar {
  width: 180px;
  min-width: 180px;
  background: linear-gradient(180deg, #0d4a7a 0%, #062a4f 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  user-select: none;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 22px 16px 28px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
}

.logo-icon {
  width: 26px;
  height: 26px;
  color: #5cc5ff;
  flex-shrink: 0;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  border-radius: 6px;
  border-left: none;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-item.active {
  background: rgba(77, 184, 255, 0.2);
  color: #fff;
  font-weight: 500;
  box-shadow: inset 3px 0 0 #5cc5ff;
}

.menu-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  opacity: 0.85;
}

.menu-item.active .menu-icon {
  opacity: 1;
}

/* ===== 主内容区 ===== */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  overflow: hidden;
}

/* ===== 顶部工具栏===== */
.toolbar {
  height: 46px;
  min-height: 46px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f0f0f0;
}

/* ===== 地图容器 ===== */
.map-container {
  flex: 1;
  position: relative;
  min-height: 0;
}

#map {
  width: 100%;
  height: 100%;
}

/* 实时位置 - 地图右上角控件*/
.map-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-select {
  height: 34px;
  padding: 0 30px 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  color: #2c3e50;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.map-select:hover {
  border-color: #b0b0b0;
}

.map-select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}

.export-btn {
  height: 34px;
  padding: 0 22px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 3px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
  transition: all 0.2s;
}

.export-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #1890ff);
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.35);
}

/* 位置展示 - 顶部查询栏*/
.map-controls-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #e0e0e0;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.datetime-input {
  height: 34px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  color: #2c3e50;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.datetime-input:hover {
  border-color: #b0b0b0;
}

.datetime-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}

.datetime-arrow {
  color: #999;
  font-size: 16px;
  font-weight: 300;
}

.terminal-input {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  color: #2c3e50;
  width: 170px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.terminal-input:hover {
  border-color: #b0b0b0;
}

.terminal-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}

.terminal-input::placeholder {
  color: #bbb;
  font-weight: 300;
}

.imei-filter-input {
  height: 34px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  color: #2c3e50;
  width: 150px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.imei-filter-input:hover { border-color: #b0b0b0; }
.imei-filter-input:focus { outline: none; border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24,144,255,0.15); }
.imei-filter-input::placeholder { color: #bbb; }

.query-btn {
  height: 34px;
  padding: 0 24px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
  transition: all 0.2s;
}

.query-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #1890ff);
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.35);
}

/* ===== 底部表格 ===== */
.table-panel {
  height: 160px;
  min-height: 120px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.table-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

th, td {
  padding: 4px 6px;
  text-align: center;
  font-size: 12px;
  white-space: nowrap;
  border-bottom: 1px solid #f0f0f0;
}

th {
  background: #fafafa;
  color: #555;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 2px solid #e8e8e8;
}

td {
  color: #444;
  font-variant-numeric: tabular-nums;
}

tbody tr {
  transition: background 0.15s;
}

tbody tr:hover {
  background: #e6f7ff;
}

.empty-row {
  padding: 30px;
  color: #aaa;
  font-size: 13px;
}

/* ===== 内容查询页===== */
.file-query-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f2f5;
}

.file-query-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-wrap: wrap;
}
.payload-filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 20px;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
}
.payload-filter-title {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #444;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  accent-color: #1890ff;
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.reset-btn {
  height: 34px;
  padding: 0 22px;
  background: #fff;
  color: #333;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.file-query-table-wrapper {
  flex: 1;
  overflow: auto;
  padding: 16px;
  /* 鎶婂渾瑙掑拰闃村奖鏀惧湪婊氬姩瀹瑰櫒涓婏紝涓嶅湪 table 涓婅 overflow:hidden锛?     鍚﹀垯浼氶樆鏂?th 鐨?position:sticky */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.file-query-table-wrapper .device-table {
  border-radius: 0;
}

/* ===== 列筛选===== */
.filterable-th {
  position: relative;
}

.filterable-th span {
  margin-right: 4px;
}

.filter-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  color: #bbb;
  cursor: pointer;
  border-radius: 3px;
  vertical-align: middle;
  transition: all 0.2s;
}

.filter-icon-btn:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.filter-icon-btn.filter-active {
  color: #1890ff;
}

.filter-dropdown {
  position: fixed;
  z-index: 9999;
  width: 220px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e8e8e8;
  padding: 8px 0;
  text-align: left;
}

.filter-search {
  width: calc(100% - 16px);
  margin: 0 8px 6px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-family: inherit;
  font-size: 12px;
  color: #333;
}

.filter-search:focus {
  outline: none;
  border-color: #1890ff;
}

.filter-search::placeholder {
  color: #bbb;
}

.filter-actions {
  display: flex;
  gap: 8px;
  padding: 0 8px 6px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-actions button {
  font-size: 12px;
  color: #1890ff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 0;
}

.filter-actions button:hover {
  text-decoration: underline;
}

.filter-options {
  max-height: 200px;
  overflow-y: auto;
  padding: 4px 0;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-option:hover {
  background: #f5f5f5;
}

.filter-option input[type="checkbox"] {
  accent-color: #1890ff;
  flex-shrink: 0;
}

.filter-empty {
  padding: 12px;
  text-align: center;
  color: #aaa;
  font-size: 12px;
}

.filter-footer {
  padding: 6px 8px 2px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.filter-confirm {
  height: 26px;
  padding: 0 16px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-confirm:hover {
  background: #40a9ff;
}

.filter-options::-webkit-scrollbar {
  width: 4px;
}

.filter-options::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

/* ===== 分页 ===== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.page-info {
  font-size: 13px;
  color: #666;
}

.page-btns {
  display: flex;
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.page-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.page-active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff !important;
}

/* ===== 软件控制 - 设备信息页===== */
.device-page {
  flex: 1;
  padding: 24px;
  overflow: auto;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.device-bar {
  margin-bottom: 12px;
}

.device-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-card-section,
.device-config-section {
  padding: 18px 20px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.device-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.device-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.device-section-desc {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
}

.device-table-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.device-table {
  width: auto;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}
.file-query-fixed-table {
  table-layout: fixed;
  width: 1020px;
}
/* 实时位置搴曢儴閫氫俊浜嬩欢琛?*/
.table-panel .device-table { table-layout: fixed; width: 100%; }
.table-panel .device-table th:nth-child(1), .table-panel .device-table td:nth-child(1) { width: 65px; }
.table-panel .device-table th:nth-child(2), .table-panel .device-table td:nth-child(2) { width: 160px; }
.table-panel .device-table th:nth-child(3), .table-panel .device-table td:nth-child(3) { width: 140px; }
.table-panel .device-table th:nth-child(4), .table-panel .device-table td:nth-child(4) { width: 140px; }
.table-panel .device-table th:nth-child(5), .table-panel .device-table td:nth-child(5) { width: 85px; }
.table-panel .device-table th:nth-child(6), .table-panel .device-table td:nth-child(6) { width: 120px; }
.table-panel .device-table th:nth-child(7), .table-panel .device-table td:nth-child(7) { width: 190px; }
.table-panel .device-table th:nth-child(8), .table-panel .device-table td:nth-child(8) { width: 80px; }
.table-panel .device-table th:nth-child(9), .table-panel .device-table td:nth-child(9) { width: 120px; }

.device-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fafafa;
  box-shadow: 0 2px 0 #e8e8e8;
  color: #1890ff;
  font-weight: 600;
  font-size: 12px;
  padding: 5px 4px;
  text-align: center;
  border-bottom: 2px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
}

.device-table td {
  padding: 5px 4px;
  text-align: center;
  font-size: 12px;
  color: #444;
  border-bottom: 1px solid #f0f0f0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.device-table tbody tr {
  transition: background 0.15s;
}

.device-table tbody tr:hover {
  background: #e6f7ff;
}

.status-light {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}

.status-light.online {
  background: #52c41a;
  box-shadow: 0 0 6px rgba(82, 196, 26, 0.5);
}

.status-light.offline {
  background: #bbb;
}

.mesh-btn {
  height: 28px;
  padding: 0 14px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.mesh-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #1890ff);
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
}

.device-config-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.device-config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.device-config-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-config-label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.device-config-input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  color: #2c3e50;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.device-config-input:hover {
  border-color: #b0b0b0;
}

.device-config-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}

.device-config-input[readonly] {
  background: #f8fafc;
  color: #64748b;
}

.device-switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
}

.device-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 52px;
  height: 30px;
  cursor: pointer;
}

.device-switch input {
  position: absolute;
  inset: 0;
  opacity: 0;
  margin: 0;
  cursor: pointer;
}

.device-switch-slider {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: #dbe2ea;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.28);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.device-switch-slider::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
  transition: transform 0.2s ease;
}

.device-switch input:checked + .device-switch-slider {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.14);
}

.device-switch input:checked + .device-switch-slider::after {
  transform: translateX(22px);
}

.device-switch input:focus-visible + .device-switch-slider {
  outline: 2px solid rgba(24, 144, 255, 0.28);
  outline-offset: 2px;
}

.device-switch input:disabled + .device-switch-slider {
  opacity: 0.65;
  cursor: not-allowed;
}

.device-switch-text {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  min-width: 18px;
}

.device-config-message {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid transparent;
}

.device-config-message-info {
  background: #e6f4ff;
  border-color: #91caff;
  color: #0958d9;
}

.device-config-message-success {
  background: #f6ffed;
  border-color: #b7eb8f;
  color: #389e0d;
}

.device-config-message-warning {
  background: #fffbe6;
  border-color: #ffe58f;
  color: #d48806;
}

.device-config-message-error {
  background: #fff1f0;
  border-color: #ffa39e;
  color: #cf1322;
}

.danger-btn {
  height: 34px;
  padding: 0 22px;
  background: linear-gradient(135deg, #ff7875, #cf1322);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(207, 19, 34, 0.22);
  transition: all 0.2s;
}

.danger-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff9c99, #f5222d);
  box-shadow: 0 4px 10px rgba(207, 19, 34, 0.28);
}

.danger-btn-secondary {
  background: linear-gradient(135deg, #ff7875, #cf1322);
  box-shadow: 0 2px 6px rgba(207, 19, 34, 0.22);
}

.danger-btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff9c99, #f5222d);
  box-shadow: 0 4px 10px rgba(207, 19, 34, 0.28);
}

.danger-btn:disabled,
.device-config-toolbar .query-btn:disabled,
.device-config-toolbar .reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.cpu-high {
  color: #f5222d;
  font-weight: 600;
}

/* ===== 倒计时徽章===== */
.countdown-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 34px;
  padding: 0 10px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* ===== 加载遮罩 ===== */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(2px);
}

.static-loading {
  position: relative;
  flex: none;
  height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e8e8e8;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 閲嶅彔鐐硅仛鍚堝浘鏍囷紙SVG 娓叉煋锛屾棤闇€棰濆鏍峰紡锛?*/
/* 灞曞紑鍚庝腑蹇冪殑鏀惰捣鎸夐挳 */
.map-cluster-collapse {
  width: 24px;
  height: 24px;
  line-height: 24px;
  border-radius: 50%;
  background: #ff4d4f;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
}
/* 设备图钉图标 */
.pin-icon {
  background: none !important;
  border: none !important;
}

/* Leaflet 缩放按钮样式 */
.leaflet-control-zoom a {
  width: 32px !important;
  height: 32px !important;
  line-height: 32px !important;
  font-size: 16px !important;
  border-radius: 6px !important;
}

/* 滚动条美化*/
.table-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* 轨迹弹窗 */
.trajectory-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.trajectory-modal {
  background: #fff;
  width: 90vw;
  height: 85vh;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.location-preview-modal {
  width: 94vw;
  height: 90vh;
}
.trajectory-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: #1e3a5f;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
.trajectory-modal-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.trajectory-modal-close:hover {
  opacity: 0.7;
}
.trajectory-modal-body {
  flex: 1;
  position: relative;
}
.lcw-detail-wrapper {
  padding: 10px 12px 12px;
}
.lcw-detail-table th,
.lcw-detail-table td {
  padding: 7px 10px;
}
.payload-btn {
  padding: 2px 10px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: background 0.15s;
}
.payload-btn:hover {
  background: #096dd9;
}
.latlon-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.latlon-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.location-view-btn {
  padding: 1px 6px;
  background: #fff;
  color: #1890ff;
  border: 1px solid #91caff;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: all 0.2s;
}
.location-view-btn:hover {
  color: #096dd9;
  border-color: #69b1ff;
  background: #e6f4ff;
}
.payload-modal {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  width: 560px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.payload-modal-body {
  padding: 20px 24px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.payload-section {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
}
.payload-section-label {
  flex-shrink: 0;
  width: 80px;
  font-size: 12px;
  font-weight: 600;
  padding-top: 4px;
  text-align: right;
}
.payload-tags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.wav-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #52c41a;
  background: #f6ffed;
  color: #389e0d;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.wav-download-btn:hover {
  background: #d9f7be;
}
.wav-icon {
  font-size: 10px;
}
.payload-text-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}
.payload-text-line {
  display: block;
  font-size: 12px;
  color: #389e0d;
  line-height: 1.6;
  word-break: break-all;
}
.payload-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid #91caff;
  font-size: 12px;
  line-height: 1.6;
  background: #e6f4ff;
  color: #0958d9;
  word-break: break-all;
}
.detail-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.detail-btn {
  padding: 2px 10px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.detail-btn:hover {
  background: #096dd9;
}
.detail-export-btn {
  padding: 2px 10px;
  background: #fff;
  color: #333;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: all 0.2s;
}
.detail-export-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
}
.arrow-icon {
  background: none !important;
  border: none !important;
}
</style>

(function(window, document) {
    class HealthStatsModule {
        constructor(options = {}) {
            this.config = {
                el: '#health-stats',
                ...options
            };
            this.container = document.querySelector(this.config.el);
            if (!this.container) {
                console.error('统计模块挂载节点不存在');
                return;
            }
            this.chart = null;
            this.init();
        }

        init() {
            this.renderStatsUI();
            this.loadChartLib();
            this.bindTabEvents();
            this.updateStatsSummary();
            this.updateCheckinStats();
        }

        // 渲染统计UI
        renderStatsUI() {
            this.container.innerHTML = `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h4 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <i class="fa fa-bar-chart text-green-500"></i>
                        健康数据统计（近7天）
                    </h4>
                    <!-- 统计切换标签 -->
                    <div class="flex gap-2 mb-3 border-b pb-2">
                        <button class="stats-tab active bg-green-50 text-green-500" data-type="water">饮水量</button>
                        <button class="stats-tab text-gray-600" data-type="sport">运动时长</button>
                        <button class="stats-tab text-gray-600" data-type="sleep">睡眠时长</button>
                        <button class="stats-tab text-gray-600" data-type="heart">心率</button>
                    </div>
                    <!-- 统计图表容器 -->
                    <div class="h-64 mb-3">
                        <canvas id="health-stats-chart"></canvas>
                    </div>
                    <!-- 统计数据概览 -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        <div class="bg-gray-50 rounded-lg p-2 text-center">
                            <p class="text-xs text-gray-500">日均饮水量</p>
                            <p class="text-sm font-medium text-blue-500" id="avg-water">0 ml</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-2 text-center">
                            <p class="text-xs text-gray-500">日均运动</p>
                            <p class="text-sm font-medium text-green-500" id="avg-sport">0 分钟</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-2 text-center">
                            <p class="text-xs text-gray-500">日均睡眠</p>
                            <p class="text-sm font-medium text-purple-500" id="avg-sleep">0 小时</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-2 text-center">
                            <p class="text-xs text-gray-500">平均心率</p>
                            <p class="text-sm font-medium text-red-500" id="avg-heart">0 次/分</p>
                        </div>
                    </div>
                    <!-- 打卡统计 -->
                    <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 class="text-sm font-medium text-gray-800 mb-2">打卡完成率</h5>
                        <div class="flex items-center gap-2">
                            <div class="checkin-progress w-full">
                                <div class="checkin-bar" style="width: 0%"></div>
                            </div>
                            <span class="text-sm text-gray-600" id="checkin-rate">0%</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1" id="checkin-desc">本周累计打卡：0/35 项</p>
                    </div>
                </div>
            `;
        }

        // 加载Chart.js图表库
        loadChartLib() {
            if (window.Chart) {
                this.renderChart('water');
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js';
            script.onload = () => {
                this.renderChart('water');
            };
            document.head.appendChild(script);
        }

        // 渲染统计图表
        renderChart(type) {
            const ctx = document.getElementById('health-stats-chart').getContext('2d');
            const labels = this.getLast7Days();
            const data = this.getStatsData(type);

            // 销毁原有图表
            if (this.chart) {
                this.chart.destroy();
            }

            // 图表配置
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: this.getLabel(type),
                        data: data.values,
                        borderColor: this.getColor(type),
                        backgroundColor: `${this.getColor(type)}20`,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: this.getColor(type)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: (context) => `${this.getLabel(type)}: ${context.raw} ${this.getUnit(type)}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: `${this.getLabel(type)} (${this.getUnit(type)})`
                            }
                        }
                    }
                }
            });
        }

        // 绑定标签切换事件
        bindTabEvents() {
            const tabs = document.querySelectorAll('.stats-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // 切换激活状态
                    tabs.forEach(t => {
                        t.classList.remove('active', 'bg-green-50', 'text-green-500');
                        t.classList.add('text-gray-600');
                    });
                    tab.classList.add('active', 'bg-green-50', 'text-green-500');
                    tab.classList.remove('text-gray-600');
                    
                    // 渲染对应图表
                    this.renderChart(tab.dataset.type);
                });
            });
        }

        // 获取近7天日期
        getLast7Days() {
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                days.push(`${date.getMonth() + 1}/${date.getDate()}`);
            }
            return days;
        }

        // 获取统计数据
        getStatsData(type) {
            const data = this.loadFromLocal('healthStatsData') || {};
            const values = [];
            const labels = this.getLast7Days();

            labels.forEach(day => {
                values.push(data[day]?.[type] || 0);
            });

            return { values: values };
        }

        // 更新统计概览
        updateStatsSummary() {
            // 饮水量
            const waterData = this.getStatsData('water').values;
            const avgWater = waterData.reduce((a, b) => a + b, 0) / (waterData.length || 1);
            document.getElementById('avg-water').textContent = `${Math.round(avgWater)} ml`;

            // 运动时长
            const sportData = this.getStatsData('sport').values;
            const avgSport = sportData.reduce((a, b) => a + b, 0) / (sportData.length || 1);
            document.getElementById('avg-sport').textContent = `${Math.round(avgSport)} 分钟`;

            // 睡眠时长
            const sleepData = this.getStatsData('sleep').values;
            const avgSleep = sleepData.reduce((a, b) => a + b, 0) / (sleepData.length || 1);
            document.getElementById('avg-sleep').textContent = `${avgSleep.toFixed(1)} 小时`;

            // 心率
            const heartData = this.getStatsData('heart').values;
            const avgHeart = heartData.reduce((a, b) => a + b, 0) / (heartData.length || 1);
            document.getElementById('avg-heart').textContent = `${Math.round(avgHeart)} 次/分`;
        }

        // 更新打卡统计
        updateCheckinStats() {
            const checkinData = this.loadFromLocal('healthCheckinData') || { completed: 0, records: {} };
            const total = 35; // 7天×5项
            const completed = checkinData.completed || 0;
            const rate = Math.round((completed / total) * 100);

            document.querySelector('.checkin-bar').style.width = `${rate}%`;
            document.getElementById('checkin-rate').textContent = `${rate}%`;
            document.getElementById('checkin-desc').textContent = `本周累计打卡：${completed}/${total} 项`;
        }

        // 保存健康数据
        saveHealthData(data) {
            const today = new Date();
            const dayKey = `${today.getMonth() + 1}/${today.getDate()}`;
            const statsData = this.loadFromLocal('healthStatsData') || {};
            
            statsData[dayKey] = {
                ...statsData[dayKey],
                ...data
            };

            this.saveToLocal('healthStatsData', statsData);
            this.renderChart(document.querySelector('.stats-tab.active')?.dataset.type || 'water');
            this.updateStatsSummary();
        }

        // 保存打卡数据
        saveCheckinData(completedCount) {
            const today = new Date();
            const dayKey = `${today.getMonth() + 1}/${today.getDate()}`;
            const checkinData = this.loadFromLocal('healthCheckinData') || { completed: 0, records: {} };
            
            checkinData.records[dayKey] = completedCount;
            checkinData.completed = Object.values(checkinData.records).reduce((a, b) => a + b, 0);

            this.saveToLocal('healthCheckinData', checkinData);
            this.updateCheckinStats();
        }

        // 本地存储工具方法
        saveToLocal(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        }

        loadFromLocal(key) {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        }

        // 工具函数：标签/颜色/单位
        getLabel(type) {
            const labels = { water: '饮水量', sport: '运动时长', sleep: '睡眠时长', heart: '心率' };
            return labels[type] || type;
        }

        getColor(type) {
            const colors = { water: '#3b82f6', sport: '#22c55e', sleep: '#8b5cf6', heart: '#ef4444' };
            return colors[type] || '#4ade80';
        }

        getUnit(type) {
            const units = { water: 'ml', sport: '分钟', sleep: '小时', heart: '次/分' };
            return units[type] || '';
        }
    }

    // 暴露全局方法
    window.HealthStatsModule = HealthStatsModule;
    window.saveHealthStats = function(heart, water, sport, sleep) {
        const statsModule = window.healthStatsInstance;
        if (!statsModule) return false;
        
        statsModule.saveHealthData({
            heart: parseInt(heart) || 0,
            water: parseInt(water) || 0,
            sport: parseInt(sport) || 0,
            sleep: parseFloat(sleep) || 0
        });
        return true;
    };

    window.saveCheckinStats = function(count) {
        const statsModule = window.healthStatsInstance;
        if (!statsModule) return false;
        
        statsModule.saveCheckinData(count);
        return true;
    };
})(window, document);
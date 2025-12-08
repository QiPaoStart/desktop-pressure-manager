(function(window, document) {
    class HealthCheckinModule {
        constructor(options = {}) {
            this.config = {
                el: '#health-checkin',
                ...options
            };
            this.container = document.querySelector(this.config.el);
            if (!this.container) {
                console.error('健康打卡模块挂载节点不存在');
                return;
            }
            this.init();
        }

        init() {
            this.renderCheckinUI();
            this.bindCheckinEvents();
            this.updateProgress();
        }

        // 渲染打卡UI
        renderCheckinUI() {
            this.container.innerHTML = `
                <div class="health-card">
                    <div class="space-y-2" id="checkin-items">
                        <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" class="form-checkbox text-green-500">
                            <span class="text-gray-700">晨起饮水500ml</span>
                        </label>
                        <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" class="form-checkbox text-green-500">
                            <span class="text-gray-700">完成30分钟运动</span>
                        </label>
                        <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" class="form-checkbox text-green-500">
                            <span class="text-gray-700">每日蔬果摄入500g</span>
                        </label>
                        <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" class="form-checkbox text-green-500">
                            <span class="text-gray-700">远离电子设备1小时</span>
                        </label>
                        <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" class="form-checkbox text-green-500">
                            <span class="text-gray-700">23:00前入睡</span>
                        </label>
                    </div>
                    <div class="mt-3 flex justify-between">
                        <span class="text-sm text-gray-500" id="checkin-progress">完成进度：0/5</span>
                        <button class="btn-secondary text-sm" id="reset-checkin">
                            重置打卡
                        </button>
                    </div>
                </div>
            `;
        }

        // 绑定打卡事件
        bindCheckinEvents() {
            // 打卡项变更
            document.querySelectorAll('#checkin-items input').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateProgress(true);
                });
            });

            // 重置打卡
            document.getElementById('reset-checkin').addEventListener('click', () => {
                document.querySelectorAll('#checkin-items input').forEach(checkbox => {
                    checkbox.checked = false;
                });
                this.updateProgress(true);
            });
        }

        // 更新打卡进度
        updateProgress(save = false) {
            const checked = document.querySelectorAll('#checkin-items input:checked').length;
            const total = document.querySelectorAll('#checkin-items input').length;
            
            // 更新进度显示
            document.getElementById('checkin-progress').textContent = `完成进度：${checked}/${total}`;
            
            // 保存打卡数据
            if (save) {
                window.saveCheckinStats(checked);
            }
        }
    }

    window.HealthCheckinModule = HealthCheckinModule;
})(window, document);
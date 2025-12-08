(function(window, document) {
    class HealthDataModule {
        constructor(options = {}) {
            this.config = {
                el: '#health-data-form',
                ...options
            };
            this.container = document.querySelector(this.config.el);
            if (!this.container) {
                console.error('健康数据模块挂载节点不存在');
                return;
            }
            this.init();
        }

        init() {
            this.renderForm();
            this.bindSaveEvent();
        }

        // 渲染数据录入表单
        renderForm() {
            this.container.innerHTML = `
                <div class="health-card">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div class="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                            <div class="health-icon bg-red-500 text-white mb-2">
                                <i class="fa fa-heartbeat"></i>
                            </div>
                            <span class="text-sm text-gray-500">心率</span>
                            <input id="heart-rate" type="number" class="form-input" placeholder="输入心率(次/分)">
                        </div>
                        <div class="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                            <div class="health-icon bg-blue-500 text-white mb-2">
                                <i class="fa fa-tint"></i>
                            </div>
                            <span class="text-sm text-gray-500">饮水量</span>
                            <input id="water-intake" type="number" class="form-input" placeholder="输入饮水量(ml)">
                        </div>
                        <div class="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                            <div class="health-icon bg-green-500 text-white mb-2">
                                <i class="fa fa-running"></i>
                            </div>
                            <span class="text-sm text-gray-500">运动时长</span>
                            <input id="sport-time" type="number" class="form-input" placeholder="输入时长(分钟)">
                        </div>
                        <div class="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                            <div class="health-icon bg-purple-500 text-white mb-2">
                                <i class="fa fa-moon-o"></i>
                            </div>
                            <span class="text-sm text-gray-500">睡眠时长</span>
                            <input id="sleep-time" type="number" step="0.5" class="form-input" placeholder="输入时长(小时)">
                        </div>
                    </div>
                    <button class="w-full btn-primary" id="save-health-data">
                        保存今日数据
                    </button>
                </div>
            `;
        }

        // 绑定保存事件
        bindSaveEvent() {
            document.getElementById('save-health-data').addEventListener('click', () => {
                const heartRate = document.getElementById('heart-rate').value;
                const water = document.getElementById('water-intake').value;
                const sport = document.getElementById('sport-time').value;
                const sleep = document.getElementById('sleep-time').value;

                // 调用全局保存方法
                const success = window.saveHealthStats(heartRate, water, sport, sleep);

                if (success) {
                    alert('健康数据保存成功！已同步到统计系统');
                    // 清空输入框
                    document.getElementById('heart-rate').value = '';
                    document.getElementById('water-intake').value = '';
                    document.getElementById('sport-time').value = '';
                    document.getElementById('sleep-time').value = '';
                } else {
                    alert('数据保存失败，请先初始化统计模块');
                }
            });
        }
    }

    window.HealthDataModule = HealthDataModule;
})(window, document);
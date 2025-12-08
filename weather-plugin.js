(function(window, document) {
    const DEFAULT_CONFIG = {
        el: '#weather-plugin',
        city: {
            name: '北京市海淀区',
            station: '海淀气象站',
            lat: 39.9975,
            lon: 116.3376,
            adcode: '110108'
        },
        refreshInterval: 15 * 60 * 1000,
        amapKey: '8e9f9876d789087654321abcdef12345' // 替换为你的高德API Key
    };

    class HealthWeatherPlugin {
        constructor(options = {}) {
            this.config = { ...DEFAULT_CONFIG, ...options };
            this.container = document.querySelector(this.config.el);
            if (!this.container) {
                console.error('天气插件挂载节点不存在');
                return;
            }
            this.isLoaded = false;
            this.timer = null;
            this.init();
        }

        async init() {
            this.renderBasicUI();
            await this.loadWeatherData();
            this.startAutoRefresh();
            this.isLoaded = true;
        }

        // 渲染基础UI结构
        renderBasicUI() {
            this.container.innerHTML = `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                    <!-- 实时天气头部 -->
                    <div class="bg-green-50 p-4 flex flex-wrap justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="text-3xl text-green-500" id="weather-icon">
                                <i class="fa fa-sun-o"></i>
                            </div>
                            <div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-2xl font-bold text-gray-800" id="temp">0°</span>
                                    <span class="text-gray-600" id="city">${this.config.city.name}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <p class="text-sm text-gray-500 mt-1" id="weather-desc">加载中...</p>
                                    <span class="text-xs text-gray-400" id="update-time">更新于：--</span>
                                </div>
                            </div>
                        </div>
                        <div class="w-5 h-5 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin hidden" id="weather-loader"></div>
                    </div>
                    
                    <!-- 气象数据面板 -->
                    <div class="grid grid-cols-2 md:grid-cols-4 p-4 gap-3" id="weather-data">
                        <!-- 数据由JS动态填充 -->
                    </div>

                    <!-- 未来3天预报 -->
                    <div class="px-4 pb-3" id="weather-forecast">
                        <h4 class="font-medium text-gray-800 mb-2">未来3天预报</h4>
                        <div class="grid grid-cols-3 gap-2">
                            <!-- 预报由JS动态填充 -->
                        </div>
                    </div>
                    
                    <!-- 表格化健康建议 -->
                    <div class="px-4 pb-4" id="health-tips">
                        <h4 class="font-medium text-gray-800 mb-2 flex items-center gap-2">
                            <i class="fa fa-heartbeat text-green-500"></i>
                            今日健康建议
                        </h4>
                        <div class="overflow-x-auto">
                            <table class="w-full bg-white rounded-lg border border-gray-200">
                                <thead>
                                    <tr class="bg-green-50">
                                        <th class="px-3 py-2 text-left text-sm font-medium text-gray-700 border-b">健康维度</th>
                                        <th class="px-3 py-2 text-left text-sm font-medium text-gray-700 border-b">建议内容</th>
                                        <th class="px-3 py-2 text-left text-sm font-medium text-gray-700 border-b">注意事项</th>
                                    </tr>
                                </thead>
                                <tbody id="tips-table-body">
                                    <tr class="border-b">
                                        <td class="px-3 py-2 text-sm text-gray-600">加载中...</td>
                                        <td class="px-3 py-2 text-sm text-gray-600">加载中...</td>
                                        <td class="px-3 py-2 text-sm text-gray-600">加载中...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 健康快捷功能 -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-4" id="health-functions">
                    <div class="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                        <div class="health-icon bg-blue-500 text-white mb-2">
                            <i class="fa fa-tint"></i>
                        </div>
                        <h5 class="text-sm font-medium text-gray-800 mb-1">饮水提醒</h5>
                        <p class="text-xs text-gray-600 text-center" id="water-tips">加载中...</p>
                        <button class="mt-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded" onclick="HealthWeatherPlugin.waterReminder()">设置提醒</button>
                    </div>
                    <div class="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                        <div class="health-icon bg-green-500 text-white mb-2">
                            <i class="fa fa-running"></i>
                        </div>
                        <h5 class="text-sm font-medium text-gray-800 mb-1">运动推荐</h5>
                        <p class="text-xs text-gray-600 text-center" id="sport-tips">加载中...</p>
                        <button class="mt-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded" onclick="HealthWeatherPlugin.showSportPlan()">查看计划</button>
                    </div>
                    <div class="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                        <div class="health-icon bg-purple-500 text-white mb-2">
                            <i class="fa fa-moon-o"></i>
                        </div>
                        <h5 class="text-sm font-medium text-gray-800 mb-1">睡眠建议</h5>
                        <p class="text-xs text-gray-600 text-center" id="sleep-tips">加载中...</p>
                        <button class="mt-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded" onclick="HealthWeatherPlugin.sleepTimer()">睡眠计时</button>
                    </div>
                    <div class="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                        <div class="health-icon bg-orange-500 text-white mb-2">
                            <i class="fa fa-utensils"></i>
                        </div>
                        <h5 class="text-sm font-medium text-gray-800 mb-1">饮食推荐</h5>
                        <p class="text-xs text-gray-600 text-center" id="diet-tips">加载中...</p>
                        <button class="mt-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded" onclick="HealthWeatherPlugin.showDietPlan()">查看食谱</button>
                    </div>
                </div>
            `;
        }

        // 加载高德API实时天气数据
        async loadWeatherData() {
            this.showLoader(true);
            try {
                let weatherData;
                if (this.config.amapKey) {
                    // 调用真实API
                    weatherData = await this.fetchAmapWeather();
                } else {
                    // 模拟数据
                    weatherData = this.getMockWeatherData();
                }
                this.updateWeatherUI(weatherData);
                this.updateHealthTips(weatherData);
                this.updateHealthFunctions(weatherData);
            } catch (error) {
                console.error('加载天气数据失败:', error);
                const mockData = this.getMockWeatherData();
                this.updateWeatherUI(mockData);
                this.updateHealthTips(mockData);
                this.updateHealthFunctions(mockData);
            } finally {
                this.showLoader(false);
            }
        }

        // 调用高德地图天气API
        async fetchAmapWeather() {
            // 实时天气
            const liveRes = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?key=${this.config.amapKey}&city=${this.config.city.adcode}&extensions=base`);
            const liveData = await liveRes.json();
            const live = liveData.lives[0];
            
            // 预报数据
            const forecastRes = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?key=${this.config.amapKey}&city=${this.config.city.adcode}&extensions=all`);
            const forecastData = await forecastRes.json();
            const forecasts = forecastData.forecasts[0].casts;

            return {
                temp: Number(live.temperature),
                apparentTemp: Number(live.feelslike),
                humidity: Number(live.humidity),
                aqi: Number(forecasts[0].aqi),
                uvIndex: live.uv_index ? Number(live.uv_index) : 1,
                weather: live.weather,
                wind: `${live.winddirection}${live.windpower}级`,
                windSpeed: live.windspeed ? Number(live.windspeed) : 3.2,
                pressure: live.pressure ? Number(live.pressure) : 1028,
                visibility: live.visibility ? Number(live.visibility) : 10,
                dew: live.dew ? Number(live.dew) : -5,
                updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                forecast: {
                    today: { tempMin: Number(forecasts[0].nighttemp), tempMax: Number(forecasts[0].daytemp), weather: forecasts[0].dayweather },
                    tomorrow: { tempMin: Number(forecasts[1].nighttemp), tempMax: Number(forecasts[1].daytemp), weather: forecasts[1].dayweather },
                    dayAfter: { tempMin: Number(forecasts[2].nighttemp), tempMax: Number(forecasts[2].daytemp), weather: forecasts[2].dayweather }
                }
            };
        }

        // 模拟天气数据（无API时使用）
        getMockWeatherData() {
            return {
                temp: 1,
                apparentTemp: -2,
                humidity: 38,
                aqi: 45,
                uvIndex: 1,
                weather: '晴',
                wind: '北风2级',
                windSpeed: 3.2,
                pressure: 1028,
                visibility: 10,
                dew: -5,
                updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                forecast: {
                    today: { tempMin: -5, tempMax: 3, weather: '晴' },
                    tomorrow: { tempMin: -4, tempMax: 4, weather: '多云' },
                    dayAfter: { tempMin: -3, tempMax: 5, weather: '晴转多云' }
                }
            };
        }

        // 更新天气UI
        updateWeatherUI(data) {
            // 更新基础信息
            document.getElementById('temp').textContent = `${data.temp}°`;
            document.getElementById('weather-desc').textContent = `${data.weather} · ${data.wind} · 体感${data.apparentTemp}℃`;
            document.getElementById('update-time').textContent = `更新于：${data.updateTime}`;
            
            // 更新天气图标
            const icon = this.getWeatherIcon(data.weather);
            document.getElementById('weather-icon').innerHTML = icon;

            // 更新气象数据面板
            const dataHtml = `
                <div class="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <div class="health-icon bg-red-100 text-red-500 mb-2">
                        <i class="fa fa-thermometer-half"></i>
                    </div>
                    <span class="text-sm text-gray-500">实际温度</span>
                    <span class="font-medium text-gray-800">${data.temp}°C</span>
                </div>
                <div class="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <div class="health-icon bg-purple-100 text-purple-500 mb-2">
                        <i class="fa fa-user"></i>
                    </div>
                    <span class="text-sm text-gray-500">体感温度</span>
                    <span class="font-medium text-gray-800">${data.apparentTemp}°C</span>
                </div>
                <div class="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <div class="health-icon ${this.getAqiColor(data.aqi)} text-white mb-2">
                        <i class="fa fa-leaf"></i>
                    </div>
                    <span class="text-sm text-gray-500">空气质量</span>
                    <span class="font-medium ${this.getAqiColor(data.aqi)}">${this.getAqiLevel(data.aqi)} (${data.aqi})</span>
                </div>
                <div class="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <div class="health-icon ${this.getUvColor(data.uvIndex)} text-white mb-2">
                        <i class="fa fa-sun-o"></i>
                    </div>
                    <span class="text-sm text-gray-500">紫外线</span>
                    <span class="font-medium ${this.getUvColor(data.uvIndex)}">${this.getUvLevel(data.uvIndex)} (${data.uvIndex})</span>
                </div>
                <div class="flex flex-col items-center p-2 bg-gray-50 rounded-lg md:col-span-2">
                    <div class="health-icon bg-blue-100 text-blue-500 mb-2">
                        <i class="fa fa-wind"></i>
                    </div>
                    <span class="text-sm text-gray-500">风速/湿度</span>
                    <span class="font-medium text-gray-800">${data.windSpeed}km/h · ${data.humidity}%</span>
                </div>
                <div class="flex flex-col items-center p-2 bg-gray-50 rounded-lg md:col-span-2">
                    <div class="health-icon bg-orange-100 text-orange-500 mb-2">
                        <i class="fa fa-dashboard"></i>
                    </div>
                    <span class="text-sm text-gray-500">气压/能见度</span>
                    <span class="font-medium text-gray-800">${data.pressure}hPa · ${data.visibility}km</span>
                </div>
            `;
            document.getElementById('weather-data').innerHTML = dataHtml;

            // 更新预报
            const forecastHtml = `
                <div class="bg-gray-50 rounded-lg p-2 text-center">
                    <p class="text-xs text-gray-500">今日</p>
                    <i class="${this.getForecastIcon(data.forecast.today.weather)} my-1"></i>
                    <p class="text-sm font-medium">${data.forecast.today.tempMin}°~${data.forecast.today.tempMax}°</p>
                    <p class="text-xs text-gray-500">${data.forecast.today.weather}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-2 text-center">
                    <p class="text-xs text-gray-500">明日</p>
                    <i class="${this.getForecastIcon(data.forecast.tomorrow.weather)} my-1"></i>
                    <p class="text-sm font-medium">${data.forecast.tomorrow.tempMin}°~${data.forecast.tomorrow.tempMax}°</p>
                    <p class="text-xs text-gray-500">${data.forecast.tomorrow.weather}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-2 text-center">
                    <p class="text-xs text-gray-500">后天</p>
                    <i class="${this.getForecastIcon(data.forecast.dayAfter.weather)} my-1"></i>
                    <p class="text-sm font-medium">${data.forecast.dayAfter.tempMin}°~${data.forecast.dayAfter.tempMax}°</p>
                    <p class="text-xs text-gray-500">${data.forecast.dayAfter.weather}</p>
                </div>
            `;
            document.querySelector('#weather-forecast .grid').innerHTML = forecastHtml;
        }

        // 更新健康建议表格
        updateHealthTips(data) {
            const tips = [
                {
                    dimension: '户外活动',
                    content: this.getAqiLevel(data.aqi) === '优' || this.getAqiLevel(data.aqi) === '良' ? '适合轻度户外活动' : '减少户外活动',
                    notice: this.getUvLevel(data.uvIndex) === '低' ? '无需防晒' : `外出涂抹SPF${this.getUvLevel(data.uvIndex) === '中等' ? 15 : 30}+防晒霜`
                },
                {
                    dimension: '保暖防护',
                    content: data.temp < 5 ? '穿戴羽绒服+围巾+手套' : '穿厚外套即可',
                    notice: `体感${data.apparentTemp}℃，注意头部和手部保暖`
                },
                {
                    dimension: '补水保湿',
                    content: data.humidity < 40 ? '每日饮水2000ml' : '每日饮水1500ml',
                    notice: data.humidity < 40 ? '室内开加湿器（湿度50%）' : '注意皮肤基础保湿'
                },
                {
                    dimension: '运动健身',
                    content: data.temp < 5 ? '室内瑜伽/跳绳30分钟' : '户外快走/慢跑40分钟',
                    notice: '避免清晨低温时段运动，运动后及时保暖'
                },
                {
                    dimension: '饮食营养',
                    content: data.temp < 5 ? '多吃温热食物（红枣粥/姜汤）' : '清淡饮食（蔬果/杂粮）',
                    notice: '补充维生素C，避免生冷/辛辣食物'
                },
                {
                    dimension: '睡眠休息',
                    content: data.temp < 0 ? '22:00前入睡，保证8小时睡眠' : '23:00前入睡，保证7小时睡眠',
                    notice: '睡前用温水泡脚，提升睡眠质量'
                }
            ];

            let tableHtml = '';
            tips.forEach(item => {
                tableHtml += `
                    <tr class="border-b">
                        <td class="px-3 py-2 text-sm text-gray-600">${item.dimension}</td>
                        <td class="px-3 py-2 text-sm text-gray-600">${item.content}</td>
                        <td class="px-3 py-2 text-sm text-gray-600">${item.notice}</td>
                    </tr>
                `;
            });
            document.getElementById('tips-table-body').innerHTML = tableHtml;
        }

        // 更新健康快捷功能提示
        updateHealthFunctions(data) {
            document.getElementById('water-tips').textContent = data.humidity < 40 ? '今日建议饮水2000ml' : '今日建议饮水1500ml';
            document.getElementById('sport-tips').textContent = data.temp < 5 ? '室内瑜伽 30分钟' : '户外快走 40分钟';
            document.getElementById('sleep-tips').textContent = data.temp < 0 ? '建议22:00前入睡' : '建议23:00前入睡';
            document.getElementById('diet-tips').textContent = data.temp < 5 ? '温热食物 补充能量' : '清淡饮食 多吃蔬果';
        }

        // 工具函数：天气图标
        getWeatherIcon(weather) {
            if (weather.includes('晴')) return '<i class="fa fa-sun-o text-yellow-500"></i>';
            if (weather.includes('云')) return '<i class="fa fa-cloud text-gray-500"></i>';
            if (weather.includes('雨')) return '<i class="fa fa-tint text-blue-500"></i>';
            if (weather.includes('雪')) return '<i class="fa fa-snowflake-o text-lightblue-500"></i>';
            if (weather.includes('雷')) return '<i class="fa fa-bolt text-yellow-500"></i>';
            return '<i class="fa fa-sun-o text-yellow-500"></i>';
        }

        // 工具函数：预报图标
        getForecastIcon(weather) {
            if (weather.includes('晴')) return 'fa fa-sun-o text-yellow-500';
            if (weather.includes('云')) return 'fa fa-cloud text-gray-500';
            if (weather.includes('雨')) return 'fa fa-tint text-blue-500';
            if (weather.includes('雪')) return 'fa fa-snowflake-o text-lightblue-500';
            if (weather.includes('雷')) return 'fa fa-bolt text-yellow-500';
            return 'fa fa-sun-o text-yellow-500';
        }

        // 工具函数：AQI等级
        getAqiLevel(aqi) {
            if (aqi <= 50) return '优';
            if (aqi <= 100) return '良';
            if (aqi <= 150) return '轻度污染';
            if (aqi <= 200) return '中度污染';
            return '重度污染';
        }

        // 工具函数：AQI颜色
        getAqiColor(aqi) {
            if (aqi <= 50) return 'bg-green-500 text-green-500';
            if (aqi <= 100) return 'bg-green-500 text-green-500';
            if (aqi <= 150) return 'bg-yellow-500 text-yellow-500';
            if (aqi <= 200) return 'bg-orange-500 text-orange-500';
            return 'bg-red-500 text-red-500';
        }

        // 工具函数：紫外线等级
        getUvLevel(uv) {
            if (uv <= 2) return '低';
            if (uv <= 5) return '中等';
            if (uv <= 7) return '高';
            return '极高';
        }

        // 工具函数：紫外线颜色
        getUvColor(uv) {
            if (uv <= 2) return 'bg-green-500 text-green-500';
            if (uv <= 5) return 'bg-yellow-500 text-yellow-500';
            if (uv <= 7) return 'bg-orange-500 text-orange-500';
            return 'bg-red-500 text-red-500';
        }

        // 显示/隐藏加载动画
        showLoader(show) {
            const loader = document.getElementById('weather-loader');
            if (loader) loader.classList.toggle('hidden', !show);
        }

        // 自动刷新
        startAutoRefresh() {
            if (this.timer) clearInterval(this.timer);
            this.timer = setInterval(() => {
                if (this.isLoaded) this.loadWeatherData();
            }, this.config.refreshInterval);
        }

        // 销毁插件
        destroy() {
            clearInterval(this.timer);
            this.container.innerHTML = '';
        }
    }

    // 健康功能快捷方法
    HealthWeatherPlugin.waterReminder = function() {
        if (Notification.permission === 'granted') {
            new Notification('饮水提醒', { body: '该喝水啦！建议每次饮用200ml温水' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(perm => {
                if (perm === 'granted') {
                    new Notification('饮水提醒', { body: '已开启饮水提醒，每2小时提醒一次' });
                }
            });
        }
    };

    HealthWeatherPlugin.showSportPlan = function() {
        alert(`
            今日运动计划：
            1. 热身：关节活动 5分钟
            2. 主运动：室内瑜伽（猫式、下犬式、婴儿式）30分钟
            3. 放松：拉伸 5分钟
            注意：运动过程中保持呼吸均匀，避免憋气
        `);
    };

    HealthWeatherPlugin.sleepTimer = function() {
        const now = new Date();
        const sleepTime = new Date(now.setHours(22, 30, 0));
        alert(`睡眠计时已设置：建议${sleepTime.toLocaleTimeString()}入睡，点击确定开始计时`);
        setTimeout(() => {
            new Notification('睡眠提醒', { body: '该准备入睡啦！放下手机，泡个脚吧' });
        }, sleepTime - new Date());
    };

    HealthWeatherPlugin.showDietPlan = function() {
        alert(`
            今日饮食计划（低温版）：
            早餐：红枣小米粥 + 水煮蛋 + 蒸红薯
            午餐：杂粮饭 + 清炖牛肉 + 炒青菜
            加餐：橙子/核桃（补充维生素和蛋白质）
            晚餐：南瓜粥 + 清蒸鱼 + 凉拌菠菜
            注意：避免生冷食物，少喝碳酸饮料
        `);
    };

    window.HealthWeatherPlugin = HealthWeatherPlugin;
})(window, document);
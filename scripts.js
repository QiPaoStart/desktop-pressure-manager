const musicPlayer = document.getElementById('musicPlayer');
const aiChat = document.getElementById('aiChat');
const audioPlayer = document.getElementById('audioPlayer');
const coverImage = document.getElementById('coverImage');
const musicTitle = document.getElementById('musicTitle');
const musicArtist = document.getElementById('musicArtist');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const currentTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeDownBtn = document.getElementById('volumeDownBtn');
const volumeUpBtn = document.getElementById('volumeUpBtn');
const volumeDisplay = document.getElementById('volumeDisplay');
const playlist = document.getElementById('playlist');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
// const fileStatus = document.getElementById('fileStatus');
const bgVideo = document.getElementById('bgVideo');
const bgImage = document.getElementById('bgImage');
// const loadConfigBtn = document.getElementById('loadConfigBtn');
// const exportConfigBtn = document.getElementById('exportConfigBtn');
const seekBackBtn = document.getElementById('seekBackBtn');
const seekForwardBtn = document.getElementById('seekForwardBtn');

// 应用状态
let currentMusicIndex = 0;
let isPlaying = false;
let isDragging = false;
let currentDraggable = null;
let offsetX, offsetY;
        
// 文件列表
let musicFiles = [];
let backgroundColors = [];
let backgroundImages = [];
let backgroundVideos = [];
let currentBgIndex = 0;
let currentBgType = 'color';

// 配置文件名
// const CONFIG_FILE = 'config.json';

//DeepSeek API Key
let DEEPSEEK_API_KEY = '';

// 初始化
function init() {
    setupEventListeners();
    loadConfig();
    initAIChat();
            
    // 设置初始背景
    document.body.style.background = 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)';
            
    // 设置初始音量
    audioPlayer.volume = 0.5;
    updateVolumeDisplay();
            
    // fileStatus.textContent = "等待Wallpaper Engine属性配置...";
}

// Wallpaper Engine 属性监听器
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        // 处理自定义背景
        if (properties.custombackground) {
            if (properties.custombackground.value) {
                const backgroundFile = 'file:///' + properties.custombackground.value;
                // fileStatus.textContent = "加载自定义背景...";
                        
                // 检查文件类型
                if (backgroundFile.match(/\.(mp4|webm|ogg|ogv)$/i)) {
                    // 视频背景
                    bgVideo.src = backgroundFile;
                    bgVideo.style.display = 'block';
                    bgImage.style.display = 'none';
                    document.body.style.background = 'none';
                    currentBgType = 'video';
                } else if (backgroundFile.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                    // 图片背景
                    bgImage.src = backgroundFile;
                    bgImage.style.display = 'block';
                    bgVideo.style.display = 'none';
                    document.body.style.background = 'none';
                    currentBgType = 'image';
                }
            } else {
                // 没有自定义背景，使用默认颜色
                bgVideo.style.display = 'none';
                bgImage.style.display = 'none';
                currentBgType = 'color';
                if (backgroundColors.length > 0) {
                    document.body.style.background = backgroundColors[currentBgIndex];
                }
            }
        }
                
        // 处理音乐目录
        if (properties.musicdirectory) {
            if (properties.musicdirectory.value) {
                // fileStatus.textContent = "扫描音乐目录...";
                // 在实际使用中，这里应该使用Wallpaper Engine的API来获取目录中的文件
                // 由于无法直接列出目录，我们假设用户已经通过其他方式配置了音乐文件
                setTimeout(() => {
                    // fileStatus.textContent = "音乐目录已加载";
                }, 1000);
            } else {
                // fileStatus.textContent = "未设置音乐目录";
            }
        }

        //处理AI部分
        if (properties.deepseekapikey) {
            DEEPSEEK_API_KEY = properties.deepseekapikey.value;
        }
        if (properties.messagecontents) {
            chatInput.value = properties.messagecontents.value;
        }
    },
            
    userDirectoryFilesAddedOrChanged: function(propertyName, changedFiles) {
        if (propertyName === 'musicdirectory') {
            // 处理新增或更改的音乐文件
            changedFiles.forEach(filePath => {
                const fileName = filePath.split('/').pop().split('\\').pop();
                const title = fileName.replace(/\.[^/.]+$/, ""); // 移除扩展名
                        
                // 检查是否已存在
                if (!musicFiles.some(music => music.src === filePath)) {
                    musicFiles.push({
                        title: title,
                        artist: "未知艺术家",
                        src: filePath,
                        cover: null
                    });
                }
            });
                    
            renderPlaylist();
            updateFileStatus();
                    
            if (musicFiles.length > 0 && currentMusicIndex < musicFiles.length) {
                loadMusic(currentMusicIndex);
            }
        }
    },
            
    userDirectoryFilesRemoved: function(propertyName, removedFiles) {
        if (propertyName === 'musicdirectory') {
            // 处理移除的音乐文件
            removedFiles.forEach(filePath => {
                musicFiles = musicFiles.filter(music => music.src !== filePath);
            });
                    
            renderPlaylist();
            updateFileStatus();
                    
            if (musicFiles.length > 0) {
                if (currentMusicIndex >= musicFiles.length) {
                    currentMusicIndex = 0;
                }
                loadMusic(currentMusicIndex);
            } else {
                musicTitle.textContent = "暂无歌曲";
                musicArtist.textContent = "请添加音乐文件";
            }
        }
    }
};

// 加载配置文件
function loadConfig() {
    // fileStatus.textContent = "正在加载配置文件...";
            
    // 尝试从JSON文件加载配置
    // fetch(CONFIG_FILE)
    //     .then(response => {
    // if (!response.ok) {
    //     throw new Error('配置文件不存在或无法访问');
    // }
    // return response.json();
    //     })
    //     .then(config => {
    // // 使用配置文件中的数据
    // musicFiles = config.musicFiles || [];
    // backgroundColors = config.backgroundColors || [];
    // backgroundImages = config.backgroundImages || [];
    // backgroundVideos = config.backgroundVideos || [];
                    
    // // 加载窗口位置
    // if (config.windowPositions) {
    //     if (config.windowPositions.musicPlayer) {
    //         musicPlayer.style.left = config.windowPositions.musicPlayer.left;
    //         musicPlayer.style.top = config.windowPositions.musicPlayer.top;
    //     }
    //     if (config.windowPositions.aiChat) {
    //         aiChat.style.left = config.windowPositions.aiChat.left;
    //         aiChat.style.top = config.windowPositions.aiChat.top;
    //     }
    // }
                    
    // updateFileStatus();
                    
    // if (musicFiles.length > 0) {
    //     loadMusic(0);
    //     renderPlaylist();
    // } else {
    //     musicTitle.textContent = "暂无音乐文件";
    //     musicArtist.textContent = "请通过Wallpaper Engine属性添加音乐";
    // }
                    
    // // fileStatus.textContent = "配置文件加载成功";
    //     })
    //     .catch(error => {
    // console.error('加载配置文件失败:', error);
    // // fileStatus.textContent = "配置文件加载失败，使用默认配置";
                    
    // // 使用默认配置
    // setDefaultConfig();
    //     });
    setDefaultConfig();
}

// 设置默认配置
function setDefaultConfig() {
    musicFiles = [
        {
            title: "月光奏鸣曲",
            artist: "贝多芬",
            cover: "https://picsum.photos/200/200?random=2",
            src: "https://m801.music.126.net/20251118161702/8e4712b8882f25070871db3cac80db42/jdymusic/obj/wo3DlMOGwrbDjj7DisKw/15889498932/795f/2682/1dc6/4887dc93ea2b1d85a4c7e297d0a862bd.mp3"
        },
        {
            title: "Liyue 璃月",
            artist: "陈致逸, HOYO-MIX",
            cover: "D:/SteamPowered/steamapps/common/wallpaper_engine/projects/myprojects/deepseek-work-v1/liyue.jpg",
            src: "D:/SteamPowered/steamapps/common/wallpaper_engine/projects/myprojects/deepseek-work-v1/陈致逸,HOYO-MiX - Liyue 璃月.mp3"
        }
    ];
            
    backgroundColors = [
        'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
        'linear-gradient(135deg, #43e97b, #38f9d7)'
    ];
            
    backgroundImages = [];
    backgroundVideos = [];
            
    updateFileStatus();
            
    if (musicFiles.length > 0) {
        loadMusic(0);
        renderPlaylist();
    }
}

// 保存配置到JSON文件
function saveConfig() {
    // const config = {
    //     musicFiles: musicFiles,
    //     backgroundColors: backgroundColors,
    //     backgroundImages: backgroundImages,
    //     backgroundVideos: backgroundVideos,
    //     windowPositions: {
    // musicPlayer: {
    //     left: musicPlayer.style.left,
    //     top: musicPlayer.style.top
    // },
    // aiChat: {
    //     left: aiChat.style.left,
    //     top: aiChat.style.top
    // }
    //     }
    // };
            
    // 创建下载链接
    // const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    // const downloadAnchorNode = document.createElement('a');
    // downloadAnchorNode.setAttribute("href", dataStr);
    // downloadAnchorNode.setAttribute("download", CONFIG_FILE);
    // document.body.appendChild(downloadAnchorNode);
    // downloadAnchorNode.click();
    // downloadAnchorNode.remove();
            
    // fileStatus.textContent = "配置已保存并准备下载";
}

// 更新文件状态显示
function updateFileStatus() {
    let status = `音乐: ${musicFiles.length} 首, `;
    status += `颜色: ${backgroundColors.length} 种, `;
    status += `图片: ${backgroundImages.length} 张, `;
    status += `视频: ${backgroundVideos.length} 个`;
    // fileStatus.textContent = status;
}

// 在文件开头添加DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// 系统提示词
const SYSTEM_PROMPT = `你是一个集成在桌面中的AI心情助手，负责帮助用户调整心情。用户的特点是：
        1. 是北京航空航天大学的一名大学生，课业可能繁忙，学习压力可能较大
        2. 更可能是一名理科或工科学生，学习能力较强，但重视逻辑思考，可能无法良好控制情感
        你的特点是：
        1. 友好、热情且乐于助人
        2. 可以根据用户提供的当天发生的事情及他/她的感受提供贴心的安慰并提出相关问题有效的解决方案
        3. 回答简洁明了，适合在聊天界面显示`;

// 修改AI聊天模块的初始化
function initAIChat() {
    // 清空原有消息，添加AI的初始问候
    chatMessages.innerHTML = '';
    addMessage('你好！今天的感受怎么样？有什么我可以帮忙的吗？', 'ai');
}

// 加载音乐
function loadMusic(index) {
    if (musicFiles.length === 0) return;
            
    const music = musicFiles[index];
            
    // 使用Wallpaper Engine的文件路径格式
    if(music.src.startsWith("https")) audioPlayer.src = music.src;
    else audioPlayer.src = 'file:///' + music.src;
            
    // 尝试加载封面图片
    if (music.cover) {
        if(music.src.startsWith("https")) coverImage.src = music.cover;
        else coverImage.src = 'file:///' + music.cover;
        coverImage.onload = function() {
            coverImage.style.display = 'block';
            document.querySelector('.music-cover span').style.display = 'none';
        };
        coverImage.onerror = function() {
            coverImage.style.display = 'none';
            document.querySelector('.music-cover span').style.display = 'block';
        };
    } else {
        coverImage.style.display = 'none';
        document.querySelector('.music-cover span').style.display = 'block';
    }
            
    musicTitle.textContent = music.title;
    musicArtist.textContent = music.artist;
            
    // 更新播放列表高亮
    const playlistItems = document.querySelectorAll('.playlist-item');
    playlistItems.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 渲染播放列表
function renderPlaylist() {
    playlist.innerHTML = '';
    musicFiles.forEach((music, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${index === currentMusicIndex ? 'active' : ''}`;
        item.innerHTML = `
            <div>
                <div>${music.title}</div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7)">${music.artist}</div>
            </div>
        `;
        item.addEventListener('click', () => {
            currentMusicIndex = index;
            loadMusic(index);
            playMusic();
        });
        playlist.appendChild(item);
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 音频事件
    audioPlayer.addEventListener('loadedmetadata', () => {
        duration.textContent = formatTime(audioPlayer.duration);
    });
            
    audioPlayer.addEventListener('timeupdate', () => {
        updateProgress();
    });
            
    audioPlayer.addEventListener('ended', () => {
        playNext();
    });
            
    // 播放控制
    playPauseBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);
            
    // 音量控制
    volumeDownBtn.addEventListener('click', decreaseVolume);
    volumeUpBtn.addEventListener('click', increaseVolume);
            
    // 进度控制
    seekBackBtn.addEventListener('click', () => seek(-10));
    seekForwardBtn.addEventListener('click', () => seek(10));
            
    // AI聊天
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
            
    // 配置按钮
    // loadConfigBtn.addEventListener('click', loadConfig);
    // exportConfigBtn.addEventListener('click', saveConfig);
            
    // 拖拽功能
    setupDraggable(musicPlayer);
    setupDraggable(aiChat);
            
    // 最小化按钮
    document.querySelectorAll('.minimize-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const draggable = e.target.closest('.draggable');
            toggleMinimize(draggable);
        });
    });
            
    // 背景循环 - 每30秒切换一次背景
    setInterval(changeBackground, 30000);
}

// 播放/暂停
function togglePlay() {
    if (isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

// 播放音乐
function playMusic() {
    if (musicFiles.length === 0) return;
    audioPlayer.play();
    isPlaying = true;
    playPauseBtn.textContent = '⏸';
}

// 暂停音乐
function pauseMusic() {
    audioPlayer.pause();
    isPlaying = false;
    playPauseBtn.textContent = '▶';
}

// 播放上一首
function playPrev() {
    if (musicFiles.length === 0) return;
    currentMusicIndex = (currentMusicIndex - 1 + musicFiles.length) % musicFiles.length;
    loadMusic(currentMusicIndex);
    playMusic();
}

// 播放下一首
function playNext() {
    if (musicFiles.length === 0) return;
    currentMusicIndex = (currentMusicIndex + 1) % musicFiles.length;
    loadMusic(currentMusicIndex);
    playMusic();
}

// 调整音量
function increaseVolume() {
    if (audioPlayer.volume < 1) {
        audioPlayer.volume = Math.min(1, audioPlayer.volume + 0.1);
        updateVolumeDisplay();
    }
}

function decreaseVolume() {
    if (audioPlayer.volume > 0) {
        audioPlayer.volume = Math.max(0, audioPlayer.volume - 0.1);
        updateVolumeDisplay();
    }
}

// 更新音量显示
function updateVolumeDisplay() {
    volumeDisplay.textContent = Math.round(audioPlayer.volume * 100) + '%';
}

// 跳转进度
function seek(seconds) {
    if (audioPlayer.duration) {
        audioPlayer.currentTime = Math.max(0, Math.min(audioPlayer.duration, audioPlayer.currentTime + seconds));
    }
}

// 更新进度条
function updateProgress() {
    if (audioPlayer.duration) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progress.style.width = `${percent}%`;
        currentTime.textContent = formatTime(audioPlayer.currentTime);
    }
}

// 格式化时间
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// 发送消息
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
            
    // 添加用户消息
    addMessage(message, 'user');
    chatInput.value = '';
            
    // 显示加载状态
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message ai-message';
    loadingMessage.textContent = '正在思考...';
    loadingMessage.id = 'loadingMessage';
    chatMessages.appendChild(loadingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
            
    try {
        // 准备对话历史
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message }
        ];
                
        // 调用DeepSeek API
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                stream: false
            })
        });
                
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
                
        const data = await response.json();
                
        // 移除加载消息
        document.getElementById('loadingMessage')?.remove();
                
        // 添加AI回复
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const aiResponse = data.choices[0].message.content;
            addMessage(aiResponse, 'ai');
        } else {
            throw new Error('无效的API响应格式');
        }
                
    } catch (error) {
        console.error('调用DeepSeek API失败:', error);
                
        // 移除加载消息
        document.getElementById('loadingMessage')?.remove();
                
        // 显示错误消息
        let errorMessage = '抱歉，我现在无法回复。请检查网络连接或稍后重试。';
                
        if (error.message.includes('API密钥') || error.message.includes('401')) {
            errorMessage = 'API配置错误，请检查DeepSeek API密钥是否正确设置。';
        } else if (error.message.includes('网络') || error.message.includes('Failed to fetch')) {
            errorMessage = '网络连接失败，请检查您的网络设置。';
        }
                
        addMessage(errorMessage, 'ai');
    }
}

// 添加消息到聊天窗口
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 切换背景
function changeBackground() {
    // 循环切换背景类型: color -> image -> video -> color
    if (properties.custombackground){
        if(currentBgType == 'image') return;
        const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
        bgImage.src = 'file:///' + randomImage;
        bgImage.style.display = 'block';
        bgVideo.style.display = 'none';
        document.body.style.background = 'none';
        currentBgType = 'image';
        return;
    }
    if (currentBgType === 'color') {
        if (backgroundImages.length > 0) {
            // 切换到图片背景
            const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
            bgImage.src = 'file:///' + randomImage;
            bgImage.style.display = 'block';
            bgVideo.style.display = 'none';
            document.body.style.background = 'none';
            currentBgType = 'image';
        } else if (backgroundVideos.length > 0) {
            // 如果没有图片但有视频，切换到视频
            const randomVideo = backgroundVideos[Math.floor(Math.random() * backgroundVideos.length)];
            bgVideo.src = 'file:///' + randomVideo;
            bgVideo.style.display = 'block';
            bgImage.style.display = 'none';
            document.body.style.background = 'none';
            currentBgType = 'video';
        } else if (backgroundColors.length > 0) {
            // 如果没有图片和视频，切换到下一个颜色
            currentBgIndex = (currentBgIndex + 1) % backgroundColors.length;
            document.body.style.background = backgroundColors[currentBgIndex];
            bgImage.style.display = 'none';
            bgVideo.style.display = 'none';
        }
    } else if (currentBgType === 'image') {
        if (backgroundVideos.length > 0) {
            // 切换到视频背景
            const randomVideo = backgroundVideos[Math.floor(Math.random() * backgroundVideos.length)];
            bgVideo.src = 'file:///' + randomVideo;
            bgVideo.style.display = 'block';
            bgImage.style.display = 'none';
            document.body.style.background = 'none';
            currentBgType = 'video';
        } else if (backgroundColors.length > 0) {
            // 如果没有视频，切换到颜色背景
            currentBgIndex = (currentBgIndex + 1) % backgroundColors.length;
            document.body.style.background = backgroundColors[currentBgIndex];
            bgImage.style.display = 'none';
            bgVideo.style.display = 'none';
            currentBgType = 'color';
        }
    } else if (currentBgType === 'video') {
        if (backgroundColors.length > 0) {
            // 切换到颜色背景
            currentBgIndex = (currentBgIndex + 1) % backgroundColors.length;
            document.body.style.background = backgroundColors[currentBgIndex];
            bgImage.style.display = 'none';
            bgVideo.style.display = 'none';
            currentBgType = 'color';
        }
    }
}

// 设置可拖拽元素
function setupDraggable(element) {
    const header = element.querySelector('.draggable-header');
            
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        currentDraggable = element;
                offsetX = e.clientX - element.offsetLeft;
                offsetY = e.clientY - element.offsetTop;
                
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

// 鼠标移动事件
function onMouseMove(e) {
    if (!isDragging || !currentDraggable) return;
            
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
            
    // 限制在视窗内
    const maxX = window.innerWidth - currentDraggable.offsetWidth;
    const maxY = window.innerHeight - currentDraggable.offsetHeight;
            
    currentDraggable.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
    currentDraggable.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
}

// 鼠标释放事件
function onMouseUp() {
    isDragging = false;
    currentDraggable = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
            
    // 保存窗口位置
    saveConfig();
}

// 切换最小化状态
function toggleMinimize(element) {
    element.classList.toggle('minimized');
            
    if (element.classList.contains('minimized')) {
        // 添加图标
        const header = element.querySelector('.draggable-header');
        if (!header.querySelector('.minimized-icon')) {
            const icon = document.createElement('div');
            icon.className = 'minimized-icon';
            if (element.id === 'musicPlayer') {
                icon.classList.add('music-icon');
            } else if (element.id === 'aiChat') {
                icon.classList.add('ai-icon');
            }
            header.appendChild(icon);
        }
    } else {
        // 移除图标
        const icon = element.querySelector('.minimized-icon');
        if (icon) {
            icon.remove();
        }
    }
}

// 初始化应用
init();
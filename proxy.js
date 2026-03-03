// ==================== 代理管理模块 ====================

// 当前代理状态
let currentProxy = { ...PROXY_CONFIG };

/**
 * 设置代理
 * @param {Object} config - 代理配置
 * @returns {Promise<boolean>} 是否成功
 */
async function setProxy(config) {
    try {
        // 更新当前配置
        Object.assign(currentProxy, config);
        
        // 构建代理配置对象
        let proxyConfig = { mode: currentProxy.mode };
        
        if (currentProxy.mode === 'fixed') {
            // 固定代理服务器
            let scheme = currentProxy.proxyType || 'http';
            let proxyRules = {
                proxyForHttp: {
                    scheme: scheme,
                    host: currentProxy.host,
                    port: currentProxy.port
                },
                proxyForHttps: {
                    scheme: scheme,
                    host: currentProxy.host,
                    port: currentProxy.port
                },
                proxyForFtp: {
                    scheme: scheme,
                    host: currentProxy.host,
                    port: currentProxy.port
                },
                bypassList: ['localhost', '127.0.0.1', '::1']
            };
            
            // 如果有认证信息，添加到规则中（需要URL编码）
            if (currentProxy.username && currentProxy.password) {
                // 注意：某些浏览器不支持在proxyRules中包含认证信息
                // 实际使用时可能需要通过其他方式处理认证
                console.log('使用代理认证:', currentProxy.username);
            }
            
            proxyConfig.rules = proxyRules;
            
        } else if (currentProxy.mode === 'pac') {
            // PAC脚本模式
            proxyConfig.pacScript = {
                url: currentProxy.pacUrl,
                mandatory: false
            };
        }
        
        // 尝试使用chrome.proxy API（适用于扩展环境）
        if (typeof chrome !== 'undefined' && chrome.proxy) {
            await new Promise((resolve, reject) => {
                chrome.proxy.settings.set(
                    { value: proxyConfig, scope: 'regular' },
                    () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    }
                );
            });
            addLog(`✅ 代理已切换至: ${getProxyName(config)}`);
            return true;
        } 
        // 回退方案：生成PAC脚本并输出到控制台（普通网页环境）
        else {
            let pacScript = generatePACScript(currentProxy);
            console.log('PAC Script (可手动配置系统代理):\n', pacScript);
            addLog(`ℹ️ 当前环境不支持自动设置代理，PAC脚本已输出到控制台`);
            return false;
        }
    } catch (error) {
        console.error('设置代理失败:', error);
        addLog(`❌ 代理切换失败: ${error.message}`);
        return false;
    }
}

/**
 * 生成PAC脚本
 * @param {Object} config - 代理配置
 * @returns {string} PAC脚本内容
 */
function generatePACScript(config) {
    if (config.mode === 'direct') {
        return 'function FindProxyForURL(url, host) { return "DIRECT"; }';
    }
    
    if (config.mode === 'fixed') {
        let proxyString = `${config.proxyType || 'HTTP'} ${config.host}:${config.port}`;
        return `function FindProxyForURL(url, host) {
            if (shExpMatch(host, "localhost") || shExpMatch(host, "127.0.0.1") || shExpMatch(host, "::1")) {
                return "DIRECT";
            }
            return "${proxyString}";
        }`;
    }
    
    if (config.mode === 'pac' && config.pacUrl) {
        return `加载外部PAC: ${config.pacUrl}`;
    }
    
    return 'function FindProxyForURL(url, host) { return "DIRECT"; }';
}

/**
 * 禁用代理（直连）
 */
async function disableProxy() {
    return setProxy({ mode: 'direct' });
}

/**
 * 获取当前代理名称
 */
function getProxyName(config = currentProxy) {
    if (config.mode === 'direct') return '直连';
    if (config.mode === 'fixed') return `${config.host}:${config.port}`;
    if (config.mode === 'pac') return 'PAC自动';
    return '未知';
}

/**
 * 测试当前代理连通性
 */
async function testProxyConnection() {
    try {
        addLog('⏳ 正在测试代理连通性...');
        // 通过获取公网IP来测试代理
        const response = await fetch('https://api.ipify.org?format=json', {
            method: 'GET',
            cache: 'no-cache'
        });
        const data = await response.json();
        addLog(`✅ 当前公网IP: ${data.ip}`);
        return true;
    } catch (error) {
        addLog(`❌ 代理测试失败: ${error.message}`);
        return false;
    }
}
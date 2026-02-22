import React, { useState, useCallback, useEffect } from 'react';
import skillConfigManager from '../utils/SkillConfigManager';
import SkillPreview from './SkillPreview';
import './SkillEditor.css';

const PROJECTILE_SHAPES = ['sphere', 'arrow', 'disk', 'beam', 'crystal'];
const MOTION_TYPES = ['outward', 'inward', 'spiral', 'rise', 'vortex', 'explosion', 'orbit', 'tornado'];
const LIGHTNING_TYPES = ['bolt', 'chain', 'strike', 'field'];
const MELEE_SUBTYPES = ['cone', 'aoe', 'single'];
const SKILL_TYPES_LIST = ['projectile', 'area', 'lightning', 'heal', 'melee', 'movement', 'buff'];
const ELEMENTS_LIST = ['fire', 'ice', 'lightning', 'physical', 'nature', 'holy', 'shadow', 'arcane', 'poison'];

const DEFAULT_CONFIG = {
    id: '',
    name: '新技能',
    nameEn: 'New Skill',
    icon: '✨',
    description: '自定義技能',
    type: 'projectile',
    subType: 'cone',
    element: 'fire',
    damage: 100,
    manaCost: 20,
    cooldown: 3,
    range: 30,
    radius: 5,
    coneAngle: 1.05,
    classes: [],
    projectile: {
        shape: 'sphere',
        speed: 18,
        size: 0.5,
        trailLength: 40,
        homing: false,
        spiralPath: false
    },
    colors: {
        primary: '#ff6b35',
        secondary: '#ffaa00',
        glow: '#ff4400',
        core: '#ffffff'
    },
    explosion: {
        enabled: true,
        size: 4.0,
        particles: 300,
        shockwave: true,
        ringWaves: true,
        sparks: true,
        coreFlash: true,
        smoke: false
    },
    particles: {
        amount: 600,
        size: 3.0,
        lifetime: 2.0,
        spreadRadius: 3.0,
        motionType: 'outward',
        spiralStrength: 0.5,
        turbulence: 0.3
    },
    lightning: {
        type: 'bolt',
        branchCount: 5,
        jitterAmount: 0.8,
        flickerRate: 18,
        continuous: false,
        chainCount: 3,
        chainRange: 15,
        chainDamageDecay: 0.8
    },
    slashEffect: {
        swingArc: 120,
        trailLength: 15,
        width: 3
    },
    spinEffect: {
        rotations: 2,
        duration: 1.0,
        particlesPerRotation: 30
    },
    movementEffect: {
        speed: 60,
        trailParticles: true,
        impactEffect: true
    },
    buffEffect: {
        auraSize: 2.5,
        orbCount: 8,
        particleDensity: 0.05
    },
    statusEffect: {
        enabled: false,
        type: 'burn',
        duration: 3,
        damage: 20,
        chance: 0.3
    },
    healAmount: 100,
    hotAmount: 0,
    hotDuration: 0,
    dotDamage: 0,
    dotDuration: 0,
    delay: 0,
    duration: 0,
    stunDuration: 0
};

function SkillEditor({ onClose }) {
    const [allSkills, setAllSkills] = useState({});
    const [selectedSkillId, setSelectedSkillId] = useState(null);
    const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
    const [activeTab, setActiveTab] = useState('basic');
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = useCallback(() => {
        const skills = skillConfigManager.getAllSkills();
        setAllSkills(skills);
    }, []);

    const showMessage = useCallback((text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    }, []);

    const updateConfig = useCallback((key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateNestedConfig = useCallback((section, key, value) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    }, []);

    const deepMerge = useCallback((target, source) => {
        const result = { ...target };
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        });
        return result;
    }, []);

    const selectSkill = useCallback((skillId) => {
        const skill = allSkills[skillId];
        if (skill) {
            setConfig(deepMerge({ ...DEFAULT_CONFIG }, skill));
            setSelectedSkillId(skillId);
            setIsCreatingNew(false);
        }
    }, [allSkills, deepMerge]);

    const createNewSkill = useCallback(() => {
        const newId = 'custom_' + Date.now();
        setConfig({ 
            ...DEFAULT_CONFIG, 
            id: newId,
            name: '新技能',
            nameEn: 'New Skill'
        });
        setSelectedSkillId(null);
        setIsCreatingNew(true);
    }, []);

    const saveSkill = useCallback(() => {
        if (!config.name || !config.type) {
            showMessage('請填寫技能名稱和類型', 'error');
            return;
        }

        const configToSave = {
            ...config,
            updatedAt: Date.now()
        };

        try {
            if (isCreatingNew || !selectedSkillId) {
                const created = skillConfigManager.createSkill(configToSave);
                setSelectedSkillId(created.id);
                setIsCreatingNew(false);
                showMessage(`技能 "${created.name}" 已創建`);
            } else {
                skillConfigManager.updateSkill(selectedSkillId, configToSave);
                showMessage(`技能 "${config.name}" 已更新`);
            }
            skillConfigManager.reload();
            loadSkills();
        } catch (e) {
            showMessage('保存失敗: ' + e.message, 'error');
        }
    }, [config, selectedSkillId, isCreatingNew, loadSkills, showMessage]);

    const deleteSkill = useCallback(() => {
        if (!selectedSkillId) return;
        
        if (window.confirm(`確定要刪除技能 "${config.name}" 嗎？`)) {
            skillConfigManager.deleteSkill(selectedSkillId);
            setSelectedSkillId(null);
            setConfig({ ...DEFAULT_CONFIG });
            setIsCreatingNew(false);
            loadSkills();
            showMessage('技能已刪除');
        }
    }, [selectedSkillId, config.name, loadSkills, showMessage]);

    const duplicateSkill = useCallback(() => {
        if (!selectedSkillId) return;
        
        const duplicated = skillConfigManager.duplicateSkill(selectedSkillId);
        if (duplicated) {
            setConfig(deepMerge({ ...DEFAULT_CONFIG }, duplicated));
            setSelectedSkillId(duplicated.id);
            skillConfigManager.reload();
            loadSkills();
            showMessage('技能已複製');
        }
    }, [selectedSkillId, loadSkills, showMessage, deepMerge]);

    const handleExport = useCallback(() => {
        setExportModalOpen(true);
    }, []);

    const handleImport = useCallback(() => {
        setImportModalOpen(true);
        setImportText('');
    }, []);

    const doImport = useCallback(() => {
        if (!importText.trim()) {
            showMessage('請輸入 JSON 配置', 'error');
            return;
        }
        try {
            const imported = skillConfigManager.importSkill(importText.trim());
            if (imported) {
                setConfig(deepMerge({ ...DEFAULT_CONFIG }, imported));
                setSelectedSkillId(imported.id);
                setIsCreatingNew(false);
                skillConfigManager.reload();
                setImportModalOpen(false);
                loadSkills();
                showMessage(`技能 "${imported.name}" 已導入`);
            } else {
                showMessage('導入失敗: 無效的技能配置 (需要 name 和 type)', 'error');
            }
        } catch (e) {
            showMessage('導入失敗: JSON 格式錯誤', 'error');
        }
    }, [importText, loadSkills, showMessage, deepMerge]);

    const copyToClipboard = useCallback(async () => {
        const exportData = JSON.stringify(config, null, 2);
        try {
            await navigator.clipboard.writeText(exportData);
            showMessage('已複製到剪貼簿');
        } catch (e) {
            showMessage('複製失敗: ' + e.message, 'error');
        }
    }, [config, showMessage]);

    const resetToDefaults = useCallback(() => {
        if (window.confirm('確定要重置所有自定義技能嗎？此操作無法復原。')) {
            skillConfigManager.resetToDefaults();
            loadSkills();
            setSelectedSkillId(null);
            setConfig({ ...DEFAULT_CONFIG });
            showMessage('已重置為預設配置');
        }
    }, [loadSkills, showMessage]);

    const renderSkillList = () => (
        <div className="se-skill-list">
            <div className="se-skill-list-header">
                <span>技能列表</span>
                <button className="se-btn-small" onClick={createNewSkill}>+ 新建</button>
            </div>
            <div className="se-skill-list-content">
                {Object.entries(allSkills).map(([id, skill]) => (
                    <div 
                        key={id}
                        className={`se-skill-item ${selectedSkillId === id ? 'active' : ''} ${skill.isCustom ? 'custom' : ''}`}
                        onClick={() => selectSkill(id)}
                    >
                        <span className="se-skill-icon">{skill.icon}</span>
                        <div className="se-skill-info">
                            <span className="se-skill-name">{skill.name}</span>
                            <span className="se-skill-type">{skill.type} | {skill.element}</span>
                        </div>
                        {skill.isCustom && <span className="se-custom-badge">自</span>}
                    </div>
                ))}
            </div>
            <div className="se-skill-list-footer">
                <button className="se-btn-small se-btn-secondary" onClick={resetToDefaults}>
                    重置
                </button>
            </div>
        </div>
    );

    const renderBasicTab = () => (
        <div className="se-tab-content">
            <div className="se-section">
                <div className="se-section-title">基本設定</div>
                <div className="se-row">
                    <label>ID</label>
                    <input 
                        type="text" 
                        className="se-input se-input-readonly" 
                        value={config.id}
                        readOnly
                    />
                </div>
                <div className="se-row">
                    <label>技能名稱</label>
                    <input 
                        type="text" 
                        className="se-input" 
                        value={config.name}
                        onChange={e => updateConfig('name', e.target.value)}
                    />
                </div>
                <div className="se-row">
                    <label>英文名稱</label>
                    <input 
                        type="text" 
                        className="se-input" 
                        value={config.nameEn || ''}
                        onChange={e => updateConfig('nameEn', e.target.value)}
                    />
                </div>
                <div className="se-row">
                    <label>圖示</label>
                    <input 
                        type="text" 
                        className="se-input" 
                        value={config.icon}
                        onChange={e => updateConfig('icon', e.target.value)}
                        style={{ width: '60px' }}
                    />
                    <span style={{ fontSize: '24px', marginLeft: '10px' }}>{config.icon}</span>
                </div>
                <div className="se-row">
                    <label>描述</label>
                    <input 
                        type="text" 
                        className="se-input" 
                        value={config.description}
                        onChange={e => updateConfig('description', e.target.value)}
                    />
                </div>
            </div>
            
            <div className="se-section">
                <div className="se-section-title">類型與元素</div>
                <div className="se-row">
                    <label>技能類型</label>
                    <select 
                        className="se-select"
                        value={config.type}
                        onChange={e => updateConfig('type', e.target.value)}
                    >
                        {SKILL_TYPES_LIST.map(t => (
                            <option key={t} value={t}>{t === 'projectile' ? '投射物' : t === 'area' ? '範圍' : t === 'melee' ? '近戰' : t === 'movement' ? '移動' : t === 'lightning' ? '閃電' : t === 'heal' ? '治療' : t === 'buff' ? '增益' : t}</option>
                        ))}
                    </select>
                </div>
                {config.type === 'melee' && (
                <div className="se-row">
                    <label>近戰子類型</label>
                    <select 
                        className="se-select"
                        value={config.subType || 'cone'}
                        onChange={e => updateConfig('subType', e.target.value)}
                    >
                        {MELEE_SUBTYPES.map(t => (
                            <option key={t} value={t}>{t === 'cone' ? '錐形斬擊' : t === 'aoe' ? '範圍旋轉' : '單體攻擊'}</option>
                        ))}
                    </select>
                </div>
                )}
                <div className="se-row">
                    <label>元素屬性</label>
                    <select 
                        className="se-select"
                        value={config.element}
                        onChange={e => updateConfig('element', e.target.value)}
                    >
                        {ELEMENTS_LIST.map(e => (
                            <option key={e} value={e}>{e}</option>
                        ))}
                    </select>
                </div>
                <div className="se-row">
                    <label>適用職業</label>
                    <input 
                        type="text" 
                        className="se-input" 
                        value={(config.classes || []).join(', ')}
                        onChange={e => updateConfig('classes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="mage, warrior, archer, druid"
                    />
                </div>
            </div>

            <div className="se-section">
                <div className="se-section-title">數值</div>
                <div className="se-row">
                    <label>傷害</label>
                    <input 
                        type="number" 
                        className="se-input" 
                        value={config.damage}
                        onChange={e => updateConfig('damage', parseInt(e.target.value) || 0)}
                    />
                </div>
                <div className="se-row">
                    <label>魔力消耗</label>
                    <input 
                        type="number" 
                        className="se-input" 
                        value={config.manaCost}
                        onChange={e => updateConfig('manaCost', parseInt(e.target.value) || 0)}
                    />
                </div>
                <div className="se-row">
                    <label>冷卻時間</label>
                    <input 
                        type="number" 
                        className="se-input" 
                        value={config.cooldown}
                        onChange={e => updateConfig('cooldown', parseFloat(e.target.value) || 0)}
                        step="0.5"
                    />
                </div>
                <div className="se-row">
                    <label>射程</label>
                    <input 
                        type="number" 
                        className="se-input" 
                        value={config.range}
                        onChange={e => updateConfig('range', parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div className="se-row">
                    <label>半徑</label>
                    <input 
                        type="number" 
                        className="se-input" 
                        value={config.radius}
                        onChange={e => updateConfig('radius', parseFloat(e.target.value) || 0)}
                    />
                </div>
            </div>
        </div>
    );

    const renderColorsTab = () => (
        <div className="se-tab-content">
            <div className="se-section">
                <div className="se-section-title">顏色配置</div>
                <div className="se-color-grid">
                    {['primary', 'secondary', 'glow', 'core'].map(colorKey => (
                        <div key={colorKey} className="se-color-item">
                            <label>{colorKey === 'primary' ? '主色' : 
                                    colorKey === 'secondary' ? '輔色' : 
                                    colorKey === 'glow' ? '發光色' : '核心色'}</label>
                            <input 
                                type="color" 
                                value={config.colors?.[colorKey] || '#ffffff'}
                                onChange={e => updateNestedConfig('colors', colorKey, e.target.value)}
                            />
                            <span>{config.colors?.[colorKey] || '#ffffff'}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderProjectileTab = () => (
        <div className="se-tab-content">
            <div className="se-section">
                <div className="se-section-title">投射物設定</div>
                <div className="se-row">
                    <label>形狀</label>
                    <div className="se-shape-grid">
                        {PROJECTILE_SHAPES.map(shape => (
                            <div 
                                key={shape}
                                className={`se-shape-btn ${config.projectile?.shape === shape ? 'active' : ''}`}
                                onClick={() => updateNestedConfig('projectile', 'shape', shape)}
                            >
                                <span>{shape}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="se-slider-row">
                    <label>速度: {config.projectile?.speed || 18}</label>
                    <input 
                        type="range" 
                        min="5" max="50" 
                        value={config.projectile?.speed || 18}
                        onChange={e => updateNestedConfig('projectile', 'speed', parseFloat(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>大小: {config.projectile?.size || 0.5}</label>
                    <input 
                        type="range" 
                        min="0.2" max="2" step="0.1"
                        value={config.projectile?.size || 0.5}
                        onChange={e => updateNestedConfig('projectile', 'size', parseFloat(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>尾跡長度: {config.projectile?.trailLength || 40}</label>
                    <input 
                        type="range" 
                        min="10" max="100" step="5"
                        value={config.projectile?.trailLength || 40}
                        onChange={e => updateNestedConfig('projectile', 'trailLength', parseInt(e.target.value))}
                    />
                </div>
                <div className="se-toggles">
                    <label className="se-toggle">
                        <span>追蹤目標</span>
                        <input 
                            type="checkbox" 
                            checked={config.projectile?.homing || false}
                            onChange={e => updateNestedConfig('projectile', 'homing', e.target.checked)}
                        />
                    </label>
                </div>
            </div>
            
            <div className="se-section">
                <div className="se-section-title">爆炸效果</div>
                <label className="se-toggle">
                    <span>啟用爆炸</span>
                    <input 
                        type="checkbox" 
                        checked={config.explosion?.enabled || false}
                        onChange={e => updateNestedConfig('explosion', 'enabled', e.target.checked)}
                    />
                </label>
                {config.explosion?.enabled && (
                    <>
                        <div className="se-slider-row">
                            <label>大小: {config.explosion?.size || 4}</label>
                            <input 
                                type="range" 
                                min="1" max="15" step="0.5"
                                value={config.explosion?.size || 4}
                                onChange={e => updateNestedConfig('explosion', 'size', parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="se-slider-row">
                            <label>粒子數: {config.explosion?.particles || 300}</label>
                            <input 
                                type="range" 
                                min="50" max="1000" step="50"
                                value={config.explosion?.particles || 300}
                                onChange={e => updateNestedConfig('explosion', 'particles', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="se-toggles">
                            <label className="se-toggle">
                                <span>衝擊波</span>
                                <input type="checkbox" checked={config.explosion?.shockwave || false} 
                                    onChange={e => updateNestedConfig('explosion', 'shockwave', e.target.checked)} />
                            </label>
                            <label className="se-toggle">
                                <span>環形波紋</span>
                                <input type="checkbox" checked={config.explosion?.ringWaves || false} 
                                    onChange={e => updateNestedConfig('explosion', 'ringWaves', e.target.checked)} />
                            </label>
                            <label className="se-toggle">
                                <span>火花碎片</span>
                                <input type="checkbox" checked={config.explosion?.sparks || false} 
                                    onChange={e => updateNestedConfig('explosion', 'sparks', e.target.checked)} />
                            </label>
                            <label className="se-toggle">
                                <span>煙霧</span>
                                <input type="checkbox" checked={config.explosion?.smoke || false} 
                                    onChange={e => updateNestedConfig('explosion', 'smoke', e.target.checked)} />
                            </label>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const renderLightningTab = () => (
        <div className="se-tab-content">
            <div className="se-section">
                <div className="se-section-title">閃電設定</div>
                <div className="se-row">
                    <label>類型</label>
                    <select 
                        className="se-select"
                        value={config.lightning?.type || 'bolt'}
                        onChange={e => updateNestedConfig('lightning', 'type', e.target.value)}
                    >
                        <option value="bolt">直線閃電</option>
                        <option value="chain">連鎖閃電</option>
                        <option value="strike">雷擊</option>
                        <option value="field">電場</option>
                    </select>
                </div>
                <div className="se-slider-row">
                    <label>分支數量: {config.lightning?.branchCount || 5}</label>
                    <input 
                        type="range" 
                        min="0" max="15"
                        value={config.lightning?.branchCount || 5}
                        onChange={e => updateNestedConfig('lightning', 'branchCount', parseInt(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>鋸齒強度: {config.lightning?.jitterAmount || 0.8}</label>
                    <input 
                        type="range" 
                        min="0.1" max="3" step="0.1"
                        value={config.lightning?.jitterAmount || 0.8}
                        onChange={e => updateNestedConfig('lightning', 'jitterAmount', parseFloat(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>閃爍頻率: {config.lightning?.flickerRate || 18}</label>
                    <input 
                        type="range" 
                        min="5" max="40"
                        value={config.lightning?.flickerRate || 18}
                        onChange={e => updateNestedConfig('lightning', 'flickerRate', parseInt(e.target.value))}
                    />
                </div>
                {config.lightning?.type === 'chain' && (
                    <>
                        <div className="se-slider-row">
                            <label>連鎖次數: {config.lightning?.chainCount || 3}</label>
                            <input 
                                type="range" 
                                min="1" max="10"
                                value={config.lightning?.chainCount || 3}
                                onChange={e => updateNestedConfig('lightning', 'chainCount', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="se-slider-row">
                            <label>連鎖範圍: {config.lightning?.chainRange || 15}</label>
                            <input 
                                type="range" 
                                min="5" max="30"
                                value={config.lightning?.chainRange || 15}
                                onChange={e => updateNestedConfig('lightning', 'chainRange', parseInt(e.target.value))}
                            />
                        </div>
                    </>
                )}
                <label className="se-toggle">
                    <span>持續閃電</span>
                    <input 
                        type="checkbox" 
                        checked={config.lightning?.continuous || false}
                        onChange={e => updateNestedConfig('lightning', 'continuous', e.target.checked)}
                    />
                </label>
            </div>
        </div>
    );

    const renderStatusTab = () => (
        <div className="se-tab-content">
            <div className="se-section">
                <div className="se-section-title">狀態效果</div>
                <label className="se-toggle">
                    <span>啟用狀態效果</span>
                    <input 
                        type="checkbox" 
                        checked={config.statusEffect?.enabled || false}
                        onChange={e => updateNestedConfig('statusEffect', 'enabled', e.target.checked)}
                    />
                </label>
                {config.statusEffect?.enabled && (
                    <>
                        <div className="se-row">
                            <label>狀態類型</label>
                            <select 
                                className="se-select"
                                value={config.statusEffect?.type || 'burn'}
                                onChange={e => updateNestedConfig('statusEffect', 'type', e.target.value)}
                            >
                                <option value="burn">燃燒</option>
                                <option value="freeze">冰凍</option>
                                <option value="shock">感電</option>
                                <option value="poison">中毒</option>
                                <option value="chill">緩速</option>
                                <option value="stun">暈眩</option>
                            </select>
                        </div>
                        <div className="se-slider-row">
                            <label>持續時間: {config.statusEffect?.duration || 3}s</label>
                            <input 
                                type="range" 
                                min="1" max="10" step="0.5"
                                value={config.statusEffect?.duration || 3}
                                onChange={e => updateNestedConfig('statusEffect', 'duration', parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="se-slider-row">
                            <label>觸發機率: {Math.round((config.statusEffect?.chance || 0.3) * 100)}%</label>
                            <input 
                                type="range" 
                                min="0" max="1" step="0.05"
                                value={config.statusEffect?.chance || 0.3}
                                onChange={e => updateNestedConfig('statusEffect', 'chance', parseFloat(e.target.value))}
                            />
                        </div>
                        {['burn', 'poison'].includes(config.statusEffect?.type) && (
                            <div className="se-slider-row">
                                <label>每秒傷害: {config.statusEffect?.damage || 20}</label>
                                <input 
                                    type="range" 
                                    min="5" max="100" step="5"
                                    value={config.statusEffect?.damage || 20}
                                    onChange={e => updateNestedConfig('statusEffect', 'damage', parseInt(e.target.value))}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    const renderBuffTab = () => (
        <div className="se-tab-content">
            <div className="se-section">
                <div className="se-section-title">增益效果設定</div>
                <div className="se-slider-row">
                    <label>持續時間: {config.duration || 5}s</label>
                    <input 
                        type="range" 
                        min="1" max="30" step="1"
                        value={config.duration || 5}
                        onChange={e => updateConfig('duration', parseInt(e.target.value))}
                    />
                </div>
                
                <div className="se-section-title" style={{ marginTop: '15px' }}>增益類型</div>
                
                <div className="se-slider-row">
                    <label>攻擊力加成: {Math.round((config.attackBoost || 0) * 100)}%</label>
                    <input 
                        type="range" 
                        min="0" max="1" step="0.05"
                        value={config.attackBoost || 0}
                        onChange={e => updateConfig('attackBoost', parseFloat(e.target.value))}
                    />
                </div>
                
                <div className="se-slider-row">
                    <label>生命值加成: {config.hpBoost || 0}</label>
                    <input 
                        type="range" 
                        min="0" max="1000" step="50"
                        value={config.hpBoost || 0}
                        onChange={e => updateConfig('hpBoost', parseInt(e.target.value))}
                    />
                </div>
                
                <div className="se-slider-row">
                    <label>反傷傷害: {config.reflectDamage || 0}</label>
                    <input 
                        type="range" 
                        min="0" max="200" step="10"
                        value={config.reflectDamage || 0}
                        onChange={e => updateConfig('reflectDamage', parseInt(e.target.value))}
                    />
                </div>
                
                <div className="se-slider-row">
                    <label>護盾值: {config.shield || 0}</label>
                    <input 
                        type="range" 
                        min="0" max="500" step="25"
                        value={config.shield || 0}
                        onChange={e => updateConfig('shield', parseInt(e.target.value))}
                    />
                </div>
            </div>
            
            <div className="se-section">
                <div className="se-section-title">視覺效果</div>
                <div className="se-slider-row">
                    <label>光環大小: {config.buffEffect?.auraSize || 2.5}</label>
                    <input 
                        type="range" 
                        min="1" max="5" step="0.5"
                        value={config.buffEffect?.auraSize || 2.5}
                        onChange={e => updateNestedConfig('buffEffect', 'auraSize', parseFloat(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>環繞球數量: {config.buffEffect?.orbCount || 8}</label>
                    <input 
                        type="range" 
                        min="4" max="16" step="1"
                        value={config.buffEffect?.orbCount || 8}
                        onChange={e => updateNestedConfig('buffEffect', 'orbCount', parseInt(e.target.value))}
                    />
                </div>
            </div>
        </div>
    );

    const renderParticlesTab = () => (
        <div className="se-tab-content">
            <div className="se-section">
                <div className="se-section-title">粒子參數</div>
                <div className="se-slider-row">
                    <label>數量: {config.particles?.amount || 600}</label>
                    <input 
                        type="range" 
                        min="50" max="2000" step="50"
                        value={config.particles?.amount || 600}
                        onChange={e => updateNestedConfig('particles', 'amount', parseInt(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>大小: {config.particles?.size || 3}</label>
                    <input 
                        type="range" 
                        min="0.5" max="12" step="0.5"
                        value={config.particles?.size || 3}
                        onChange={e => updateNestedConfig('particles', 'size', parseFloat(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>生命週期: {config.particles?.lifetime || 2}s</label>
                    <input 
                        type="range" 
                        min="0.5" max="6" step="0.1"
                        value={config.particles?.lifetime || 2}
                        onChange={e => updateNestedConfig('particles', 'lifetime', parseFloat(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>擴散半徑: {config.particles?.spreadRadius || 3}</label>
                    <input 
                        type="range" 
                        min="0.5" max="10" step="0.5"
                        value={config.particles?.spreadRadius || 3}
                        onChange={e => updateNestedConfig('particles', 'spreadRadius', parseFloat(e.target.value))}
                    />
                </div>
            </div>
            
            <div className="se-section">
                <div className="se-section-title">運動模式</div>
                <div className="se-motion-grid">
                    {MOTION_TYPES.map(motion => (
                        <div 
                            key={motion}
                            className={`se-motion-btn ${config.particles?.motionType === motion ? 'active' : ''}`}
                            onClick={() => updateNestedConfig('particles', 'motionType', motion)}
                        >
                            {motion}
                        </div>
                    ))}
                </div>
                <div className="se-slider-row">
                    <label>螺旋強度: {config.particles?.spiralStrength || 0.5}</label>
                    <input 
                        type="range" 
                        min="0" max="3" step="0.1"
                        value={config.particles?.spiralStrength || 0.5}
                        onChange={e => updateNestedConfig('particles', 'spiralStrength', parseFloat(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>隨機抖動: {config.particles?.turbulence || 0.3}</label>
                    <input 
                        type="range" 
                        min="0" max="2" step="0.1"
                        value={config.particles?.turbulence || 0.3}
                        onChange={e => updateNestedConfig('particles', 'turbulence', parseFloat(e.target.value))}
                    />
                </div>
            </div>
        </div>
    );

    const renderMeleeTab = () => (
        <div className="se-tab-content">
            <div className="se-section">
                <div className="se-section-title">近戰類型</div>
                <div className="se-row">
                    <label>子類型</label>
                    <select 
                        className="se-select"
                        value={config.subType || 'cone'}
                        onChange={e => updateConfig('subType', e.target.value)}
                    >
                        {MELEE_SUBTYPES.map(t => (
                            <option key={t} value={t}>{t === 'cone' ? '錐形斬擊' : t === 'aoe' ? '範圍旋轉' : '單體攻擊'}</option>
                        ))}
                    </select>
                </div>
                <div className="se-slider-row">
                    <label>攻擊範圍: {config.range || 8}</label>
                    <input 
                        type="range" 
                        min="2" max="20" step="1"
                        value={config.range || 8}
                        onChange={e => updateConfig('range', parseInt(e.target.value))}
                    />
                </div>
                {config.subType === 'cone' && (
                    <>
                        <div className="se-slider-row">
                            <label>錐形角度: {Math.round((config.coneAngle || 1.05) * 180 / Math.PI)}°</label>
                            <input 
                                type="range" 
                                min="0.3" max="2" step="0.1"
                                value={config.coneAngle || 1.05}
                                onChange={e => updateConfig('coneAngle', parseFloat(e.target.value))}
                            />
                        </div>
                    </>
                )}
                {config.subType === 'aoe' && (
                    <>
                        <div className="se-slider-row">
                            <label>範圍半徑: {config.radius || 12}</label>
                            <input 
                                type="range" 
                                min="3" max="25" step="1"
                                value={config.radius || 12}
                                onChange={e => updateConfig('radius', parseInt(e.target.value))}
                            />
                        </div>
                    </>
                )}
            </div>
            
            {config.subType === 'cone' && (
            <div className="se-section">
                <div className="se-section-title">斬擊效果</div>
                <div className="se-slider-row">
                    <label>揮砍弧度: {config.slashEffect?.swingArc || 120}°</label>
                    <input 
                        type="range" 
                        min="60" max="180" step="10"
                        value={config.slashEffect?.swingArc || 120}
                        onChange={e => updateNestedConfig('slashEffect', 'swingArc', parseInt(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>軌跡長度: {config.slashEffect?.trailLength || 15}</label>
                    <input 
                        type="range" 
                        min="5" max="30" step="1"
                        value={config.slashEffect?.trailLength || 15}
                        onChange={e => updateNestedConfig('slashEffect', 'trailLength', parseInt(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>軌跡寬度: {config.slashEffect?.width || 3}</label>
                    <input 
                        type="range" 
                        min="1" max="10" step="0.5"
                        value={config.slashEffect?.width || 3}
                        onChange={e => updateNestedConfig('slashEffect', 'width', parseFloat(e.target.value))}
                    />
                </div>
            </div>
            )}
            
            {config.subType === 'aoe' && (
            <div className="se-section">
                <div className="se-section-title">旋風效果</div>
                <div className="se-slider-row">
                    <label>旋轉次數: {config.spinEffect?.rotations || 2}</label>
                    <input 
                        type="range" 
                        min="1" max="5" step="0.5"
                        value={config.spinEffect?.rotations || 2}
                        onChange={e => updateNestedConfig('spinEffect', 'rotations', parseFloat(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>持續時間: {config.spinEffect?.duration || 1.0}s</label>
                    <input 
                        type="range" 
                        min="0.5" max="3" step="0.1"
                        value={config.spinEffect?.duration || 1.0}
                        onChange={e => updateNestedConfig('spinEffect', 'duration', parseFloat(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>每圈粒子數: {config.spinEffect?.particlesPerRotation || 30}</label>
                    <input 
                        type="range" 
                        min="10" max="60" step="5"
                        value={config.spinEffect?.particlesPerRotation || 30}
                        onChange={e => updateNestedConfig('spinEffect', 'particlesPerRotation', parseInt(e.target.value))}
                    />
                </div>
            </div>
            )}
        </div>
    );

    const renderMovementTab = () => (
        <div className="se-tab-content">
            <div className="se-section">
                <div className="se-section-title">移動技能設定</div>
                <div className="se-slider-row">
                    <label>移動速度: {config.movementEffect?.speed || 60}</label>
                    <input 
                        type="range" 
                        min="20" max="100" step="5"
                        value={config.movementEffect?.speed || 60}
                        onChange={e => updateNestedConfig('movementEffect', 'speed', parseInt(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>衝鋒距離: {config.range || 25}</label>
                    <input 
                        type="range" 
                        min="5" max="50" step="1"
                        value={config.range || 25}
                        onChange={e => updateConfig('range', parseInt(e.target.value))}
                    />
                </div>
                <div className="se-slider-row">
                    <label>暈眩時間: {config.stunDuration || 1.5}s</label>
                    <input 
                        type="range" 
                        min="0" max="5" step="0.5"
                        value={config.stunDuration || 1.5}
                        onChange={e => updateConfig('stunDuration', parseFloat(e.target.value))}
                    />
                </div>
            </div>
            
            <div className="se-section">
                <div className="se-section-title">移動效果</div>
                <div className="se-toggles">
                    <label className="se-toggle">
                        <span>軌跡粒子</span>
                        <input 
                            type="checkbox" 
                            checked={config.movementEffect?.trailParticles !== false}
                            onChange={e => updateNestedConfig('movementEffect', 'trailParticles', e.target.checked)}
                        />
                    </label>
                    <label className="se-toggle">
                        <span>衝擊效果</span>
                        <input 
                            type="checkbox" 
                            checked={config.movementEffect?.impactEffect !== false}
                            onChange={e => updateNestedConfig('movementEffect', 'impactEffect', e.target.checked)}
                        />
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <div className="se-overlay" onClick={onClose}>
            <div className="se-container se-container-wide" onClick={e => e.stopPropagation()}>
                <div className="se-header">
                    <h2>⚔️ 技能編輯器</h2>
                    <button className="se-close-btn" onClick={onClose}>✕</button>
                </div>
                
                {message && (
                    <div className={`se-message ${message.type}`}>
                        {message.text}
                    </div>
                )}
                
                <div className="se-main-content">
                    {renderSkillList()}
                    
                    <div className="se-editor-panel">
                        <div className="se-tabs">
                            <button className={`se-tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本</button>
                            <button className={`se-tab ${activeTab === 'colors' ? 'active' : ''}`} onClick={() => setActiveTab('colors')}>顏色</button>
                            <button className={`se-tab ${activeTab === 'projectile' ? 'active' : ''}`} onClick={() => setActiveTab('projectile')}>投射物</button>
                            <button className={`se-tab ${activeTab === 'melee' ? 'active' : ''}`} onClick={() => setActiveTab('melee')}>近戰</button>
                            <button className={`se-tab ${activeTab === 'movement' ? 'active' : ''}`} onClick={() => setActiveTab('movement')}>移動</button>
                            <button className={`se-tab ${activeTab === 'lightning' ? 'active' : ''}`} onClick={() => setActiveTab('lightning')}>閃電</button>
                            <button className={`se-tab ${activeTab === 'particles' ? 'active' : ''}`} onClick={() => setActiveTab('particles')}>粒子</button>
                            <button className={`se-tab ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>狀態</button>
                            <button className={`se-tab ${activeTab === 'buff' ? 'active' : ''}`} onClick={() => setActiveTab('buff')}>增益</button>
                        </div>
                        
                        <div className="se-content">
                            {activeTab === 'basic' && renderBasicTab()}
                            {activeTab === 'colors' && renderColorsTab()}
                            {activeTab === 'projectile' && renderProjectileTab()}
                            {activeTab === 'melee' && renderMeleeTab()}
                            {activeTab === 'movement' && renderMovementTab()}
                            {activeTab === 'lightning' && renderLightningTab()}
                            {activeTab === 'particles' && renderParticlesTab()}
                            {activeTab === 'status' && renderStatusTab()}
                            {activeTab === 'buff' && renderBuffTab()}
                        </div>
                    </div>
                    
                    <SkillPreview config={config} />
                </div>
                
                <div className="se-footer">
                    <div className="se-footer-left">
                        {selectedSkillId && !isCreatingNew && (
                            <>
                                <button className="se-btn se-btn-secondary" onClick={duplicateSkill}>複製</button>
                                <button className="se-btn se-btn-danger" onClick={deleteSkill}>刪除</button>
                            </>
                        )}
                    </div>
                    <div className="se-footer-right">
                        <button className="se-btn se-btn-secondary" onClick={handleImport}>導入</button>
                        <button className="se-btn se-btn-secondary" onClick={handleExport}>導出</button>
                        <button className="se-btn se-btn-primary" onClick={saveSkill}>
                            {isCreatingNew ? '創建技能' : '保存修改'}
                        </button>
                    </div>
                </div>
            </div>
            
            {exportModalOpen && (
                <div className="se-modal" onClick={() => setExportModalOpen(false)}>
                    <div className="se-modal-content" onClick={e => e.stopPropagation()}>
                        <h3>導出配置 - {config.name}</h3>
                        <pre className="se-export-code">
                            {JSON.stringify(config, null, 2)}
                        </pre>
                        <div className="se-modal-actions">
                            <button className="se-btn se-btn-secondary" onClick={copyToClipboard}>複製</button>
                            <button className="se-btn se-btn-primary" onClick={() => setExportModalOpen(false)}>關閉</button>
                        </div>
                    </div>
                </div>
            )}
            
            {importModalOpen && (
                <div className="se-modal" onClick={() => setImportModalOpen(false)}>
                    <div className="se-modal-content" onClick={e => e.stopPropagation()}>
                        <h3>導入配置</h3>
                        <textarea 
                            className="se-import-textarea"
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            placeholder="貼上 JSON 配置..."
                        />
                        <div className="se-modal-actions">
                            <button className="se-btn se-btn-secondary" onClick={() => setImportModalOpen(false)}>取消</button>
                            <button className="se-btn se-btn-primary" onClick={doImport}>導入</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SkillEditor;

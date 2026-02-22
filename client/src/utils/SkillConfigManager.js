import defaultSkillConfigs, { SKILL_TYPES, ELEMENTS, STATUS_EFFECTS } from '../data/skillConfigs';

const STORAGE_KEY = 'd2game_custom_skills';
const VERSION_KEY = 'd2game_skill_version';
const CURRENT_VERSION = 1;

class SkillConfigManager {
    constructor() {
        this.customSkills = {};
        this.mergedConfigs = { ...defaultSkillConfigs };
        this.loadCustomSkills();
    }
    
    loadCustomSkills() {
        try {
            const version = localStorage.getItem(VERSION_KEY);
            if (version !== String(CURRENT_VERSION)) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
                return;
            }
            
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.customSkills = JSON.parse(stored);
                this._mergeConfigs();
            }
        } catch (e) {
            console.error('Failed to load custom skills:', e);
            this.customSkills = {};
        }
    }
    
    _deepMerge(target, source) {
        const result = { ...target };
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        });
        return result;
    }
    
    _mergeConfigs() {
        this.mergedConfigs = { ...defaultSkillConfigs };
        Object.keys(this.customSkills).forEach(key => {
            if (this.customSkills[key].deleted) {
                delete this.mergedConfigs[key];
            } else {
                this.mergedConfigs[key] = this._deepMerge(
                    defaultSkillConfigs[key] || {},
                    this.customSkills[key]
                );
            }
        });
    }
    
    _saveCustomSkills() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customSkills));
            this._mergeConfigs();
            console.log('[SkillConfigManager] Saved custom skills:', Object.keys(this.customSkills));
        } catch (e) {
            console.error('Failed to save custom skills:', e);
        }
    }
    
    getAllSkills() {
        this._mergeConfigs();
        return { ...this.mergedConfigs };
    }
    
    getSkill(skillId) {
        this._mergeConfigs();
        return this.mergedConfigs[skillId] || null;
    }
    
    reload() {
        this.loadCustomSkills();
        console.log('[SkillConfigManager] Reloaded, custom skills:', Object.keys(this.customSkills));
    }
    
    isSkillModified(skillId) {
        const result = !!(this.customSkills[skillId] && !this.customSkills[skillId].deleted);
        console.log(`[SkillConfigManager] isSkillModified(${skillId}):`, result, 'customSkills keys:', Object.keys(this.customSkills));
        return result;
    }
    
    getSkillsByClass(className) {
        return Object.values(this.mergedConfigs).filter(
            skill => skill.classes && skill.classes.includes(className)
        );
    }
    
    createSkill(config) {
        const id = config.id || this._generateId(config.name);
        const newSkill = {
            id,
            ...config,
            isCustom: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this.customSkills[id] = newSkill;
        this._saveCustomSkills();
        return newSkill;
    }
    
    updateSkill(skillId, updates) {
        if (!this.mergedConfigs[skillId]) {
            return null;
        }
        
        const existingCustom = this.customSkills[skillId] || {};
        this.customSkills[skillId] = {
            ...existingCustom,
            ...updates,
            id: skillId,
            updatedAt: Date.now()
        };
        
        if (!this.customSkills[skillId].isCustom && !defaultSkillConfigs[skillId]) {
            this.customSkills[skillId].isCustom = true;
        }
        
        this._saveCustomSkills();
        return this.mergedConfigs[skillId];
    }
    
    deleteSkill(skillId) {
        if (defaultSkillConfigs[skillId]) {
            this.customSkills[skillId] = { deleted: true };
        } else {
            delete this.customSkills[skillId];
        }
        this._saveCustomSkills();
        return true;
    }
    
    restoreSkill(skillId) {
        if (this.customSkills[skillId]) {
            delete this.customSkills[skillId].deleted;
            if (Object.keys(this.customSkills[skillId]).length === 0 ||
                (this.customSkills[skillId].isCustom === undefined && !defaultSkillConfigs[skillId])) {
                delete this.customSkills[skillId];
            }
            this._saveCustomSkills();
        }
        return this.mergedConfigs[skillId] || defaultSkillConfigs[skillId] || null;
    }
    
    duplicateSkill(skillId) {
        const original = this.mergedConfigs[skillId];
        if (!original) return null;
        
        const newId = this._generateId(original.name + '_copy');
        const duplicate = {
            ...original,
            id: newId,
            name: original.name + ' (副本)',
            isCustom: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this.customSkills[newId] = duplicate;
        this._saveCustomSkills();
        return duplicate;
    }
    
    _generateId(baseName) {
        const base = baseName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        let id = base;
        let counter = 1;
        while (this.mergedConfigs[id]) {
            id = `${base}_${counter}`;
            counter++;
        }
        return id;
    }
    
    exportSkill(skillId) {
        const skill = this.mergedConfigs[skillId];
        if (!skill) return null;
        return JSON.stringify(skill, null, 2);
    }
    
    exportAllSkills() {
        return JSON.stringify({
            version: CURRENT_VERSION,
            exportedAt: new Date().toISOString(),
            skills: this.mergedConfigs
        }, null, 2);
    }
    
    importSkill(jsonString) {
        try {
            const config = JSON.parse(jsonString);
            if (!config.name || !config.type) {
                throw new Error('Invalid skill config: missing name or type');
            }
            
            const id = config.id || this._generateId(config.name);
            const imported = {
                ...config,
                id,
                isCustom: true,
                importedAt: Date.now(),
                updatedAt: Date.now()
            };
            
            this.customSkills[id] = imported;
            this._saveCustomSkills();
            return imported;
        } catch (e) {
            console.error('Failed to import skill:', e);
            return null;
        }
    }
    
    importSkills(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const skills = data.skills || data;
            
            if (typeof skills !== 'object') {
                throw new Error('Invalid skills data');
            }
            
            const results = [];
            Object.values(skills).forEach(skill => {
                if (skill.name && skill.type) {
                    const id = skill.id || this._generateId(skill.name);
                    this.customSkills[id] = {
                        ...skill,
                        id,
                        isCustom: true,
                        importedAt: Date.now(),
                        updatedAt: Date.now()
                    };
                    results.push(id);
                }
            });
            
            this._saveCustomSkills();
            return results;
        } catch (e) {
            console.error('Failed to import skills:', e);
            return [];
        }
    }
    
    resetToDefaults() {
        this.customSkills = {};
        this._saveCustomSkills();
        return true;
    }
    
    getCustomSkills() {
        return Object.values(this.customSkills).filter(s => !s.deleted);
    }
    
    getDefaults() {
        return { ...defaultSkillConfigs };
    }
}

const skillConfigManager = new SkillConfigManager();

export { SKILL_TYPES, ELEMENTS, STATUS_EFFECTS };
export default skillConfigManager;

/**
 * Ingredient Analysis System
 * Analyzes ingredients and provides health recommendations
 */

class AnalysisManager {
    constructor() {
        this.ingredients = [];
        this.riskWeights = {
            'muy_seguro': 0,
            'seguro': 1,
            'moderado': 3,
            'alto_riesgo': 7,
            'peligroso': 10
        };
    }
    
    async analyzeIngredients(detectedIngredients, fullText, imageData) {
        try {
            console.log('Starting ingredient analysis...');
            
            // Show loading
            document.getElementById('loading-modal').classList.add('active');
            document.getElementById('loading-text').textContent = 'Analizando ingredientes...';
            
            // Load ingredient database
            await this.loadIngredientDatabase();
            
            // Match detected ingredients with database
            const analysis = await this.performAnalysis(detectedIngredients, fullText);
            
            // Save analysis to database
            const analysisId = await this.saveAnalysis(analysis, imageData);
            
            // Display results
            this.displayResults(analysis);
            
            // Hide loading
            document.getElementById('loading-modal').classList.remove('active');
            
            console.log('Analysis completed successfully');
            
        } catch (error) {
            console.error('Error in ingredient analysis:', error);
            document.getElementById('loading-modal').classList.remove('active');
            this.showError('Error al analizar ingredientes: ' + error.message);
        }
    }
    
    async loadIngredientDatabase() {
        if (this.ingredients.length > 0) return; // Already loaded
        
        try {
            const response = await fetch('tables/ingredients');
            const data = await response.json();
            this.ingredients = data.data || [];
            console.log(`Loaded ${this.ingredients.length} ingredients from database`);
        } catch (error) {
            console.error('Error loading ingredient database:', error);
            this.ingredients = [];
        }
    }
    
    async performAnalysis(detectedIngredients, fullText) {
        const analysis = {
            detectedIngredients: detectedIngredients,
            fullText: fullText,
            matchedIngredients: [],
            unknownIngredients: [],
            harmfulIngredients: [],
            beneficialIngredients: [],
            riskScore: 0,
            healthScoreHuman: 100,
            healthScoreAnimal: 100,
            recommendations: []
        };
        
        // Match each detected ingredient
        for (const detected of detectedIngredients) {
            const matched = this.findMatchingIngredient(detected);
            
            if (matched) {
                analysis.matchedIngredients.push({
                    detected: detected,
                    ingredient: matched
                });
                
                // Categorize ingredient
                if (matched.risk_level === 'alto_riesgo' || matched.risk_level === 'peligroso') {
                    analysis.harmfulIngredients.push(matched);
                } else if (matched.risk_level === 'muy_seguro' || matched.risk_level === 'seguro') {
                    analysis.beneficialIngredients.push(matched);
                }
                
            } else {
                analysis.unknownIngredients.push(detected);
            }
        }
        
        // Calculate scores
        analysis.riskScore = this.calculateRiskScore(analysis.matchedIngredients);
        analysis.healthScoreHuman = Math.max(0, 100 - analysis.riskScore);
        analysis.healthScoreAnimal = this.calculateAnimalHealthScore(analysis.matchedIngredients);
        
        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);
        
        // Detect product category
        analysis.productCategory = this.detectProductCategory(fullText);
        
        console.log('Analysis completed:', analysis);
        return analysis;
    }
    
    findMatchingIngredient(detectedName) {
        const searchTerm = detectedName.toLowerCase().trim();
        
        // Direct name match
        let match = this.ingredients.find(ing => 
            ing.name.toLowerCase() === searchTerm
        );
        
        if (match) return match;
        
        // Alternative names match
        match = this.ingredients.find(ing => 
            ing.alternative_names && ing.alternative_names.some(alt => 
                alt.toLowerCase() === searchTerm
            )
        );
        
        if (match) return match;
        
        // Partial name match
        match = this.ingredients.find(ing => 
            ing.name.toLowerCase().includes(searchTerm) || 
            searchTerm.includes(ing.name.toLowerCase())
        );
        
        if (match) return match;
        
        // E-number match
        if (searchTerm.match(/^e\\d{3,4}$/)) {
            match = this.ingredients.find(ing => 
                ing.e_number && ing.e_number.toLowerCase() === searchTerm
            );
        }
        
        return match;
    }
    
    calculateRiskScore(matchedIngredients) {
        if (matchedIngredients.length === 0) return 0;
        
        let totalRisk = 0;
        let count = 0;
        
        for (const match of matchedIngredients) {
            const ingredient = match.ingredient;
            const riskWeight = this.riskWeights[ingredient.risk_level] || 5;
            totalRisk += riskWeight;
            count++;
        }
        
        // Calculate weighted average and scale to 0-100
        const averageRisk = totalRisk / count;
        return Math.min(100, Math.round(averageRisk * 10));
    }
    
    calculateAnimalHealthScore(matchedIngredients) {
        let score = 100;
        
        for (const match of matchedIngredients) {
            const ingredient = match.ingredient;
            const impact = ingredient.health_impact_animal?.toLowerCase() || '';
            
            if (impact.includes('tóxico') || impact.includes('peligroso')) {
                score -= 30;
            } else if (impact.includes('moderado') || impact.includes('precaución')) {
                score -= 15;
            } else if (impact.includes('seguro') || impact.includes('beneficioso')) {
                // No penalty for safe ingredients
            } else {
                score -= 5; // Unknown impact
            }
        }
        
        return Math.max(0, score);
    }
    
    detectProductCategory(text) {
        const categories = {
            'alimento': ['ingredientes', 'alimento', 'comida', 'nutritiva', 'calorias'],
            'bebida': ['bebida', 'liquido', 'refresco', 'jugo', 'agua'],
            'cosmético': ['cosmético', 'crema', 'loción', 'shampoo', 'maquillaje'],
            'medicamento': ['medicamento', 'medicina', 'farmaco', 'comprimido'],
            'suplemento': ['suplemento', 'vitamina', 'mineral', 'nutricional']
        };
        
        const textLower = text.toLowerCase();
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                return category;
            }
        }
        
        return 'otro';
    }
    
    generateRecommendations(analysis) {
        const recommendations = [];
        
        // High risk ingredients warning
        if (analysis.harmfulIngredients.length > 0) {
            recommendations.push({
                type: 'warning',
                title: 'Ingredientes Perjudiciales Detectados',
                message: `Se encontraron ${analysis.harmfulIngredients.length} ingredientes con riesgo alto o peligroso.`,
                ingredients: analysis.harmfulIngredients.map(ing => ing.name)
            });
        }
        
        // Overall health score assessment
        if (analysis.healthScoreHuman < 60) {
            recommendations.push({
                type: 'danger',
                title: 'Producto No Recomendado',
                message: 'Este producto contiene múltiples ingredientes perjudiciales para la salud humana.'
            });
        } else if (analysis.healthScoreHuman < 80) {
            recommendations.push({
                type: 'warning',
                title: 'Consumo con Moderación',
                message: 'Este producto debe consumirse con moderación debido a algunos ingredientes de riesgo.'
            });
        } else {
            recommendations.push({
                type: 'success',
                title: 'Producto Relativamente Seguro',
                message: 'La mayoría de ingredientes son seguros para el consumo humano.'
            });
        }
        
        // Animal safety warning
        if (analysis.healthScoreAnimal < 70) {
            recommendations.push({
                type: 'danger',
                title: '⚠️ NO APTO PARA MASCOTAS',
                message: 'Este producto contiene ingredientes tóxicos para animales. Mantener fuera del alcance de mascotas.'
            });
        }
        
        // Specific ingredient warnings
        const dangerousForPets = analysis.harmfulIngredients.filter(ing => 
            ing.health_impact_animal && ing.health_impact_animal.includes('tóxico')
        );
        
        if (dangerousForPets.length > 0) {
            recommendations.push({
                type: 'danger',
                title: 'Tóxico para Mascotas',
                message: `Ingredientes especialmente peligrosos para animales: ${dangerousForPets.map(ing => ing.name).join(', ')}`
            });
        }
        
        // Unknown ingredients notice
        if (analysis.unknownIngredients.length > 0) {
            recommendations.push({
                type: 'info',
                title: 'Ingredientes No Identificados',
                message: `${analysis.unknownIngredients.length} ingredientes no se pudieron identificar en nuestra base de datos.`
            });
        }
        
        return recommendations;
    }
    
    async saveAnalysis(analysis, imageData) {
        try {
            const analysisData = {
                product_name: 'Producto Escaneado',
                category: analysis.productCategory || 'otro',
                ingredients_text: analysis.fullText,
                ingredients_detected: analysis.detectedIngredients,
                risk_score: analysis.riskScore,
                health_score_human: analysis.healthScoreHuman,
                health_score_animal: analysis.healthScoreAnimal,
                harmful_ingredients: analysis.harmfulIngredients.map(ing => ing.name),
                beneficial_ingredients: analysis.beneficialIngredients.map(ing => ing.name),
                recommendations: JSON.stringify(analysis.recommendations),
                analysis_date: Date.now(),
                image_data: imageData.substring(0, 1000) // Truncate for storage
            };
            
            const response = await fetch('tables/product_analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(analysisData)
            });
            
            const result = await response.json();
            console.log('Analysis saved with ID:', result.id);
            
            // Also save to user history
            await this.saveToHistory(result.id, analysisData);
            
            return result.id;
            
        } catch (error) {
            console.error('Error saving analysis:', error);
            return null;
        }
    }
    
    async saveToHistory(analysisId, analysisData) {
        try {
            const historyData = {
                session_id: this.getSessionId(),
                analysis_id: analysisId,
                product_name: analysisData.product_name,
                risk_score: analysisData.risk_score,
                date: Date.now(),
                favorites: false,
                notes: ''
            };
            
            await fetch('tables/user_history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(historyData)
            });
            
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    }
    
    getSessionId() {
        let sessionId = localStorage.getItem('healthscan_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
            localStorage.setItem('healthscan_session_id', sessionId);
        }
        return sessionId;
    }
    
    displayResults(analysis) {
        const resultContent = document.getElementById('result-content');
        if (!resultContent) return;
        
        resultContent.innerHTML = this.generateResultsHTML(analysis);
        document.getElementById('result-modal').classList.add('active');
    }
    
    generateResultsHTML(analysis) {
        const getScoreColor = (score) => {
            if (score >= 80) return '#4CAF50';
            if (score >= 60) return '#FF9800';
            return '#f44336';
        };
        
        const getRecommendationIcon = (type) => {
            const icons = {
                success: 'fa-check-circle',
                warning: 'fa-exclamation-triangle',
                danger: 'fa-times-circle',
                info: 'fa-info-circle'
            };
            return icons[type] || 'fa-info-circle';
        };
        
        return `
            <div class="analysis-card">
                <div class="product-info">
                    <h2 class="product-name">Análisis de Ingredientes</h2>
                    <p>Producto escaneado • ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="score-container">
                    <div class="score-item">
                        <div class="score-value" style="color: ${getScoreColor(analysis.healthScoreHuman)}">
                            ${analysis.healthScoreHuman}
                        </div>
                        <div class="score-label">Salud Humana</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value" style="color: ${getScoreColor(analysis.healthScoreAnimal)}">
                            ${analysis.healthScoreAnimal}
                        </div>
                        <div class="score-label">Salud Animal</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value" style="color: ${getScoreColor(100 - analysis.riskScore)}">
                            ${analysis.riskScore}
                        </div>
                        <div class="score-label">Riesgo</div>
                    </div>
                </div>
                
                ${analysis.recommendations.map(rec => `
                    <div class="recommendation ${rec.type}" style="margin: 15px 0; padding: 15px; border-radius: 8px; background: ${rec.type === 'danger' ? '#ffebee' : rec.type === 'warning' ? '#fff3e0' : rec.type === 'success' ? '#e8f5e8' : '#e3f2fd'};">
                        <h4><i class="fas ${getRecommendationIcon(rec.type)}"></i> ${rec.title}</h4>
                        <p>${rec.message}</p>
                    </div>
                `).join('')}
                
                <div class="ingredients-section">
                    <h4><i class="fas fa-times-circle" style="color: #f44336;"></i> Ingredientes Perjudiciales (${analysis.harmfulIngredients.length})</h4>
                    <div class="ingredient-tags">
                        ${analysis.harmfulIngredients.map(ing => 
                            `<span class="ingredient-tag tag-harmful">${ing.name}</span>`
                        ).join('')}
                        ${analysis.harmfulIngredients.length === 0 ? '<span class="ingredient-tag tag-neutral">Ninguno detectado</span>' : ''}
                    </div>
                </div>
                
                <div class="ingredients-section">
                    <h4><i class="fas fa-check-circle" style="color: #4CAF50;"></i> Ingredientes Beneficiosos (${analysis.beneficialIngredients.length})</h4>
                    <div class="ingredient-tags">
                        ${analysis.beneficialIngredients.map(ing => 
                            `<span class="ingredient-tag tag-beneficial">${ing.name}</span>`
                        ).join('')}
                        ${analysis.beneficialIngredients.length === 0 ? '<span class="ingredient-tag tag-neutral">Ninguno detectado</span>' : ''}
                    </div>
                </div>
                
                <div class="ingredients-section">
                    <h4><i class="fas fa-question-circle" style="color: #666;"></i> Ingredientes Detectados (${analysis.detectedIngredients.length})</h4>
                    <div class="ingredient-tags">
                        ${analysis.detectedIngredients.map(ing => 
                            `<span class="ingredient-tag tag-neutral">${ing}</span>`
                        ).join('')}
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="document.getElementById('result-modal').classList.remove('active')" style="margin-top: 20px; width: 100%;">
                    <i class="fas fa-check"></i> Cerrar
                </button>
            </div>
        `;
    }
    
    showError(message) {
        alert(message); // Replace with better error handling in production
    }
}

// Initialize analysis manager
document.addEventListener('DOMContentLoaded', () => {
    window.analysisManager = new AnalysisManager();
    console.log('Analysis manager initialized');
});
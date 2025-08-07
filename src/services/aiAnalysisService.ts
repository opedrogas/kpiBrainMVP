import { supabase } from '../lib/supabase';

export interface ClinicianAnalysisData {
  clinicianId: string;
  clinicianName: string;
  position: string;
  department: string;
  currentScore: number;
  performanceHistory: Array<{
    month: string;
    year: number;
    score: number;
  }>;
  kpiPerformance: Array<{
    kpiTitle: string;
    percentage: number;
    weight: number;
    met: number;
    total: number;
  }>;
  reviewCount: number;
  startDate: string;
}

export interface AIAnalysisResult {
  overallPerformance: {
    grade: 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement' | 'Poor';
    summary: string;
    trendAnalysis: string;
  };
  strengths: string[];
  weaknesses: string[];
  topPerformingKPIs: Array<{
    kpi: string;
    performance: number;
    impact: string;
  }>;
  underperformingKPIs: Array<{
    kpi: string;
    performance: number;
    recommendation: string;
  }>;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  riskAssessment: {
    level: 'Low' | 'Medium' | 'High';
    factors: string[];
    mitigationStrategies: string[];
  };
  comparisonMetrics: {
    vsTeamAverage: number;
    percentile: number;
    consistency: 'High' | 'Medium' | 'Low';
  };
  generatedAt: string;
  analysisId: string;
}

class AIAnalysisService {
  private readonly API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  
  private async callAI(prompt: string): Promise<string> {
    try {
      // For now, we'll simulate AI analysis
      // In production, you would integrate with OpenAI API or your preferred AI service
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return simulated AI response based on the data
      return this.generateSimulatedAnalysis(prompt);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to generate AI analysis. Please try again.');
    }
  }

  private generateSimulatedAnalysis(prompt: string): string {
    // This is a placeholder for actual AI integration
    // Parse the prompt to extract data and generate realistic analysis
    const analysisTemplates = {
      excellent: "demonstrates exceptional performance with consistent high scores",
      good: "shows strong performance with room for minor improvements",
      satisfactory: "meets expectations with some areas for development", 
      needsImprovement: "requires focused attention on key performance areas",
      poor: "needs immediate intervention and structured improvement plan"
    };
    
    return JSON.stringify({
      performance: "good",
      analysis: "This clinician shows strong overall performance with consistent improvement trends.",
      strengths: ["High consistency in core KPIs", "Strong trend improvement", "Excellent patient interaction metrics"],
      weaknesses: ["Documentation timeliness", "Administrative task completion"],
      recommendations: ["Focus on documentation efficiency training", "Implement time management strategies"]
    });
  }

  async analyzeClinicianPerformance(data: ClinicianAnalysisData): Promise<AIAnalysisResult> {
    try {
      // Create comprehensive analysis prompt
      const prompt = this.buildAnalysisPrompt(data);
      
      // Get AI analysis
      const aiResponse = await this.callAI(prompt);
      
      // Parse and structure the response
      const analysis = this.parseAIResponse(aiResponse, data);
      
      // Store analysis in database for future reference
      await this.storeAnalysis(data.clinicianId, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing clinician performance:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(data: ClinicianAnalysisData): string {
    const recentPerformance = data.performanceHistory.slice(-6); // Last 6 months
    const avgScore = recentPerformance.reduce((sum, p) => sum + p.score, 0) / recentPerformance.length;
    
    return `
      Analyze the performance of clinician ${data.clinicianName} in the ${data.department} department.
      
      Current Performance:
      - Current Score: ${data.currentScore}%
      - 6-Month Average: ${avgScore.toFixed(1)}%
      - Position: ${data.position}
      - Total Reviews: ${data.reviewCount}
      
      Historical Performance (Last 12 months):
      ${data.performanceHistory.map(p => `${p.month} ${p.year}: ${p.score}%`).join('\n')}
      
      KPI Breakdown:
      ${data.kpiPerformance.map(kpi => 
        `${kpi.kpiTitle}: ${kpi.percentage}% (${kpi.met}/${kpi.total}) - Weight: ${kpi.weight}`
      ).join('\n')}
      
      Please provide:
      1. Overall performance assessment
      2. Key strengths and areas for improvement
      3. Specific recommendations for growth
      4. Risk assessment and mitigation strategies
      5. Comparison insights
    `;
  }

  private parseAIResponse(aiResponse: string, data: ClinicianAnalysisData): AIAnalysisResult {
    // In a real implementation, this would parse the actual AI response
    // For now, we'll generate a realistic analysis based on the data
    
    const currentScore = data.currentScore;
    const avgScore = data.performanceHistory.reduce((sum, p) => sum + p.score, 0) / data.performanceHistory.length;
    const trend = this.calculateTrend(data.performanceHistory);
    
    let grade: AIAnalysisResult['overallPerformance']['grade'];
    if (currentScore >= 90) grade = 'Excellent';
    else if (currentScore >= 80) grade = 'Good';
    else if (currentScore >= 70) grade = 'Satisfactory';
    else if (currentScore >= 60) grade = 'Needs Improvement';
    else grade = 'Poor';

    // Identify top and underperforming KPIs
    const sortedKPIs = [...data.kpiPerformance].sort((a, b) => b.percentage - a.percentage);
    const topKPIs = sortedKPIs.slice(0, 3).filter(kpi => kpi.percentage >= 80);
    const underperformingKPIs = sortedKPIs.slice(-3).filter(kpi => kpi.percentage < 70);

    return {
      overallPerformance: {
        grade,
        summary: this.generatePerformanceSummary(data, grade, avgScore),
        trendAnalysis: this.generateTrendAnalysis(trend, data.performanceHistory)
      },
      strengths: this.generateStrengths(data, topKPIs),
      weaknesses: this.generateWeaknesses(data, underperformingKPIs),
      topPerformingKPIs: topKPIs.map(kpi => ({
        kpi: kpi.kpiTitle,
        performance: kpi.percentage,
        impact: this.generateKPIImpact(kpi, true)
      })),
      underperformingKPIs: underperformingKPIs.map(kpi => ({
        kpi: kpi.kpiTitle,
        performance: kpi.percentage,
        recommendation: this.generateKPIRecommendation(kpi)
      })),
      recommendations: this.generateRecommendations(data, grade, underperformingKPIs),
      riskAssessment: this.generateRiskAssessment(data, currentScore, trend),
      comparisonMetrics: {
        vsTeamAverage: this.calculateVsTeamAverage(currentScore),
        percentile: this.calculatePercentile(currentScore),
        consistency: this.calculateConsistency(data.performanceHistory)
      },
      generatedAt: new Date().toISOString(),
      analysisId: `analysis_${data.clinicianId}_${Date.now()}`
    };
  }

  private calculateTrend(history: Array<{ score: number }>): 'improving' | 'stable' | 'declining' {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-3);
    const earlier = history.slice(-6, -3);
    
    if (recent.length === 0 || earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, p) => sum + p.score, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, p) => sum + p.score, 0) / earlier.length;
    
    const diff = recentAvg - earlierAvg;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  private generatePerformanceSummary(data: ClinicianAnalysisData, grade: string, avgScore: number): string {
    const templates = {
      'Excellent': `${data.clinicianName} demonstrates exceptional performance with a current score of ${data.currentScore}% and 6-month average of ${avgScore.toFixed(1)}%. Consistently exceeds expectations across most KPIs.`,
      'Good': `${data.clinicianName} shows strong performance with a current score of ${data.currentScore}%. Performance is reliable with room for targeted improvements in specific areas.`,
      'Satisfactory': `${data.clinicianName} meets performance expectations with a ${data.currentScore}% current score. Shows potential for growth with focused development initiatives.`,
      'Needs Improvement': `${data.clinicianName} requires focused attention to improve from the current ${data.currentScore}% score. Several key areas need structured improvement plans.`,
      'Poor': `${data.clinicianName} needs immediate intervention with a current score of ${data.currentScore}%. Comprehensive performance improvement plan recommended.`
    };
    
    return templates[grade] || templates['Satisfactory'];
  }

  private generateTrendAnalysis(trend: string, history: Array<{ month: string; year: number; score: number }>): string {
    const trendTemplates = {
      'improving': 'Shows positive upward trajectory with consistent month-over-month improvements. This suggests effective learning and adaptation to feedback.',
      'stable': 'Maintains consistent performance levels with minimal variation. Indicates reliable execution but may benefit from growth challenges.',
      'declining': 'Recent performance shows downward trend requiring immediate attention. May indicate burnout, external factors, or need for additional support.'
    };
    
    const variance = this.calculateVariance(history.map(h => h.score));
    const consistencyNote = variance < 100 ? 'Performance is highly consistent.' : 
                           variance < 200 ? 'Performance shows moderate consistency.' : 
                           'Performance shows high variability requiring investigation.';
    
    return `${trendTemplates[trend]} ${consistencyNote}`;
  }

  private calculateVariance(scores: number[]): number {
    if (scores.length === 0) return 0;
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
  }

  private generateStrengths(data: ClinicianAnalysisData, topKPIs: Array<{ kpiTitle: string; percentage: number }>): string[] {
    const strengths = [];
    
    if (data.currentScore >= 85) {
      strengths.push("Consistently high overall performance scores");
    }
    
    if (topKPIs.length > 0) {
      strengths.push(`Excels in key areas: ${topKPIs.map(kpi => kpi.kpiTitle).join(', ')}`);
    }
    
    const consistency = this.calculateConsistency(data.performanceHistory);
    if (consistency === 'High') {
      strengths.push("Demonstrates high performance consistency and reliability");
    }
    
    if (data.reviewCount > 20) {
      strengths.push("Strong engagement with regular performance reviews");
    }
    
    return strengths.length > 0 ? strengths : ["Shows commitment to role responsibilities"];
  }

  private generateWeaknesses(data: ClinicianAnalysisData, underperformingKPIs: Array<{ kpiTitle: string; percentage: number }>): string[] {
    const weaknesses = [];
    
    if (underperformingKPIs.length > 0) {
      weaknesses.push(`Needs improvement in: ${underperformingKPIs.map(kpi => kpi.kpiTitle).join(', ')}`);
    }
    
    if (data.currentScore < 70) {
      weaknesses.push("Overall performance below target threshold");
    }
    
    const consistency = this.calculateConsistency(data.performanceHistory);
    if (consistency === 'Low') {
      weaknesses.push("Performance inconsistency affecting reliability");
    }
    
    return weaknesses.length > 0 ? weaknesses : ["Minor areas for continuous improvement"];
  }

  private calculateConsistency(history: Array<{ score: number }>): 'High' | 'Medium' | 'Low' {
    if (history.length < 3) return 'Medium';
    
    const variance = this.calculateVariance(history.map(h => h.score));
    
    if (variance < 50) return 'High';
    if (variance < 150) return 'Medium';
    return 'Low';
  }

  private generateKPIImpact(kpi: { kpiTitle: string; percentage: number; weight: number }, isTop: boolean): string {
    const impactLevel = kpi.weight > 15 ? 'High' : kpi.weight > 10 ? 'Medium' : 'Low';
    return `${impactLevel} impact KPI with strong performance contributing significantly to overall score`;
  }

  private generateKPIRecommendation(kpi: { kpiTitle: string; percentage: number; weight: number }): string {
    if (kpi.weight > 15) {
      return `High-priority improvement area. Consider focused training and mentoring for ${kpi.kpiTitle}`;
    }
    return `Implement targeted improvement strategies and regular monitoring for ${kpi.kpiTitle}`;
  }

  private generateRecommendations(
    data: ClinicianAnalysisData, 
    grade: string, 
    underperformingKPIs: Array<{ kpiTitle: string }>
  ): AIAnalysisResult['recommendations'] {
    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    };

    // Immediate recommendations
    if (underperformingKPIs.length > 0) {
      recommendations.immediate.push(`Address underperforming KPIs: ${underperformingKPIs.map(k => k.kpiTitle).join(', ')}`);
    }
    
    if (data.currentScore < 70) {
      recommendations.immediate.push("Schedule performance review meeting with supervisor");
      recommendations.immediate.push("Develop structured improvement action plan");
    }

    // Short-term recommendations
    recommendations.shortTerm.push("Implement monthly progress check-ins");
    recommendations.shortTerm.push("Identify and utilize available training resources");
    
    if (grade === 'Excellent' || grade === 'Good') {
      recommendations.shortTerm.push("Consider mentoring opportunities for junior staff");
    }

    // Long-term recommendations
    recommendations.longTerm.push("Set career development goals aligned with strengths");
    recommendations.longTerm.push("Explore leadership or specialization opportunities");
    
    if (underperformingKPIs.length === 0 && data.currentScore >= 85) {
      recommendations.longTerm.push("Consider advanced training or certification programs");
    }

    return recommendations;
  }

  private generateRiskAssessment(
    data: ClinicianAnalysisData, 
    currentScore: number, 
    trend: string
  ): AIAnalysisResult['riskAssessment'] {
    let level: 'Low' | 'Medium' | 'High';
    const factors: string[] = [];
    const mitigationStrategies: string[] = [];

    // Determine risk level
    if (currentScore >= 80 && trend !== 'declining') {
      level = 'Low';
    } else if (currentScore >= 65 && trend !== 'declining') {
      level = 'Medium';
    } else {
      level = 'High';
    }

    // Risk factors
    if (currentScore < 70) {
      factors.push("Below-target performance scores");
    }
    if (trend === 'declining') {
      factors.push("Declining performance trend");
    }
    if (this.calculateConsistency(data.performanceHistory) === 'Low') {
      factors.push("High performance variability");
    }

    // Mitigation strategies
    mitigationStrategies.push("Regular performance monitoring and feedback");
    mitigationStrategies.push("Targeted skill development programs");
    
    if (level === 'High') {
      mitigationStrategies.push("Intensive support and mentoring program");
      mitigationStrategies.push("Weekly progress reviews");
    }

    return { level, factors, mitigationStrategies };
  }

  private calculateVsTeamAverage(score: number): number {
    // Simulated team average - in production, this would be calculated from actual team data
    const simulatedTeamAverage = 78;
    return Math.round((score - simulatedTeamAverage) * 10) / 10;
  }

  private calculatePercentile(score: number): number {
    // Simplified percentile calculation - in production, this would use actual distribution
    if (score >= 95) return 95;
    if (score >= 90) return 85;
    if (score >= 85) return 75;
    if (score >= 80) return 65;
    if (score >= 75) return 50;
    if (score >= 70) return 35;
    if (score >= 65) return 25;
    return 15;
  }

  private async storeAnalysis(clinicianId: string, analysis: AIAnalysisResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_analyses')
        .insert({
          clinician_id: clinicianId,
          analysis_id: analysis.analysisId,
          analysis_data: analysis,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing analysis:', error);
      }
    } catch (error) {
      console.error('Error storing analysis:', error);
    }
  }

  async getAnalysisHistory(clinicianId: string): Promise<AIAnalysisResult[]> {
    try {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('clinician_id', clinicianId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data?.map(row => row.analysis_data) || [];
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();
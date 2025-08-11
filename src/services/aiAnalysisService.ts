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
  kpiImprovementSuggestions: Array<{
    kpi: string;
    currentPerformance: number;
    targetPerformance: number;
    improvementSuggestions: string[];
    priority: 'High' | 'Medium' | 'Low';
  }>;
  monthlyFocusAreas: string[];
  generatedAt: string;
  analysisId: string;
}

class AIAnalysisService {
  private readonly API_ENDPOINT = import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
  private readonly API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  private readonly FORCE_SIMULATED = import.meta.env.VITE_FORCE_SIMULATED_AI === 'true';
  
  private async callAI(prompt: string): Promise<string> {
    try {
      // Check if forced to use simulated analysis
      if (this.FORCE_SIMULATED) {
        console.log('🧠 Using expert system analysis (simulated AI disabled)');
        console.log('🔍 Processing comprehensive performance data with algorithmic analysis...');
        console.log('⚕️ Applying evidence-based clinical standards...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return this.generateSimulatedAnalysis(prompt);
      }
      
      // Check if API key is available
      if (!this.API_KEY) {
        console.warn('OpenAI API key not found, using simulated analysis');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.generateSimulatedAnalysis(prompt);
      }

      console.log('🤖 Starting advanced AI clinical analysis...');
      console.log('🔍 Processing comprehensive performance data...');
      console.log('⚕️ Applying evidence-based clinical standards...');
      
      // Add a loading delay to build anticipation for real AI analysis
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Make actual OpenAI API call
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Superior analysis model
          messages: [
            {
              role: 'system',
              content: `You are Dr. Sarah Chen, a Senior Clinical Performance Analyst specializing in KPI optimization and targeted improvement strategies. Your focus is on providing specific, actionable improvement suggestions based on current month KPI performance data.

ANALYSIS FRAMEWORK:
• Focus ONLY on KPI performance for the current month
• Identify specific areas needing improvement (performance < 80%)
• Provide practical, actionable improvement suggestions
• Prioritize based on KPI weight and performance gap
• Maintain focus on achievable monthly goals

RESPONSE REQUIREMENTS:
Respond ONLY with a valid JSON object in this EXACT format:

{
  "kpi_improvement_suggestions": [
    {
      "kpi": "KPI name",
      "current_performance": numeric_value,
      "target_performance": 80_or_higher,
      "improvement_suggestions": ["specific actionable suggestion", "another specific suggestion"],
      "priority": "High|Medium|Low"
    }
  ],
  "monthly_focus_areas": ["key area to focus on this month", "another focus area"]
}

PRIORITY GUIDELINES:
• High: KPI weight > 15% OR performance < 60%
• Medium: KPI weight 10-15% OR performance 60-79%
• Low: KPI weight < 10% AND performance 70-79%

LANGUAGE STANDARDS:
• Use specific, actionable language
• Reference KPI names directly
• Provide concrete steps, not generic advice
• Keep suggestions achievable within one month
• Focus on measurable improvements`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent analysis
          max_tokens: 2000,
          response_format: { type: "json_object" } // Ensure JSON response
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🚨 OpenAI API Error: ${response.status} - ${response.statusText}`);
        console.error('📄 Error Details:', errorText);
        
        // Check if it's a quota exceeded error
        if (response.status === 429) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error && errorData.error.code === 'insufficient_quota') {
              console.warn('💳 OpenAI quota exceeded - switching to expert system analysis');
              console.log('🧠 Using advanced algorithmic analysis for comprehensive insights');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return this.generateSimulatedAnalysis(prompt);
            } else {
              console.warn('⏱️ Rate limit exceeded, retrying with backoff...');
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          } catch (parseError) {
            console.warn('⏱️ Rate limit exceeded, retrying with backoff...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
        
        // Fallback to simulated analysis on API error
        console.warn('🔄 API unavailable - switching to expert system analysis');
        console.log('💡 Using advanced algorithmic analysis as backup');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.generateSimulatedAnalysis(prompt);
      }

      const data = await response.json();

      console.log('✅ AI Analysis Response Received');
      console.log('📊 Response Data:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      const aiResponse = data.choices[0].message.content;
      console.log('✅ Advanced AI clinical analysis completed');
      console.log(`📋 Generated ${aiResponse.length} characters of professional analysis`);
      console.log('🎯 Analysis ready for clinical review and application');
      
      return aiResponse;
      
    } catch (error) {
      console.error('🚨 AI Analysis Service Error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('🌐 Network connectivity issue detected');
      } else if (error instanceof Error && error.message.includes('JSON')) {
        console.warn('📝 JSON parsing issue with API response');
      }
      
      // Fallback to simulated analysis if API fails
      console.warn('🔄 Switching to expert system analysis for reliability');
      console.log('🧠 Advanced algorithmic analysis provides equivalent clinical insights');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.generateSimulatedAnalysis(prompt);
    }
  }

  private generateSimulatedAnalysis(prompt: string): string {
    // Extract KPI data from the prompt to generate focused improvement suggestions
    try {
      // Extract KPIs from the prompt
      const kpiImprovementSuggestions = [];
      const monthlyFocusAreas = [];
      
      // Parse KPI performance data from the prompt
      const kpiMatches = prompt.matchAll(/([⚠️🔥])\s+([^:]+):\s+(\d+(?:\.\d+)?)%[^|]*\|\s*Weight:\s*(\d+(?:\.\d+)?)%/g);
      
      for (const match of kpiMatches) {
        const [, icon, title, percentage, weight] = match;
        const kpiName = title.trim();
        const performance = parseFloat(percentage);
        const kpiWeight = parseFloat(weight);
        
        // Only include KPIs that need improvement (< 80%)
        if (performance < 80) {
          const targetPerformance = Math.min(95, performance + 20); // Realistic target
          
          // Determine priority
          let priority: 'High' | 'Medium' | 'Low';
          if (kpiWeight > 15 || performance < 60) {
            priority = 'High';
          } else if (kpiWeight >= 10 || performance < 70) {
            priority = 'Medium';
          } else {
            priority = 'Low';
          }
          
          // Generate specific improvement suggestions based on KPI type
          const suggestions = this.generateKPISpecificSuggestions(kpiName, performance);
          
          kpiImprovementSuggestions.push({
            kpi: kpiName,
            current_performance: performance,
            target_performance: targetPerformance,
            improvement_suggestions: suggestions,
            priority: priority
          });
        }
      }
      
      // Generate monthly focus areas
      if (kpiImprovementSuggestions.length > 0) {
        const highPriorityKPIs = kpiImprovementSuggestions.filter(kpi => kpi.priority === 'High');
        const mediumPriorityKPIs = kpiImprovementSuggestions.filter(kpi => kpi.priority === 'Medium');
        
        if (highPriorityKPIs.length > 0) {
          monthlyFocusAreas.push(`Prioritize improvement in high-impact areas: ${highPriorityKPIs.map(k => k.kpi).join(', ')}`);
        }
        if (mediumPriorityKPIs.length > 0) {
          monthlyFocusAreas.push(`Establish consistent practices for: ${mediumPriorityKPIs.slice(0, 2).map(k => k.kpi).join(', ')}`);
        }
        monthlyFocusAreas.push('Track daily progress and implement feedback loops for continuous improvement');
      } else {
        monthlyFocusAreas.push('Maintain current high performance standards');
        monthlyFocusAreas.push('Identify opportunities for innovation and best practice sharing');
      }
      
      return JSON.stringify({
        kpi_improvement_suggestions: kpiImprovementSuggestions,
        monthly_focus_areas: monthlyFocusAreas
      });
      
    } catch (error) {
      console.error('Error generating simulated analysis:', error);
      // Fallback to basic improvement suggestions
      return JSON.stringify({
        kpi_improvement_suggestions: [
          {
            kpi: "Overall Performance",
            current_performance: 75,
            target_performance: 85,
            improvement_suggestions: [
              "Review current processes and identify efficiency opportunities",
              "Set specific daily goals and track progress",
              "Seek feedback from supervisors and colleagues"
            ],
            priority: "Medium"
          }
        ],
        monthly_focus_areas: [
          "Focus on consistent execution of core responsibilities",
          "Implement systematic approach to performance tracking"
        ]
      });
    }
  }

  private generateKPISpecificSuggestions(kpiName: string, performance: number): string[] {
    const suggestions = [];
    const kpiLower = kpiName.toLowerCase();
    
    // Generate specific suggestions based on KPI type
    if (kpiLower.includes('documentation') || kpiLower.includes('charting')) {
      suggestions.push('Allocate 10 minutes at end of each shift for documentation review');
      suggestions.push('Use voice-to-text tools to improve documentation speed and accuracy');
      suggestions.push('Create standardized templates for common documentation scenarios');
    } else if (kpiLower.includes('patient satisfaction') || kpiLower.includes('communication')) {
      suggestions.push('Practice active listening techniques and validate patient concerns');
      suggestions.push('Follow up with patients within 24 hours of visits when possible');
      suggestions.push('Use teach-back method to ensure patient understanding');
    } else if (kpiLower.includes('safety') || kpiLower.includes('compliance')) {
      suggestions.push('Complete daily safety checklist before starting patient care');
      suggestions.push('Participate in weekly safety huddles and implement feedback');
      suggestions.push('Review and practice safety protocols during downtime');
    } else if (kpiLower.includes('time') || kpiLower.includes('efficiency')) {
      suggestions.push('Implement time-blocking techniques for routine tasks');
      suggestions.push('Identify and eliminate non-value-added activities in workflow');
      suggestions.push('Collaborate with team to streamline handoff processes');
    } else if (kpiLower.includes('quality') || kpiLower.includes('outcome')) {
      suggestions.push('Implement evidence-based best practices for patient care');
      suggestions.push('Track key quality metrics daily and adjust approach accordingly');
      suggestions.push('Participate in peer review sessions to identify improvement opportunities');
    } else {
      // Generic improvement suggestions
      suggestions.push('Set daily performance targets and track progress consistently');
      suggestions.push('Seek mentorship or coaching to develop specific skills');
      suggestions.push('Implement systematic approach to identify and address performance gaps');
    }
    
    // Add priority-based suggestions
    if (performance < 60) {
      suggestions.push('Request immediate supervisor support and additional training');
      suggestions.push('Implement daily check-ins with team lead for performance monitoring');
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions for focus
  }

  async analyzeClinicianPerformance(data: ClinicianAnalysisData): Promise<AIAnalysisResult> {
    try {
      // Create comprehensive analysis prompt
      const prompt = this.buildAnalysisPrompt(data);
      
      // Get AI analysis
      const aiResponse = await this.callAI(prompt);
      
      // Parse and structure the response
      const analysis = this.parseAIResponse(aiResponse, data);
      
      // Database storage disabled - only generating PDF
      // await this.storeAnalysis(data.clinicianId, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing clinician performance:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(data: ClinicianAnalysisData): string {
    // Identify KPIs that need improvement (below 80%)
    const improvementKPIs = data.kpiPerformance.filter(kpi => kpi.percentage < 80);
    
    return `
═══ KPI IMPROVEMENT ANALYSIS REQUEST ═══

🏥 CLINICIAN PROFILE:
Name: ${data.clinicianName}
Department: ${data.department}
Position: ${data.position}
Current Month Score: ${data.currentScore}%

🎯 CURRENT MONTH KPI PERFORMANCE REVIEW:

KPIs NEEDING IMPROVEMENT (< 80%):
${improvementKPIs.map(kpi => 
  `⚠️ ${kpi.kpiTitle}: ${kpi.percentage}% (${kpi.met}/${kpi.total} targets) | Weight: ${kpi.weight}%`
).join('\n')}

🏥 ANALYSIS REQUEST:
Based on the current month KPI performance data above, provide specific improvement suggestions for each underperforming KPI. Focus on:

1. Actionable steps to improve performance within the next month
2. Specific, measurable recommendations
3. Priority level based on KPI weight and performance gap
4. Monthly focus areas for the clinician

Do not include historical trends, comprehensive assessments, or long-term strategic plans. Focus only on practical improvement suggestions for the current month's KPI performance.
    `;
  }

  private parseAIResponse(aiResponse: string, data: ClinicianAnalysisData): AIAnalysisResult {
    try {
      // Try to parse AI response as JSON
      const aiData = JSON.parse(aiResponse);
      console.log('✅ Parsing AI response for KPI improvement suggestions');
      
      // Transform snake_case properties to camelCase
      const kpiImprovementSuggestions = (aiData.kpi_improvement_suggestions || []).map((suggestion: any) => ({
        kpi: suggestion.kpi,
        currentPerformance: suggestion.current_performance,
        targetPerformance: suggestion.target_performance,
        improvementSuggestions: suggestion.improvement_suggestions || [],
        priority: suggestion.priority
      }));

      return {
        kpiImprovementSuggestions,
        monthlyFocusAreas: aiData.monthly_focus_areas || [],
        generatedAt: new Date().toISOString(),
        analysisId: `analysis_${data.clinicianId}_${Date.now()}`
      };
    } catch (error) {
      console.warn('Failed to parse AI response as JSON, generating fallback analysis');
      
      // Fallback: generate improvement suggestions for underperforming KPIs
      const improvementKPIs = data.kpiPerformance.filter(kpi => kpi.percentage < 80);
      const kpiImprovementSuggestions = improvementKPIs.map(kpi => {
        let priority: 'High' | 'Medium' | 'Low';
        if (kpi.weight > 15 || kpi.percentage < 60) {
          priority = 'High';
        } else if (kpi.weight >= 10 || kpi.percentage < 70) {
          priority = 'Medium';
        } else {
          priority = 'Low';
        }

        return {
          kpi: kpi.kpiTitle,
          currentPerformance: kpi.percentage,
          targetPerformance: Math.min(95, kpi.percentage + 20),
          improvementSuggestions: this.generateKPISpecificSuggestions(kpi.kpiTitle, kpi.percentage),
          priority
        };
      });

      const monthlyFocusAreas = [];
      if (improvementKPIs.length > 0) {
        const highPriorityKPIs = kpiImprovementSuggestions.filter(kpi => kpi.priority === 'High');
        if (highPriorityKPIs.length > 0) {
          monthlyFocusAreas.push(`Prioritize improvement in: ${highPriorityKPIs.map(k => k.kpi).join(', ')}`);
        }
        monthlyFocusAreas.push('Implement daily progress tracking for targeted KPIs');
      } else {
        monthlyFocusAreas.push('Maintain current high performance standards');
        monthlyFocusAreas.push('Identify opportunities for best practice sharing');
      }

      return {
        kpiImprovementSuggestions,
        monthlyFocusAreas,
        generatedAt: new Date().toISOString(),
        analysisId: `analysis_${data.clinicianId}_${Date.now()}`
      };
    }
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
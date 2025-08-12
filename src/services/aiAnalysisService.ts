// Cleaned AI service: keep only the lightweight improvement-plan helper used by MonthlyReview
// Clinician-wide analysis functionality has been removed as requested.

// Types kept for compatibility (e.g., used by PDF utilities)
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
    floor: string;
    description: string;
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

// Lightweight, UI-focused helper that returns a short 2–3 sentence plan
export class AIImprovementService {
  private static readonly API_ENDPOINT = import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
  private static readonly API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  private static readonly FORCE_SIMULATED = import.meta.env.VITE_FORCE_SIMULATED_AI === 'true';

  /**
   * Generate a concise 2–3 sentence improvement plan with specific, actionable steps
   * embedded within the sentences. Falls back to a simulated plan if API is unavailable.
   */
  static async generateImprovementPlan(args: {
    kpiId: string;
    kpiTitle: string;
    weight: number;
    notes: string;
    month: string;
    year: number;
    floor: string;
    description: string;
  }): Promise<string> {
    const { kpiTitle, weight, notes, month, year, floor, description } = args;

    // Build a comprehensive prompt with all available context
    let userPrompt = `KPI: ${kpiTitle} (weight ${weight}%). Month: ${month} ${year}.`;
    
    console.log(`AIImprovementService: Generating plan for KPI "${kpiTitle}" (${description}) with weight ${weight}% and floor ${floor} for ${month} ${year}.`);
    

    if (description) {
      userPrompt += ` Description: "${description}".`;
    }
    
    if (floor) {
      userPrompt += ` Minimum acceptable performance: ${floor}.`;
    }
    
    userPrompt += ` Performance notes: "${notes}". Write a 2–3 sentence improvement plan for the next month, embedding specific, concrete recommendations directly within the sentences.`;

    try {
      if (this.FORCE_SIMULATED || !this.API_KEY) {
        return this.generateSimulatedPlan(kpiTitle, notes, floor, description);
      }

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a concise performance coach. Respond with 2–3 sentences. Include clear, actionable improvements inside the sentences. Keep it professional and practical.' },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4,
          max_tokens: 220
        })
      });

      if (!response.ok) {
        const errTxt = await response.text();
        console.warn('OpenAI error; falling back to simulated plan:', errTxt);
        return this.generateSimulatedPlan(kpiTitle, notes, floor, description);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content?.trim();
      return content || this.generateSimulatedPlan(kpiTitle, notes, floor, description);
    } catch (e) {
      console.error('AIImprovementService failure:', e);
      return this.generateSimulatedPlan(kpiTitle, notes, floor, description);
    }
  }

  private static generateSimulatedPlan(kpiTitle: string, notes: string, floor?: string, description?: string): string {
    let base = `For ${kpiTitle}`;
    
    // Add description context if available
    if (description) {
      base += ` (${description})`;
    }
    
    base += `, schedule a weekly review to address issues noted ("${(notes || '').slice(0, 120)}...") and apply 1–2 targeted steps immediately; document progress and barriers daily.`;
    
    let add = ` Partner with the team lead to practice the crucial steps`;
    
    // Include floor/target information if available
    if (floor) {
      add += `, aim to exceed the minimum standard of ${floor}`;
    }
    
    add += `, set a measurable target for the next month, and confirm follow-up in two weeks.`;
    
    return (base + add).trim();
  }
}

// Backward-compatible minimal analysis service used by pages that still import `aiAnalysisService`.
// Generates simple improvement suggestions from current KPI performance without calling external APIs.
export const aiAnalysisService = {
  async analyzeClinicianPerformance(data: ClinicianAnalysisData): Promise<AIAnalysisResult> {
    const underperforming = data.kpiPerformance.filter(k => k.percentage < 80);

    const kpiImprovementSuggestions = underperforming.map(kpi => {
      let priority: 'High' | 'Medium' | 'Low';
      if (kpi.weight > 15 || kpi.percentage < 60) {
        priority = 'High';
      } else if (kpi.weight >= 10 || kpi.percentage < 70) {
        priority = 'Medium';
      } else {
        priority = 'Low';
      }

      // Heuristic suggestions based on keyword matching
      const name = kpi.kpiTitle.toLowerCase();
      const desc = kpi.description?.toLowerCase() || '';
      const floor = kpi.floor || '';
      const sug: string[] = [];
      if (name.includes('documentation') || name.includes('chart') || desc.includes('documentation')) {
        sug.push('Reserve 10 minutes at end of each shift to complete and review documentation.');
        sug.push('Adopt a standard note template for common encounters to improve completeness.');
        sug.push('Use voice dictation to speed up documentation while preserving accuracy.');
      } else if (name.includes('satisfaction') || name.includes('communication') || desc.includes('satisfaction') || desc.includes('communication')) {
        sug.push('Use teach-back at discharge and validate patient concerns during visits.');
        sug.push('Implement a 24-hour follow-up call for at-risk patients this month.');
        sug.push('Practice active listening and summarize next steps before ending each encounter.');
      } else if (name.includes('safety') || name.includes('compliance') || desc.includes('safety') || desc.includes('compliance')) {
        sug.push('Complete a daily safety checklist and review two high-risk protocols each week.');
        sug.push('Join weekly safety huddles and capture one improvement to trial.');
        sug.push('Pair with a senior colleague for one safety walkthrough this week.');
      } else {
        // Use description keywords as a fallback for generic mappings
        if (desc.includes('education') || desc.includes('training')) {
          sug.push('Block 30 minutes twice weekly for targeted training modules and reflection.');
          sug.push('Apply one new technique in practice and capture outcomes with a brief log.');
          sug.push('Schedule a peer review to validate skill uptake and get feedback.');
        } else if (desc.includes('quality') || desc.includes('outcome')) {
          sug.push('Track a single outcome metric daily; review trend every Friday.');
          sug.push('Pilot one evidence-based change and compare pre/post results.');
          sug.push('Share findings in team huddle and gather input for iteration.');
        } else {
          sug.push('Define a clear daily target and track progress at end of each shift.');
          sug.push('Identify one workflow bottleneck and trial a small change for a week.');
          sug.push('Schedule a 15-minute coaching check-in to review progress and blockers.');
        }
      }

      return {
        kpi: kpi.kpiTitle,
        currentPerformance: kpi.percentage,
        targetPerformance: Math.min(95, kpi.percentage + 15),
        improvementSuggestions: sug.slice(0, 3),
        priority
      };
    });

    const monthlyFocusAreas: string[] = [];
    if (kpiImprovementSuggestions.length > 0) {
      const high = kpiImprovementSuggestions.filter(s => s.priority === 'High').map(s => s.kpi);
      if (high.length) monthlyFocusAreas.push(`Prioritize: ${high.join(', ')}`);
      monthlyFocusAreas.push('Track daily progress and review weekly with your lead.');
    } else {
      monthlyFocusAreas.push('Maintain current high performance standards.');
    }

    return {
      kpiImprovementSuggestions,
      monthlyFocusAreas,
      generatedAt: new Date().toISOString(),
      analysisId: `analysis_${data.clinicianId}_${Date.now()}`
    };
  }
};
// Prompt monitoring and optimization utilities
import { estimateTokens, TOKEN_LIMITS } from "./prompts";

interface PromptMetrics {
  promptType: string;
  estimatedTokens: number;
  modelUsed: string;
  tokenEfficiency: number; // percentage of token limit used
  timestamp: Date;
  success: boolean;
  responseTime?: number;
  actualTokensUsed?: number; // if available from API response
}

class PromptMonitor {
  private metrics: PromptMetrics[] = [];
  private maxStoredMetrics = 1000; // Keep last 1000 metrics

  logPromptUsage(
    promptType: string,
    prompt: string,
    model: keyof typeof TOKEN_LIMITS,
    success: boolean,
    responseTime?: number,
    actualTokensUsed?: number
  ): void {
    const estimatedTokens = estimateTokens(prompt);
    const tokenLimit = TOKEN_LIMITS[model].safe_input;
    const tokenEfficiency = (estimatedTokens / tokenLimit) * 100;

    const metric: PromptMetrics = {
      promptType,
      estimatedTokens,
      modelUsed: model,
      tokenEfficiency,
      timestamp: new Date(),
      success,
      responseTime,
      actualTokensUsed,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics);
    }

    // Log warnings for high token usage
    if (tokenEfficiency > 90) {
      console.warn(
        `High token usage detected: ${promptType} using ${tokenEfficiency.toFixed(
          1
        )}% of limit`
      );
    }

    // Log in development mode
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Prompt: ${promptType} | Tokens: ${estimatedTokens} | Efficiency: ${tokenEfficiency.toFixed(
          1
        )}%`
      );
    }
  }

  getMetrics(promptType?: string): PromptMetrics[] {
    if (promptType) {
      return this.metrics.filter((m) => m.promptType === promptType);
    }
    return [...this.metrics];
  }

  getAverageTokenUsage(promptType?: string): number {
    const filteredMetrics = promptType
      ? this.metrics.filter((m) => m.promptType === promptType)
      : this.metrics;

    if (filteredMetrics.length === 0) return 0;

    const totalTokens = filteredMetrics.reduce(
      (sum, m) => sum + m.estimatedTokens,
      0
    );
    return totalTokens / filteredMetrics.length;
  }

  getOptimizationStats(): {
    totalPrompts: number;
    averageEfficiency: number;
    highUsagePrompts: number;
    successRate: number;
    averageResponseTime: number;
  } {
    const total = this.metrics.length;
    if (total === 0) {
      return {
        totalPrompts: 0,
        averageEfficiency: 0,
        highUsagePrompts: 0,
        successRate: 0,
        averageResponseTime: 0,
      };
    }

    const totalEfficiency = this.metrics.reduce(
      (sum, m) => sum + m.tokenEfficiency,
      0
    );
    const highUsageCount = this.metrics.filter(
      (m) => m.tokenEfficiency > 80
    ).length;
    const successCount = this.metrics.filter((m) => m.success).length;
    const responseTimes = this.metrics
      .filter((m) => m.responseTime)
      .map((m) => m.responseTime!);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

    return {
      totalPrompts: total,
      averageEfficiency: totalEfficiency / total,
      highUsagePrompts: highUsageCount,
      successRate: (successCount / total) * 100,
      averageResponseTime: avgResponseTime,
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Global monitor instance
export const promptMonitor = new PromptMonitor();

// Helper function to wrap prompt execution with monitoring
export async function monitoredPromptExecution<T>(
  promptType: string,
  prompt: string,
  model: keyof typeof TOKEN_LIMITS,
  execution: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  let success = false;
  let result: T;

  try {
    result = await execution();
    success = true;
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const responseTime = Date.now() - startTime;
    promptMonitor.logPromptUsage(
      promptType,
      prompt,
      model,
      success,
      responseTime
    );
  }
}

// Token optimization recommendations
export function getOptimizationRecommendations(promptType?: string): string[] {
  const metrics = promptMonitor.getMetrics(promptType);
  const recommendations: string[] = [];

  if (metrics.length === 0) {
    return ["No metrics available for analysis"];
  }

  const avgEfficiency =
    metrics.reduce((sum, m) => sum + m.tokenEfficiency, 0) / metrics.length;
  const highUsageCount = metrics.filter((m) => m.tokenEfficiency > 80).length;
  const successRate =
    (metrics.filter((m) => m.success).length / metrics.length) * 100;

  if (avgEfficiency > 70) {
    recommendations.push(
      "⚠️ High average token usage detected. Consider shortening prompts or using more concise language."
    );
  }

  if (highUsageCount > metrics.length * 0.2) {
    recommendations.push(
      "⚠️ Frequent high token usage. Implement better input truncation or prompt compression."
    );
  }

  if (successRate < 95) {
    recommendations.push(
      "⚠️ Low success rate detected. Review prompt reliability and error handling."
    );
  }

  const avgResponseTime =
    metrics
      .filter((m) => m.responseTime)
      .reduce((sum, m) => sum + m.responseTime!, 0) /
    metrics.filter((m) => m.responseTime).length;

  if (avgResponseTime > 10000) {
    // 10 seconds
    recommendations.push(
      "⚠️ Slow response times detected. Consider using faster models or reducing prompt complexity."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "✅ Prompt performance looks good! No major optimizations needed."
    );
  }

  return recommendations;
}

export default promptMonitor;

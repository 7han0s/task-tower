/**
 * monitoring.js
 * Performance monitoring and error tracking system
 */

import { googleService } from './google-service.js';
import { gameCore } from './game-core.js';

export class Monitoring {
    constructor() {
        this.performanceMetrics = {
            initializationTime: null,
            sheetOperations: [],
            errors: [],
            networkRequests: 0,
            successfulRequests: 0,
            failedRequests: 0
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for sheet operations
        if (gameCore && gameCore.addGameStateListener) {
            gameCore.addGameStateListener((event) => {
                if (event.type === 'sheet_operation') {
                    this.trackSheetOperation(event);
                }
            });
        }

        // Listen for errors
        if (window) {
            window.addEventListener('error', (event) => {
                this.trackError(event);
            });

            // Listen for unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.trackError(event.reason);
            });
        }
    }

    trackSheetOperation(event) {
        const operation = {
            type: event.operation,
            timestamp: new Date().toISOString(),
            duration: event.duration,
            success: event.success
        };

        this.performanceMetrics.sheetOperations.push(operation);

        if (event.success) {
            this.performanceMetrics.successfulRequests++;
        } else {
            this.performanceMetrics.failedRequests++;
        }

        this.performanceMetrics.networkRequests++;
    }

    trackError(error) {
        const errorInfo = {
            message: error.message,
            type: error.type || 'Unknown',
            timestamp: new Date().toISOString(),
            context: error.context || {},
            stack: error.stack
        };

        this.performanceMetrics.errors.push(errorInfo);

        // Log critical errors
        if (error.type === 'AuthError' || error.type === 'NetworkError') {
            console.error('Critical error:', errorInfo);
        }
    }

    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            successRate: this.performanceMetrics.networkRequests > 0 
                ? (this.performanceMetrics.successfulRequests / this.performanceMetrics.networkRequests) * 100
                : 0,
            errorCount: this.performanceMetrics.errors.length,
            lastError: this.performanceMetrics.errors.length > 0 
                ? this.performanceMetrics.errors[this.performanceMetrics.errors.length - 1]
                : null
        };
    }

    async initialize() {
        try {
            const startTime = performance.now();
            
            // Initialize performance tracking
            this.performanceMetrics.initializationTime = performance.now() - startTime;

            // Set up periodic monitoring
            setInterval(() => {
                this.logPerformanceMetrics();
            }, 60000); // Log every minute

            console.log('Monitoring system initialized successfully');
        } catch (error) {
            this.trackError(error);
            throw error;
        }
    }

    logPerformanceMetrics() {
        const metrics = this.getPerformanceMetrics();
        console.log('Performance Metrics:', metrics);

        // If we have Google Sheets integration, save metrics
        if (googleService && googleService.sheets) {
            try {
                const metricsData = [
                    metrics.successRate,
                    metrics.errorCount,
                    metrics.initializationTime,
                    metrics.networkRequests
                ];

                googleService.updateSheetData('Monitoring!A2:E2', [metricsData]);
            } catch (error) {
                this.trackError(error);
            }
        }
    }

    async backupMetrics() {
        try {
            const metrics = this.getPerformanceMetrics();
            const backupData = [
                metrics.timestamp,
                metrics.successRate,
                metrics.errorCount,
                metrics.initializationTime,
                metrics.networkRequests
            ];

            await googleService.updateSheetData('Monitoring Backup!A2:F', [backupData]);
        } catch (error) {
            this.trackError(error);
        }
    }
}

// Export singleton instance
export const monitoring = new Monitoring();

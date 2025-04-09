/**
 * monitoring.js
 * Handles monitoring and alerting for game state and system health
 */

import { gameCore } from './game-core.js';
import { gameSheets } from './game-sheets.js';
import { dataSync } from './data-sync.js';
import { backupSystem } from './backup-system.js';
import { realTime } from './real-time.js';

export class Monitoring {
    constructor() {
        this.monitorInterval = null;
        this.lastCheck = null;
        this.alerts = [];
        this.healthMetrics = {
            game: {
                lastUpdate: null,
                phaseChanges: 0,
                roundChanges: 0
            },
            sheets: {
                lastSync: null,
                syncErrors: 0,
                backupErrors: 0
            },
            network: {
                latency: null,
                connectionErrors: 0,
                lastHeartbeat: null
            }
        };
        this.checkFrequency = 10000; // 10 seconds
        this.lastPhase = null;
        this.lastRound = null;
    }

    async initialize() {
        try {
            // Start monitoring loop
            this.startMonitoring();
            
            // Initial health check
            await this.checkHealth();

            console.log('Monitoring system initialized');
        } catch (error) {
            console.error('Error initializing monitoring system:', error);
            throw error;
        }
    }

    startMonitoring() {
        this.monitorInterval = setInterval(async () => {
            try {
                await this.checkHealth();
            } catch (error) {
                console.error('Error in monitoring loop:', error);
            }
        }, this.checkFrequency);

        // Initial check
        this.checkHealth();
    }

    async checkHealth() {
        try {
            // Update last check time
            this.lastCheck = new Date();

            // Check game state
            await this.checkGameState();

            // Check sheets integration
            await this.checkSheetsHealth();

            // Check network
            await this.checkNetworkHealth();

            // Generate alerts if needed
            this.generateAlerts();

            // Log metrics
            this.logMetrics();
        } catch (error) {
            console.error('Error checking health:', error);
            throw error;
        }
    }

    async checkGameState() {
        try {
            // Get current game state
            const gameState = {
                currentPhase: gameCore.currentPhase,
                currentRound: gameCore.currentRound,
                playerCount: gameCore.currentPlayerCount
            };

            // Update metrics
            this.healthMetrics.game.lastUpdate = new Date();
            if (gameState.currentPhase !== this.lastPhase) {
                this.healthMetrics.game.phaseChanges++;
                this.lastPhase = gameState.currentPhase;
            }
            if (gameState.currentRound !== this.lastRound) {
                this.healthMetrics.game.roundChanges++;
                this.lastRound = gameState.currentRound;
            }
        } catch (error) {
            console.error('Error checking game state:', error);
            throw error;
        }
    }

    async checkSheetsHealth() {
        try {
            // Check last sync time
            const lastSync = await gameSheets.getLastSyncTime();
            this.healthMetrics.sheets.lastSync = lastSync;

            // Check backup status
            const backupStats = await backupSystem.getBackupStats();
            if (backupStats.totalBackups === 0) {
                this.healthMetrics.sheets.backupErrors++;
            }
        } catch (error) {
            console.error('Error checking sheets health:', error);
            this.healthMetrics.sheets.syncErrors++;
            throw error;
        }
    }

    async checkNetworkHealth() {
        try {
            // Check WebSocket connection
            if (realTime.socket && realTime.socket.readyState === WebSocket.OPEN) {
                this.healthMetrics.network.latency = this.calculateLatency();
                this.healthMetrics.network.lastHeartbeat = realTime.lastHeartbeat;
            } else {
                this.healthMetrics.network.connectionErrors++;
            }
        } catch (error) {
            console.error('Error checking network health:', error);
            throw error;
        }
    }

    calculateLatency() {
        const now = new Date();
        return now - realTime.lastHeartbeat;
    }

    async generateAlerts() {
        try {
            // Game alerts
            if (this.healthMetrics.game.phaseChanges > 10) {
                this.addAlert('Frequent phase changes detected');
            }

            // Sheets alerts
            if (this.healthMetrics.sheets.syncErrors > 0) {
                this.addAlert('Google Sheets sync errors detected');
            }
            if (this.healthMetrics.sheets.backupErrors > 0) {
                this.addAlert('Backup system errors detected');
            }

            // Network alerts
            if (this.healthMetrics.network.connectionErrors > 0) {
                this.addAlert('Network connection issues detected');
            }
            if (this.healthMetrics.network.latency > 1000) {
                this.addAlert('High network latency detected');
            }
        } catch (error) {
            console.error('Error generating alerts:', error);
            throw error;
        }
    }

    addAlert(message) {
        this.alerts.push({
            timestamp: new Date().toISOString(),
            message: message,
            type: 'warning'
        });
    }

    async logMetrics() {
        try {
            // Log metrics to console
            console.log('Health Metrics:', this.healthMetrics);

            // Save to Google Sheets
            const metrics = [
                this.lastCheck.getTime(),
                this.healthMetrics.game.phaseChanges,
                this.healthMetrics.game.roundChanges,
                this.healthMetrics.sheets.syncErrors,
                this.healthMetrics.sheets.backupErrors,
                this.healthMetrics.network.latency,
                this.healthMetrics.network.connectionErrors
            ];

            await gameSheets.updateSheetData('Health Metrics!A2:H', [metrics]);
        } catch (error) {
            console.error('Error logging metrics:', error);
            throw error;
        }
    }

    async getAlerts() {
        try {
            return this.alerts;
        } catch (error) {
            console.error('Error getting alerts:', error);
            throw error;
        }
    }

    async clearAlerts() {
        try {
            this.alerts = [];
            console.log('Alerts cleared successfully');
        } catch (error) {
            console.error('Error clearing alerts:', error);
            throw error;
        }
    }

    async getHealthReport() {
        try {
            return {
                timestamp: new Date().toISOString(),
                game: this.healthMetrics.game,
                sheets: this.healthMetrics.sheets,
                network: this.healthMetrics.network,
                alerts: this.alerts
            };
        } catch (error) {
            console.error('Error getting health report:', error);
            throw error;
        }
    }

    async monitorPerformance() {
        try {
            // Check memory usage
            const memoryUsage = process.memoryUsage();
            
            // Check CPU usage
            const cpuUsage = process.cpuUsage();

            // Log performance metrics
            const metrics = [
                this.lastCheck.getTime(),
                memoryUsage.heapUsed,
                memoryUsage.heapTotal,
                cpuUsage,
                process.uptime()
            ];

            await gameSheets.updateSheetData('Performance Metrics!A2:E', [metrics]);
        } catch (error) {
            console.error('Error monitoring performance:', error);
            throw error;
        }
    }

    async monitorSecurity() {
        try {
            // Check for suspicious API calls
            const recentCalls = await gameSheets.getRecentApiCalls();
            if (recentCalls.length > 100) {
                this.addAlert('High API call frequency detected');
            }

            // Check for unauthorized access attempts
            const accessLogs = await gameSheets.getAccessLogs();
            if (accessLogs.filter(log => log.type === 'failed').length > 5) {
                this.addAlert('Multiple failed access attempts detected');
            }
        } catch (error) {
            console.error('Error monitoring security:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const monitoring = new Monitoring();

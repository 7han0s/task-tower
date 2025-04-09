/**
 * task-importer.js
 * Handles importing and exporting tasks from various file formats
 */

const TaskImporter = (function() {
    const parsers = {
        json: parseJsonTasks,
        csv: parseCsvTasks,
        markdown: parseMarkdownTasks
    };

    const formatters = {
        json: formatJsonTasks,
        csv: formatCsvTasks,
        markdown: formatMarkdownTasks
    };

    const validationRules = {
        description: {
            required: true,
            maxLength: 100,
            pattern: /^[\w\s\-\.,!?:;()]+$/
        },
        category: {
            required: true,
            allowedValues: ['personal', 'chores', 'work']
        },
        time: {
            required: false,
            min: 0,
            max: 1440 // 24 hours in minutes
        },
        big: {
            required: false,
            type: 'boolean'
        }
    };

    function validateTask(task, index) {
        const errors = [];
        
        Object.entries(validationRules).forEach(([field, rules]) => {
            const value = task[field];
            
            if (rules.required && !value) {
                errors.push(`Task ${index + 1}: Required field '${field}' is missing`);
                return;
            }
            
            if (field === 'description' && value) {
                if (value.length > rules.maxLength) {
                    errors.push(`Task ${index + 1}: Description is too long (max ${rules.maxLength} characters)`);
                }
                if (!rules.pattern.test(value)) {
                    errors.push(`Task ${index + 1}: Description contains invalid characters`);
                }
            }
            
            if (field === 'category' && value) {
                if (!rules.allowedValues.includes(value.toLowerCase())) {
                    errors.push(`Task ${index + 1}: Invalid category '${value}'. Must be one of: ${rules.allowedValues.join(', ')}`);
                }
            }
            
            if (field === 'time' && value !== undefined) {
                if (typeof value !== 'number') {
                    errors.push(`Task ${index + 1}: Time must be a number`);
                    return;
                }
                if (value < rules.min || value > rules.max) {
                    errors.push(`Task ${index + 1}: Time must be between ${rules.min} and ${rules.max} minutes`);
                }
            }
            
            if (field === 'big' && value !== undefined) {
                if (typeof value !== 'boolean') {
                    errors.push(`Task ${index + 1}: Big task value must be a boolean`);
                }
            }
        });
        
        return errors;
    }

    function formatJsonTasks(tasks) {
        return JSON.stringify(tasks, null, 2);
    }

    function formatCsvTasks(tasks) {
        const headers = ['description', 'category', 'time', 'big'];
        const rows = [headers.join(',')];
        
        tasks.forEach(task => {
            const row = headers.map(header => {
                const value = task[header];
                if (typeof value === 'boolean') return value ? 'true' : 'false';
                return value;
            });
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    function formatMarkdownTasks(tasks) {
        const headers = ['description', 'category', 'time', 'big'];
        const headerRow = `| ${headers.join(' | ')} |`;
        const separatorRow = `|${headers.map(() => ' --- ').join('|')}|`;
        
        const rows = [headerRow, separatorRow];
        
        tasks.forEach(task => {
            const row = headers.map(header => {
                const value = task[header];
                if (typeof value === 'boolean') return value ? 'true' : 'false';
                return value;
            });
            rows.push(`| ${row.join(' | ')} |`);
        });
        
        return rows.join('\n');
    }

    function parseJsonTasks(fileContent) {
        try {
            const tasks = JSON.parse(fileContent);
            if (!Array.isArray(tasks)) {
                throw new Error('Invalid JSON format: Root element must be an array');
            }
            
            const errors = tasks.flatMap((task, index) => validateTask(task, index));
            if (errors.length > 0) {
                throw new Error(`Validation errors:\n${errors.join('\n')}`);
            }
            
            return tasks;
        } catch (error) {
            throw new Error(`Invalid JSON format: ${error.message}`);
        }
    }

    function parseCsvTasks(fileContent) {
        const rows = fileContent.split('\n');
        if (rows.length < 2) {
            throw new Error('Invalid CSV format: At least one task row is required');
        }
        
        const headers = rows[0].split(',').map(header => header.trim().toLowerCase());
        if (!headers.includes('description')) {
            throw new Error('Invalid CSV format: Missing required description column');
        }
        
        const tasks = rows.slice(1).map(row => {
            const values = row.split(',').map(value => value.trim());
            const task = {};
            
            for (let i = 0; i < headers.length; i++) {
                const header = headers[i];
                const value = values[i];
                
                if (header === 'description') task.description = value;
                else if (header === 'category') task.category = value;
                else if (header === 'time') task.time = parseInt(value);
                else if (header === 'big') task.big = value.toLowerCase() === 'true';
            }
            
            return task;
        }).filter(task => task.description);

        const errors = tasks.flatMap((task, index) => validateTask(task, index));
        if (errors.length > 0) {
            throw new Error(`Validation errors:\n${errors.join('\n')}`);
        }

        return tasks;
    }

    function parseMarkdownTasks(fileContent) {
        const rows = fileContent.split('\n');
        
        // Find table header row (contains |---|---| etc.)
        const headerIndex = rows.findIndex(row => row.includes('|---|'));
        if (headerIndex === -1) {
            throw new Error('Invalid Markdown table format: No header row found');
        }
        
        const headers = rows[headerIndex - 1].split('|')
            .map(cell => cell.trim().toLowerCase())
            .filter(cell => cell);
        
        if (!headers.includes('description')) {
            throw new Error('Invalid Markdown table format: Missing required description column');
        }
        
        const tasks = rows.slice(headerIndex + 1)
            .map(row => {
                const cells = row.split('|')
                    .map(cell => cell.trim())
                    .filter(cell => cell);
                
                if (cells.length !== headers.length) return null;
                
                const task = {};
                for (let i = 0; i < headers.length; i++) {
                    const header = headers[i];
                    const value = cells[i];
                    
                    if (header === 'description') task.description = value;
                    else if (header === 'category') task.category = value;
                    else if (header === 'time') task.time = parseInt(value);
                    else if (header === 'big') task.big = value.toLowerCase() === 'true';
                }
                
                return task;
            })
            .filter(task => task && task.description);

        const errors = tasks.flatMap((task, index) => validateTask(task, index));
        if (errors.length > 0) {
            throw new Error(`Validation errors:\n${errors.join('\n')}`);
        }

        return tasks;
    }

    return {
        importTasks: async function(file) {
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = function(e) {
                    try {
                        const format = document.getElementById('task-import-format').value;
                        const parser = parsers[format];
                        if (!parser) {
                            reject(new Error(`Unsupported format: ${format}`));
                            return;
                        }
                        
                        const tasks = parser(e.target.result);
                        resolve({
                            tasks,
                            preview: tasks.map(task => ({
                                description: task.description,
                                category: task.category,
                                time: task.time,
                                big: task.big
                            }))
                        });
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = function() {
                    reject(new Error('Error reading file'));
                };

                reader.readAsText(file);
            });
        },

        exportTasks: function(tasks, format) {
            const formatter = formatters[format];
            if (!formatter) {
                throw new Error(`Unsupported format: ${format}`);
            }

            const content = formatter(tasks);
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `tasks.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    };
})();

// Export to window scope
window.TaskImporter = TaskImporter;
